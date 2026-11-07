const assert=require('assert'),path=require('path');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const b=await chromium.launch({headless:true,channel:'msedge'}),p=await b.newPage({viewport:{width:1920,height:1080}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.route('https://**',r=>r.abort());
await p.addInitScript(()=>{
 let source={type:'HDMI',number:3};window.sourceChanges=[];
 window.tizen={systeminfo:{getPropertyValue:(key,ok)=>ok({connected:[{type:'TV',number:1},{type:'HDMI',number:2}],disconnected:[{type:'HDMI',number:1},{type:'HDMI',number:3}]})},application:{launch:(id,ok)=>{source={type:'TV',number:1};ok();},getAppsInfo:ok=>ok([{id:'com.samsung.tv.cobalt-yt',name:'YouTube'},{id:'rKpKZvmSog.IPTVSmartersPro',name:'IPTV Smarters Pro'}])},tvwindow:{getSource:()=>source,setSource:(s,ok)=>{source=s;sourceChanges.push(s);ok();},show:ok=>ok(),hide:ok=>ok()},tvchannel:{getCurrentChannel:()=>({channelName:'Test channel',major:7}),getCurrentProgram:()=>({title:'Programme fixture',description:'A test broadcast programme.'})}};
});
await p.goto('file:///'+path.resolve('tv-project/app/index.html').replace(/\\/g,'/'));
await p.locator('#nav-inputs').click();assert.equal(await p.locator('.source-card').count(),4);
assert((await p.locator('[data-source="HDMI2"] .source-state').textContent()).includes('Connected'));
assert((await p.locator('[data-source="HDMI3"] .source-state').textContent()).includes('Not connected'));
await p.locator('[data-source="HDMI2"]').click();assert(await p.locator('body').evaluate(e=>e.classList.contains('watching')));assert.equal(await p.locator('#watch-title').textContent(),'HDMI 2');
await p.keyboard.press('Escape');assert(await p.locator('#watch-controls').isHidden());
await p.locator('[data-source="TV1"]').click();await p.evaluate(()=>ClearTV.Inputs.refreshProgramme());assert.equal(await p.locator('.programme-title').textContent(),'Programme fixture');
await p.locator('#nav-settings').click();await p.locator('#setting-theme').click();assert.equal(await p.locator('.theme-option').count(),6);
await p.locator('.theme-option.ahly').click();await p.keyboard.press('Escape');await p.locator('#nav-home').click();
assert(await p.locator('.club-hero-logo').isVisible());assert(await p.locator('.club-hero-logo').evaluate(i=>i.complete&&i.naturalWidth>0));
await p.evaluate(()=>{document.getElementById('toast').hidden=true;ClearTV.Focus.focus(document.querySelector('#favourites .favourite'));});await p.waitForTimeout(200);await p.screenshot({path:'tv-project/tv-ahly-preview.png'});await p.locator('#nav-inputs').click();await p.screenshot({path:'tv-project/tv-inputs-preview.png'});
await p.reload();assert.equal(await p.locator('body').getAttribute('data-theme'),'ahly');assert.equal(errors.length,0,errors.join('\n'));
console.log('PASS: connected/disconnected sources, HDMI watch, Back restoration, broadcast programme metadata, six themes, crest loaded, saved Ahly theme, no script errors.');await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
