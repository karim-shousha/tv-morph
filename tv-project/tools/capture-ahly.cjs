const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const state=JSON.parse(fs.readFileSync('tv-project/ahly-preview-state.json','utf8'));
const b=await chromium.launch({headless:true,channel:'msedge'}),p=await b.newPage({viewport:{width:1920,height:1080}});
await p.route('https://**',r=>r.abort());
await p.addInitScript(state=>{Object.keys(state.storage).forEach(k=>localStorage.setItem('cleartv.'+k,JSON.stringify(state.storage[k])));window.tizen={application:{getAppsInfo:ok=>ok(state.apps)},systeminfo:{getPropertyValue:(k,ok)=>ok({connected:state.sources.filter(s=>s.connected),disconnected:state.sources.filter(s=>!s.connected)})},tvwindow:{getSource:()=>({type:'HDMI',number:2})}};},state);
await p.goto('file:///'+path.resolve('tv-project/app/index.html').replace(/\\/g,'/'));await p.waitForFunction(()=>document.querySelector('.club-hero-logo').complete);await p.evaluate(()=>ClearTV.Focus.focus(document.querySelector('#favourites .favourite')));await p.waitForTimeout(200);await p.screenshot({path:'tv-project/Al-Ahly-Club-of-the-Century.png'});await b.close();console.log('Preview screenshot saved using the installed TV app preferences and cached weather.');
})().catch(e=>{console.error(e);process.exitCode=1;});
