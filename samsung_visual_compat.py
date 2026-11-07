"""Preserve the shared TV presentation on Tizen 5's Chromium 63 engine."""
from pathlib import Path
import re,subprocess,shutil

ROOT=Path(__file__).resolve().parent

def lower_viewport_clamps(css):
    """Preserve bounded px/vw/vh sizing on engines without CSS clamp()."""
    number=r'(\d*\.?\d+)'
    declaration=re.compile(r'([\w-]+)\s*:\s*clamp\(\s*'+number+r'px\s*,\s*'+number+r'(vw|vh)\s*,\s*'+number+r'px\s*\)(\s*!important)?')
    def rule(match):
        header,body=match[1],match[2]
        selector=re.sub(r'/\*.*?\*/','',header,flags=re.S).strip()
        if not selector or selector.startswith('@') or selector in ('from','to') or selector.endswith('%'):return match[0]
        bounds=[]
        def lower(value):
            prop,minimum,factor,unit,maximum,priority=value.groups()
            low,scale,high=float(minimum),float(factor),float(maximum)
            if scale<=0 or low>high:return value[0]
            priority=priority or ''
            axis='width' if unit=='vw' else 'height'
            bounds.extend(['@media(max-'+axis+':'+format(low*100/scale,'.8g')+'px){'+selector+'{'+prop+':'+minimum+'px'+priority+'}}',
                           '@media(min-'+axis+':'+format(high*100/scale,'.8g')+'px){'+selector+'{'+prop+':'+maximum+'px'+priority+'}}'])
            fallback=prop+':'+factor+unit+priority
            return fallback if prop.startswith('--') else fallback+';'+value[0]
        body=declaration.sub(lower,body)
        return header+'{'+body+'}'+''.join(bounds)
    return re.sub(r'([^{}]+)\{([^{}]*)\}',rule,css)

def lower_logical_pairs(css):
    def pair(match):
        name,value=match.group(1),match.group(2)
        important='!important' if '!important' in value else ''
        value=value.replace('!important','').strip()
        parts=re.split(r'\s+(?![^()]*\))',value)
        if len(parts)>2:return match[0]
        first,second=parts[0],parts[-1]
        family,axis=name.rsplit('-',1)
        edges=('left','right') if axis=='inline' else ('top','bottom')
        if family=='inset':return ';'.join(edge+':'+v+important for edge,v in zip(edges,(first,second)))
        return ';'.join(family+'-'+edge+':'+v+important for edge,v in zip(edges,(first,second)))
    return re.sub(r'\b((?:margin|padding|inset)-(?:inline|block))\s*:\s*([^;{}]+)',pair,css)

def prepare_tizen5(folder):
    folder=Path(folder)
    from launcher_css_compat import selector_fallbacks
    from samsung_compat import fallback
    esbuild=ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'
    for file in folder.rglob('*.css'):
        css=lower_viewport_clamps(lower_logical_pairs(selector_fallbacks(file.read_text(encoding='utf-8'))))
        # Flex gap is absent even though Grid is present. These rules are gated
        # by capability classes; Grid fallbacks remain inactive on Tizen 5.
        css+='\n'+fallback(css)
        css=re.sub(r'(?<![\w-])overflow\s*:\s*(hidden|auto|scroll|visible|clip)\s+(hidden|auto|scroll|visible|clip)(\s*!important)?(?=\s*[;}])',
                   lambda m:'overflow-x:'+m[1]+(m[3] or '')+';overflow-y:'+m[2]+(m[3] or ''),css)
        # Chromium 63 implements the older WebKit logical edges, preserving RTL.
        # Missing these aliases shifts Radio's clock and DLNA's header controls.
        css=re.sub(r'(?<![\w-])((?:margin|padding|border)-inline-(?:start|end)(?:-(?:width|style|color))?)\s*:\s*([^;{}]+)',
                   lambda m:'-webkit-'+m[1].replace('-inline-', '-')+':'+m[2]+';'+m[0],css)
        # Chromium 63 rejects double-position stops inside prefixed mask shorthands.
        # These solid masks draw a hollow border on modern engines; rejecting them
        # leaves the entire decoration opaque and changes every card's colour.
        css=re.sub(r'linear-gradient\(\s*(#[\da-fA-F]{3,8}|white|black)\s+0(?:px|%)?\s+0(?:px|%)?\s*\)',r'linear-gradient(\1,\1)',css)
        css=re.sub(r'(?<![\w-])(column-gap|row-gap|gap)\s*:\s*([^;{}]+)',lambda m:'grid-'+m[1]+':'+m[2]+';'+m[0] if m[1]!='gap' else 'grid-gap:'+m[2]+';'+m[0],css)
        temporary=folder.parent/'tizen5-css-input.css';temporary.write_text(css,encoding='utf-8')
        subprocess.run([str(esbuild),str(temporary),'--target=chrome63','--outfile='+str(file),'--log-level=error'],check=True)
    for name in ['tizen5-compat.js','tizen5-compat.css']:
        shutil.copy2(ROOT/'samsung-current'/name,folder/name)
    for page in folder.rglob('*.html'):
        prefix='../'*len(page.relative_to(folder).parts[:-1])
        html=page.read_text(encoding='utf-8')
        html=html.replace('<head>','<head><script src="'+prefix+'tizen5-compat.js"></script>',1)
        html=html.replace('</body>','<link rel="stylesheet" href="'+prefix+'tizen5-compat.css"></body>')
        page.write_text(html,encoding='utf-8')
