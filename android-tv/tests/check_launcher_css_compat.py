from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from launcher_css_compat import selector_fallbacks, expand
assert expand('.a:is(.b,.c)>button:where(:focus,:hover)') == ['.a.b>button:focus','.a.b>button:hover','.a.c>button:focus','.a.c>button:hover']
assert expand(':not(:is(.a,.b))') == []
assert expand('.a:is([x="a,b"],.c)') == ['.a[x="a,b"]','.a.c']
s = '@media(min-width:1px){/* :is() */.a:is(.b,.c){color:red;background:url("data:x,{a}")}}'
out = selector_fallbacks(s)
assert '.a.b,.a.c{color:red;background:url("data:x,{a}")}' in out
assert '.a:is(.b,.c){color:red' in out
assert out.count('@media') == 1 and out.count('/* :is() */') == 1
print('PASS selector compatibility: compound selectors, quoted comma, multiple groups, negation safety, media nesting and quoted data')
