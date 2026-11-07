"""Generate layout fallbacks alongside the original Samsung stylesheets.

Tizen 4 / Chromium 56 has no CSS Grid. Keep the original rules for newer TVs;
only engines without Grid receive these scoped flex layouts.
"""
import re
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

def lower_focus_mask(source):
    """Keep the focus ring hollow on pre-double-position-gradient WebKit.

    Those engines expose webkitMaskComposite but reject '#fff 0 0', leaving
    the unmasked gradient painted across the entire focused control.
    Identical-color endpoints preserve the original opaque mask geometry.
    """
    return source.replace('linear-gradient(#fff 0 0)',
                          'linear-gradient(#fff,#fff)')

def lower_inset(css):
    def expand(match):
        value=match[1].replace('!important','').strip().split()
        if not 1 <= len(value) <= 4:
            return match[0]
        top=value[0];right=value[1] if len(value)>1 else top
        bottom=value[2] if len(value)>2 else top
        left=value[3] if len(value)>3 else right
        priority='!important' if '!important' in match[1] else ''
        return ';'.join(edge+':'+v+priority for edge,v in zip(['top','right','bottom','left'],[top,right,bottom,left]))
    return re.sub(r'\binset\s*:\s*([^;}]+)',expand,css)

def tracks(value):
    match = re.match(r'repeat\(\s*(\d+)\s*,', value)
    if match:
        return [('fr',1)] * int(match[1])
    parts = re.findall(r'(?:[^\s(]+\([^)]*\)|[^\s]+)', value)
    if len(parts) < 2:
        return None
    return [('px',float(p[:-2])) if re.fullmatch(r'[\d.]+px',p) else ('fr',float(p[:-2]) if re.fullmatch(r'[\d.]+fr',p) else 1) for p in parts]

def scope(selector, flex=False):
    selector=selector.strip()
    prefix='html.morph-no-flex-gap' if flex else 'html.morph-legacy-layout'
    return prefix+selector[4:] if re.match(r'^html(?=[\s.#[:])',selector) else prefix+' '+selector

def variable_rules(css, media=()):
    """Keep media conditions when collecting variables for pre-CSS-variable TVs."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    result=[];cursor=0
    while cursor<len(css):
        start=css.find('{',cursor)
        if start<0:break
        depth=1;end=start+1
        while end<len(css) and depth:
            depth+=(css[end]=='{')-(css[end]=='}');end+=1
        selector=css[cursor:start].strip();body=css[start+1:end-1];cursor=end
        if selector.startswith('@media'):
            result.extend(variable_rules(body,media+(selector[6:].strip(),)));continue
        if selector.startswith('@'):continue
        values=dict(re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+)',body))
        if not values:continue
        for name in selector.split(','):
            name=name.strip()
            if name==':root' or name.startswith(('body','html')):
                row={'selector':name,'vars':values}
                if media:row['media']=list(media)
                result.append(row)
    return result


def fallback(css, _nested=False):
    from launcher_css_compat import split_selectors
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    output = []
    cursor = 0
    layouts = {}
    while cursor < len(css):
        start = css.find('{', cursor)
        if start < 0:
            break
        depth, end = 1, start + 1
        while end < len(css) and depth:
            depth += (css[end] == '{') - (css[end] == '}')
            end += 1
        selector, body = css[cursor:start].strip(), css[start+1:end-1]
        cursor = end
        if selector.startswith('@media'):
            output.append(selector+'{'+fallback(body,True)+'}')
            continue
        if selector.startswith('@'):
            continue
        declarations = dict((k.strip(), v.strip().replace('!important','').strip())
                            for k,v in re.findall(r'([\w-]+)\s*:\s*([^;{}]+)', body))
        columns = tracks(declarations.get('grid-template-columns',''))
        selectors = split_selectors(selector)
        # Later rules often change only gap, retaining display/direction from an
        # earlier rule with the same selector and repeated specificity IDs.
        normalized=re.sub(r'(#[\w-]+)(?:\1)+',r'\1',selector)
        prior=layouts.get(normalized,{})
        current=dict(prior);current.update(declarations);layouts[normalized]=current
        scoped = ','.join(scope(s) for s in selectors)
        children = ','.join(scope(s)+'>*' for s in selectors)
        gap = declarations.get('gap', declarations.get('grid-gap','0')).split()[0]
        if columns:
            output.append(scoped+'{display:flex!important;flex-wrap:wrap!important;align-content:flex-start;gap:0!important}')
            # Fractional columns retain their proportions; the last gap remains
            # inside the available width, avoiding horizontal overflow.
            fixed=sum(v for unit,v in columns if unit=='px')
            fractions=sum(v for unit,v in columns if unit=='fr') or 1
            for index, (unit,weight) in enumerate(columns):
                nth = ','.join(scope(s)+'>:nth-child('+str(len(columns))+'n+'+str(index+1)+')' for s in selectors)
                width = str(weight)+'px' if unit=='px' else str(100*weight/fractions)+'% - '+str(fixed*weight/fractions)+'px'
                row=declarations.get('grid-auto-rows','')
                height='height:'+row+'!important;' if row and row!='auto' else ''
                output.append(nth+'{box-sizing:border-box;flex:0 0 calc('+width+' - '+gap+');width:calc('+width+' - '+gap+')!important;'+height+'min-width:0;margin-right:'+gap+';margin-bottom:'+gap+'}')
        elif current.get('display') in ('flex','inline-flex') and 'gap' in declarations and gap not in ('0','0px'):
            edge = 'bottom' if current.get('flex-direction') == 'column' else 'right'
            for item in selectors:
                output.append(scope(item,True)+'>*:not(:last-child){margin-'+edge+':'+gap+'!important}')
    # A generated display:flex !important must never reveal a hidden view or
    # panel. The shared presentation uses highly specific ID selectors, so the
    # standard hidden contract needs equivalent priority on old engines.
    if not _nested:
        priority=':not(#morph-hidden-guard)'*32
        output.append('html.morph-legacy-layout'+priority+' [hidden],html.morph-no-flex-gap'+priority+' [hidden]{display:none!important}')
    return ''.join(output)


def stage_samsung_ime(root):
    """Install before app key handlers, without changing Android/desktop input."""
    root=Path(root)
    (root/'samsung-plus-ime.js').write_bytes((Path(__file__).parent/'samsung-plus-ime.js').read_bytes())
    for page in root.rglob('*.html'):
        html=page.read_text(encoding='utf-8')
        if 'samsung-plus-ime.js' in html:continue
        prefix='../'*len(page.relative_to(root).parts[:-1])
        page.write_text(html.replace('</head>','<script src="'+prefix+'samsung-plus-ime.js"></script></head>'),encoding='utf-8')

def stage_samsung_layout(root):
    """Inject the same Samsung-only correction into every document, including nested surfaces."""
    root=Path(root)
    for script in root.rglob('*.js'):
        original=script.read_text(encoding='utf-8')
        lowered=lower_focus_mask(original)
        if lowered!=original:script.write_text(lowered,encoding='utf-8')
    (root/'samsung-layout-fixes.css').write_bytes((Path(__file__).parent/'samsung-layout-fixes.css').read_bytes())
    for page in root.rglob('*.html'):
        html=page.read_text(encoding='utf-8')
        if 'samsung-layout-fixes.css' in html:continue
        prefix='../'*len(page.relative_to(root).parts[:-1])
        html=html.replace('</head>', '<script>document.documentElement.classList.add("morph-samsung-compat");</script><link rel="stylesheet" href="'+prefix+'samsung-layout-fixes.css"></head>')
        page.write_text(html,encoding='utf-8')
