const babel=require("C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\.tools\\tizen3-build\\node_modules\\@babel\\core");const fs=require('fs');
const src=fs.readFileSync("C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\legacy-build\\tmp-polyfill\\poly-bundle.js",'utf8');
const out=babel.transformSync(src,{filename:'poly-bundle.js',sourceType:'script',babelrc:false,configFile:false,comments:false,compact:true,presets:[[require.resolve("C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\.tools\\tizen3-build\\node_modules\\@babel\\preset-env"),{targets:{ie:'11'},modules:false,bugfixes:true,useBuiltIns:false}]]}).code;
fs.writeFileSync("C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\legacy-build\\tmp-polyfill\\poly-es5.js",out);console.log('BABEL-OK '+out.length);
