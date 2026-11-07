const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),assert=require('assert');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><section id="dlna-panel">
<button id="dlna-scan"></button><button id="dlna-file"></button><p id="dlna-file-name"></p><div id="dlna-devices"></div>
<label for="dlna-url"></label><input id="dlna-url"><label for="dlna-kind"></label><select id="dlna-kind"><option value="video">v</option><option value="audio">a</option></select>
<button id="dlna-send-file"></button><button id="dlna-send"></button><button id="dlna-play"></button><button id="dlna-pause"></button><button id="dlna-stop"></button>
<button id="dlna-back"></button><button id="dlna-fwd"></button><button id="dlna-voldn"></button><button id="dlna-volup"></button><button id="dlna-mute"></button>
<p id="dlna-status"></p><p id="dlna-caps"></p></section></body></html>`;
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.setContent(html);await page.addScriptTag({path:path.resolve('mobile-app/assets/ui/dlna-cast.js')});
await page.evaluate(()=>{window.calls=[];window.MorphNative={call(action,data){calls.push({action,data});return new Promise((resolve,reject)=>{setTimeout(()=>{try{
if(action==='dlnaDiscover')resolve([{id:'r1',name:'Renderer One',ip:'192.168.1.50'},{id:'r2',name:'Renderer Two',ip:'192.168.1.51'}]);
else if(action==='dlnaConnect'){if(data.device==='bad')throw Error('nope');resolve({connected:true});}
else if(action==='dlnaCaps')resolve(data.device==='r1'?{seek:true,volume:false}:{seek:true,volume:true});
else if(action==='dlnaPosition')resolve({position:100,duration:600,state:'PLAYING'});
else if(action==='dlnaSeek'){if(data.seconds!==130)throw Error('wrong target');resolve({accepted:true,target:130});}
else if(action==='dlnaVolume'){resolve({accepted:true,volume:data.level});}
else if(action==='dlnaMute')resolve({accepted:true,mute:data.mute});
else if(action==='dlnaPickFile')resolve({name:'clip.mp4'});
else resolve({accepted:true});
}catch(e){reject(e);}},5);});}};});
await page.click('#dlna-scan');await page.waitForSelector('#dlna-devices button');
assert.equal(await page.locator('#dlna-devices button').count(),2);
await page.locator('#dlna-devices button').first().click();
await page.waitForFunction(()=>document.getElementById('dlna-caps').textContent.includes('Volume'));
assert(await page.locator('#dlna-back').isEnabled());assert(await page.locator('#dlna-fwd').isEnabled());
assert(await page.locator('#dlna-voldn').isDisabled());assert(await page.locator('#dlna-volup').isDisabled());assert(await page.locator('#dlna-mute').isDisabled());
assert((await page.locator('#dlna-caps').innerText()).includes('not supported'));
await page.click('#dlna-fwd');await page.waitForFunction(()=>window.calls.some(c=>c.action==='dlnaSeek'));
assert.deepEqual(await page.evaluate(()=>window.calls.find(c=>c.action==='dlnaSeek').data),{device:'r1',seconds:130});
await page.locator('#dlna-devices button').nth(1).click();
await page.waitForFunction(()=>document.getElementById('dlna-caps').textContent.includes('Volume: ')||document.getElementById('dlna-caps').textContent.includes('Volume available'));
assert(await page.locator('#dlna-volup').isEnabled());assert(await page.locator('#dlna-mute').isEnabled());
await page.click('#dlna-volup');await page.waitForFunction(()=>window.calls.some(c=>c.action==='dlnaVolume'));
await page.click('#dlna-mute');await page.waitForFunction(()=>window.calls.some(c=>c.action==='dlnaMute'));
assert.deepEqual(await page.evaluate(()=>window.calls.find(c=>c.action==='dlnaMute').data),{device:'r2',mute:true});
await page.click('#dlna-back');await page.waitForFunction(()=>window.calls.filter(c=>c.action==='dlnaSeek').length===2);
assert.deepEqual(await page.evaluate(()=>window.calls.filter(c=>c.action==='dlnaSeek').pop().data),{device:'r2',seconds:70});
await page.click('#dlna-scan');await page.waitForFunction(()=>window.calls.filter(c=>c.action==='dlnaDiscover').length===2);
assert(await page.locator('#dlna-back').isDisabled());assert(await page.locator('#dlna-mute').isDisabled());
assert.equal(await page.locator('#dlna-caps').innerText(),'');
assert.deepEqual(errors,[]);console.log('PASS dlna-cast UI: scan, connect, caps-gated seek/volume/mute, position-based targets, rescan reset, no errors');
}catch(e){console.error(e);process.exit(1);}finally{await browser.close();}})();
