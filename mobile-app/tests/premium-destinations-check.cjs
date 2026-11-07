const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),{pathToFileURL}=require('url'),assert=require('assert');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('tvmorph.onboarded30','1');localStorage.setItem('morph.first-run.pearl.v1','1');localStorage.setItem('morph.welcome-support.v1','1');window.requests=[];
 window.ClearNative={saveDraft(s){window.saved=JSON.parse(s)},request(id,action,s){const payload=JSON.parse(s);requests.push({action,payload});const data=action==='info'?{phoneIp:'10.0.0.64',draft:{theme:'night'}}:action==='phoneIptvSummary'?{configured:false}:action==='phoneIptvOpen'||action==='remoteOpen'?{opened:true,embedded:true}:action==='scan'?[]:{};setTimeout(()=>nativeResult(id,true,data),0)}};});
 await page.goto(pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href);
 await page.waitForFunction(()=>document.body.hasAttribute('data-premium-mobile'));
 assert(await page.locator('#mobile-service-map .pm-service-cards').isHidden(),'Redundant service cards removed');assert.equal(await page.locator('html').getAttribute('data-app-appearance'),'light');
 for(const language of ['ar','en']){
  await page.evaluate(language=>{const e=document.getElementById('app-language');e.value=language;e.dispatchEvent(new Event('change',{bubbles:true}))},language);
  const labels=await page.locator('.bottom-nav .m30-nav-lb').allTextContents();assert(labels.includes('IPTV'));assert(labels.includes(language==='ar'?'الريموت':'Remote'));assert(labels.includes(language==='ar'?'الأجهزة':'Devices'));
  for(const name of ['home','control','play','design','apps','cast']){
   await page.evaluate(name=>Morph30.show(name),name);
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
   for(const width of [320,390,600]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+language+' '+name+' '+width);}
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
   if(['home','control','play','design'].includes(name))await page.screenshot({path:path.resolve('output/premium-'+name+'-'+language+'.png'),fullPage:true});
  }
 }
 await page.evaluate(()=>Morph30.show('control'));assert(await page.locator('#legacy-companion-remote').isHidden());
 const label=page.locator('#m30-control-segment [data-msub=remote] span');assert.equal(await label.evaluate(e=>getComputedStyle(e).webkitTextFillColor),'rgb(25, 51, 82)','Remote label is dark');await page.locator('#m30-gear-btn').click();assert(await page.locator('#m30-control-segment').isHidden(),'Remote strip hidden while settings are open');assert.equal(await page.locator('#m30-gear-sheet [data-msub]').count(),0,'No remote strip inside settings');await page.locator('#m30-settings-close').click();assert(await label.isVisible());
 await page.locator('#integrated-remote-open').click();await page.waitForFunction(()=>requests.some(r=>r.action==='remoteOpen'));
 await page.evaluate(()=>Morph30.show('play'));assert(await page.locator('#iptv-phone-open').isEnabled());const a=await page.locator('#iptv-phone-open').boundingBox(),z=await page.locator('#iptv-tv-show').boundingBox();assert(Math.abs(a.y-z.y)<2&&Math.abs(a.width-z.width)<2,'Equal side-by-side destination buttons');assert.equal(await page.locator('[data-msub=apps]').count(),0,'Apps management tab removed');await page.evaluate(()=>Morph30.show('apps'));assert(await page.locator('#page-remote').isVisible(),'Removed Apps route returns to Remote');await page.evaluate(()=>Morph30.show('play'));
 await page.locator('#iptv-phone-open').click();await page.waitForFunction(()=>requests.some(r=>r.action==='phoneIptvOpen'));
 assert(await page.locator('#apply').isDisabled());
 await page.locator('#iptv-tv-show').click();assert(await page.locator('#iptv-tv-controls').getAttribute('open')!==null);
 assert.deepEqual(errors,[]);console.log('PASS premium navigation: Devices, Remote, IPTV identity; independent phone IPTV/embedded remote without TV pairing; Arabic/English; all six pages at 320/390/600px; no runtime errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
