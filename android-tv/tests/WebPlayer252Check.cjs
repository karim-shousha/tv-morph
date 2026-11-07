const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const helper=fs.readFileSync('tv-project/app/player-chrome.js','utf8'),css=fs.readFileSync('tv-project/app/player-chrome.css','utf8');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const family of ['samsung','lg']){
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://morph.fixture/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));await page.goto('http://morph.fixture/');
 await page.evaluate(family=>{window.platformCalls=[];window.MorphLocale={get:()=> 'en',t:(a,b)=>b};window.ClearTV={settings:{accent:'#36d19a',cardColor:'#18382c'},Profiles:{active:()=> 'default',list:()=>[{id:'default',name:'Test'}]},Remote:{key:()=>({sent:true}),text:()=>({sent:false})},PlaybackRate:{values:[.5,.75,1,1.5,2],words:()=>['Speed','Unsupported','Wait'],apply:(v,r)=>(v.playbackRate=r),nativeNotice:()=> 'Samsung native speed stays at 1x.'},toast:()=>{}};
 localStorage.setItem('morph.'+(family==='lg'?'webos':'samsung')+'.iptv',JSON.stringify({server:'http://provider.fixture',username:'fixture',password:'fixture',profileId:'fixture'}));
 let state='PLAYING';const av={getState:()=>state,getDuration:()=>60000,getTotalTrackInfo:()=>[{type:'AUDIO',index:1,extra_info:'{"language":"English"}'},{type:'TEXT',index:2,extra_info:'{"language":"Arabic"}'}],getCurrentStreamInfo:()=>[{type:'AUDIO',index:1}],getStreamingProperty:()=> '1000000|2500000',setSelectTrack:(...a)=>platformCalls.push(['track',...a]),setSilentSubtitle:()=>{},setSpeed:()=>{},open:()=>{state='IDLE'},close:()=>{},stop:()=>{},play:()=>{state='PLAYING'},pause:()=>{state='PAUSED'},setDisplayRect:()=>{},setDisplayMethod:()=>{},setListener:()=>{},seekTo:(n,done)=>{if(done)done()},jumpForward:()=>{},jumpBackward:()=>{},setBufferingParam:(...a)=>platformCalls.push(['buffer',...a]),setStreamingProperty:(...a)=>platformCalls.push(['stream',...a]),prepareAsync:done=>setTimeout(done,0)};window.webapis={avplay:av};
 window.XMLHttpRequest=class{open(){}send(){this.status=200;this.responseText='[]';setTimeout(()=>this.onload&&this.onload(),0)}abort(){}};
 Object.defineProperty(HTMLMediaElement.prototype,'play',{value:function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()}});HTMLMediaElement.prototype.pause=function(){};
 },family);
 await page.addStyleTag({content:css});await page.addScriptTag({content:helper});await page.addScriptTag({content:fs.readFileSync(family==='samsung'?'mobile-app/samsung-media.js':'webos-app/build/app/lg-media.js','utf8')});
 await page.evaluate(family=>window[family==='lg'?'MorphMedia':'SamsungMedia'].action('play',{id:'7',kind:'vod',name:'Fixture film',genre:'Drama',year:'2026',plot:'Fixture metadata',ext:'mp4'}),family);
 await page.waitForSelector('#morph-player.morph252');
 const initial=await page.locator('.morph2-dockwrap').boundingBox();assert.equal(Math.round(initial.width),960);assert(await page.locator('.morph2-meta').isHidden());assert(initial.height<=100,'Reduced dock height');const panelColor=await page.locator('.morph2-dockwrap').evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(panelColor,'rgba(0, 0, 0, 0)','Dock has no background');
 await page.getByRole('button',{name:'Settings',exact:true}).click();const title=page.locator('[data-section=quality]>.morph252-title');assert.equal(await title.getAttribute('aria-expanded'),'true');await title.click();assert.equal(await title.getAttribute('aria-expanded'),'false');await title.click();assert.equal(await title.getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');assert(await page.locator('.morph2-right').evaluate(e=>e.hidden));assert.deepEqual(await page.locator('.morph2-dockwrap').boundingBox(),initial);await page.keyboard.press('Escape');assert(await page.locator('#morph-player').evaluate(e=>e.classList.contains('morph2-hidden')));
 await page.keyboard.press('Enter');await page.getByRole('button',{name:'Settings',exact:true}).click();await title.click();await page.locator('[data-section=audio]>.morph252-title').click();
 const right=await page.locator('.morph2-right').boundingBox();assert.equal(right.y,0);assert.equal(Math.round(right.y+right.height),1080);assert(right.x>=initial.x+initial.width);
 assert.equal(await page.locator('.morph2-lefthead button').count(),0);
 if(family==='samsung')assert(await page.evaluate(()=>platformCalls.some(a=>a[0]==='buffer'&&a[3]===1)));
 assert.deepEqual(errors,[]);console.log('PASS '+family+': real player source, fixed dock/card, accordion, Back sequence, theme, panel alignment');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

