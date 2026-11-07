"""The embedded legacy build's pinned compatibility pipeline, applied to IPTV-only inputs."""
from pathlib import Path
import re,json,subprocess,shutil

def finish_legacy(root,app,polyfill,fallback,lower_inset,eight_digit_hex_to_rgba,inject_compat):
    base=root/('samsung-legacy2' if app.parent.name=='tizen2' else 'samsung-legacy')
    polyfill(root/'legacy-build/polyfills-entry.js',app/'legacy-polyfills.js')
    for name in ['legacy-es5-header.js','legacy-runtime.js','legacy-caps.js','legacy-light.css']:shutil.copy2(base/name,app/name)
    from samsung_compat import variable_rules
    rules=[]
    for css in app.rglob('*.css'):
        text=css.read_text(encoding='utf-8')
        rules.extend(variable_rules(text))
        text=eight_digit_hex_to_rgba(lower_inset(text)+'\n'+fallback(text))
        css.write_text(text,encoding='utf-8')
    (app/'legacy-variable-rules.js').write_text('window.MorphLegacyVariableRules='+json.dumps(rules,separators=(',',':'))+';',encoding='utf-8')
    order=['legacy-es5-header.js','legacy-polyfills.js','legacy-variable-rules.js','legacy-runtime.js','legacy-caps.js']
    for html in app.rglob('*.html'):
        prefix='../' if html.parent!=app else ''
        text,_=inject_compat(html.read_text(encoding='utf-8'),prefix,order)
        html.write_text(text,encoding='utf-8')
    # Babel and ES5 parser are exactly the pinned dependencies used by both embedded legacy variants.
    script=app.parent/'transpile-local.cjs'
    modules=root/'.tools/tizen3-build/node_modules'
    script.write_text("const fs=require('fs'),path=require('path'),babel=require("+json.dumps(str(modules/'@babel/core'))+"),acorn=require("+json.dumps(str(modules/'acorn'))+");function walk(dir){for(const name of fs.readdirSync(dir)){const f=path.join(dir,name);if(fs.statSync(f).isDirectory())walk(f);else if(name.endsWith('.js')){const output=babel.transformSync(fs.readFileSync(f,'utf8'),{filename:f,sourceType:'script',babelrc:false,configFile:false,comments:false,compact:true,presets:[[require.resolve("+json.dumps(str(modules/'@babel/preset-env'))+"),{targets:{ie:'11'},modules:false,bugfixes:true,useBuiltIns:false}]]}).code;acorn.parse(output,{ecmaVersion:5,allowReserved:true});fs.writeFileSync(f,output);}}}walk("+json.dumps(str(app))+");console.log('ES5 PASS');",encoding='utf-8')
    subprocess.run(['node',str(script)],check=True,capture_output=True)
    licenses=app/'legacy-licenses';licenses.mkdir(exist_ok=True)
    for package in ['core-js','css-vars-ponyfill','whatwg-fetch']:
        source=modules/package/'LICENSE'
        if source.exists():shutil.copy2(source,licenses/(package+'-LICENSE.txt'))
