// Studio layout + the existing native connection/apply/remote contracts.
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:940},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());
  await page.addInitScript(()=>{
   localStorage.setItem('tvmorph.onboarded30','1');localStorage.setItem('morph.welcome-support.v1','1');
   localStorage.setItem('tvmorph.appearance','dark');
   window.requests=[];window.reachable=false;
   window.ClearNative={saveDraft(s){window.saved=JSON.parse(s);},request(id,action,s){
    const payload=JSON.parse(s);requests.push({action,payload});
    const data=action==='info'?{phoneIp:'10.0.0.64',tvIp:'10.0.0.137',brand:'android',draft:{theme:'night'}}:
     action==='connectionStatus'?{selected:true,ready:window.reachable,message:'Connection unavailable'}:
     action==='pairAndroid'?{ip:payload.ip,brand:'android',name:'Test TV',model:'Fixture',developerReady:true}:
     action==='remoteConnect'?{ready:true,native:false,scope:'Morph TV'}:
     action==='apply'?{applied:true}:action==='remoteKey'?{sent:true}:
     action==='apps'?{apps:[{id:'YouTube',name:'YouTube'}],pins:['YouTube']}:
     action==='iptvSavedProfile'?{}:action==='scan'?[]:{};
    const success=action!=='remoteKey'||window.reachable;
    setTimeout(()=>window.nativeResult(id,success,success?data:'Connection unavailable'),0);
   }};
  });
  await page.goto(pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href);
  await page.waitForFunction(()=>document.body.hasAttribute('data-studio-shell'));
  await page.waitForFunction(()=>!document.getElementById('reconnect-notice').hidden);
  await page.locator('.bottom-nav [data-page=design]').click();
  assert(await page.locator('#reconnect-action').isVisible());
  assert.equal(await page.locator('#reconnect-action').textContent(),'Reconnect');
  assert(await page.locator('#reconnect-message').isHidden());
  assert(await page.locator('#apply').isDisabled());
  assert.equal(await page.locator('#theme-library').getAttribute('open'),null);
  assert.equal(await page.locator('#personal-touch').getAttribute('open'),null);
  assert.equal(await page.locator('#free-theme-image').getAttribute('open'),null);
  await page.waitForFunction(()=>document.getElementById('preview').hasAttribute('data-studio-default-preview'));
  await page.locator('#preview').evaluate(e=>e.style.background='linear-gradient(125deg,#112233,#445566)');
  await page.waitForFunction(()=>!document.getElementById('preview').hasAttribute('data-studio-default-preview'));
  assert((await page.locator('#preview').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('17, 34, 51'));
  await page.locator('#preview').evaluate(e=>e.style.background='linear-gradient(125deg,#0c1120,#292e46)');
  assert(await page.locator('.studio-app-icon').evaluate(e=>e.complete&&e.naturalWidth===1024));
  const order=await page.locator('#page-studio').evaluate(el=>{
   const ids=['#m30-design-heading','.preview-heading','#preview','.studio-theme-line','.studio-quick-actions','#studio-personal-title','.studio-personal-group'];
   return ids.map(s=>el.querySelector(s).getBoundingClientRect().top);
  });assert(order.every((v,i)=>!i||v>=order[i-1]),order);
  for(const language of ['ar','en'])for(const appearance of ['dark','light'])for(const width of [320,390,600]){
   await page.evaluate(({language,appearance})=>{const lang=document.getElementById('app-language');lang.value=language;lang.dispatchEvent(new Event('change',{bubbles:true}));const app=document.getElementById('app-appearance');app.value=appearance;app.dispatchEvent(new Event('change',{bubbles:true}));},{language,appearance});
   await page.setViewportSize({width,height:940});await page.evaluate(()=>window.scrollTo(0,0));
   const bounds=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,header:document.querySelector('header').getBoundingClientRect().height,button:document.getElementById('reconnect-action').getBoundingClientRect(),logo:document.querySelector('.brand').getBoundingClientRect(),bar:document.getElementById('m30-applybar').getBoundingClientRect(),nav:document.querySelector('.bottom-nav').getBoundingClientRect()}));
   assert(!bounds.overflow,JSON.stringify({language,appearance,width,bounds}));assert(bounds.header<=84);assert(bounds.logo.right<=bounds.button.left+1);assert(bounds.bar.bottom<=bounds.nav.top+2,JSON.stringify({language,appearance,width,bounds}));
   if(width===390)await page.screenshot({path:path.resolve('output/studio-mobile-'+language+'-'+appearance+'.png')});
  }
  await page.setViewportSize({width:390,height:940});
  // Compact Reconnect still opens the real setup flow and focuses the IP input.
  await page.locator('#reconnect-action').click();assert(await page.locator('#page-connect').isVisible());
  assert(await page.locator('#tv-ip').evaluate(e=>document.activeElement===e));
  await page.evaluate(()=>{window.reachable=true;window.checkMorphConnection();});
  await page.waitForFunction(()=>document.getElementById('connection-state').dataset.status==='connected');
  await page.locator('.bottom-nav [data-page=design]').click();assert(await page.locator('#apply').isEnabled());
  await page.locator('.studio-theme-line button').click();assert(await page.locator('#theme-library').getAttribute('open')!==null);
  await page.locator('.theme[data-theme=blue]').click();await page.waitForFunction(()=>window.saved&&window.saved.theme==='blue');
  assert((await page.locator('.studio-theme-name').textContent()).length>0);
  await page.locator('#apply').click();await page.waitForFunction(()=>window.requests.some(r=>r.action==='apply'&&r.payload.theme==='blue'));
  await page.locator('.studio-quick-actions [data-studio-destination=control]').click();assert(await page.locator('#page-remote').isVisible());
  await page.locator('#remote-connect').click();await page.waitForFunction(()=>!document.querySelector('[data-remote-key=UP]').disabled);
  await page.locator('[data-remote-key=UP]').click();await page.waitForFunction(()=>window.requests.some(r=>r.action==='remoteKey'&&r.payload.key==='UP'));
  await page.evaluate(()=>window.reachable=false);await page.locator('[data-remote-key=UP]').click();
  await page.waitForFunction(()=>!document.getElementById('reconnect-notice').hidden);assert(await page.locator('[data-remote-key=DOWN]').isDisabled());
  assert.equal(await page.locator('#reconnect-action').textContent(),'Reconnect');assert(await page.locator('#reconnect-action').isVisible());
  await page.locator('#m30-gear-btn').click();assert(await page.locator('#device-chip').isVisible());assert(await page.locator('#app-language').isVisible());
  await page.locator('#device-chip').click();assert(await page.locator('#m30-gear-sheet').isHidden());assert(await page.locator('#page-connect').isVisible());assert.deepEqual(errors,[]);
  console.log('PASS Studio: Arabic/English × light/dark × 320/390/600px; supplied icon; compact reconnect; disabled/enabled apply; real theme payload; remote command/error gating; settings. Native APIs mocked.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
