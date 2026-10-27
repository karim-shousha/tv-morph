"""Generate layout fallbacks alongside the original Samsung stylesheets.

Tizen 4 / Chromium 56 has no CSS Grid. Keep the original rules for newer TVs;
only engines without Grid receive these scoped flex layouts.
"""
import re

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

def scope(selector):
    selector=selector.strip()
    return 'html.morph-legacy-layout'+selector[4:] if re.match(r'^html(?=[\s.#[:])',selector) else 'html.morph-legacy-layout '+selector

def fallback(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    output = []
    cursor = 0
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
            output.append(selector+'{'+fallback(body)+'}')
            continue
        if selector.startswith('@'):
            continue
        declarations = dict((k.strip(), v.strip().replace('!important','').strip())
                            for k,v in re.findall(r'([\w-]+)\s*:\s*([^;{}]+)', body))
        columns = tracks(declarations.get('grid-template-columns',''))
        selectors = selector.split(',')
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
        elif declarations.get('display') in ('flex','inline-flex') and 'gap' in declarations:
            edge = 'bottom' if declarations.get('flex-direction') == 'column' else 'right'
            output.append(children+':not(:last-child){margin-'+edge+':'+gap+'}') if len(selectors)==1 else None
    return ''.join(output)
