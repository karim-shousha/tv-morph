const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url'),assert=require('assert');
const source=require('path').resolve(__dirname,'../build/assets/ui/index.html');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const results=[],errors=[];try{
 const p=await b.newPage({viewport:{width:412,height:915}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('morph.first-run.pearl.v1','1');localStorage.setItem('morph.support.last-shown',String(Date.now()));window.testCalls=[];window.testTV={};window.ClearNative={request(id,action,payload){testCalls.push({action,payload});const value=action==='info'?{phoneIp:'10.0.0.64',draft:{}}:action==='themePacks'?{list:[]}:action==='scan'?[testTV]:action==='connect'?testTV:action==='connectionStatus'?{selected:false}:action==='shareAndroid'?{url:'http://10.0.0.64:8765/app.apk'}:action==='installFireTV'?{installed:true,launched:true}:{};setTimeout(()=>window.nativeResult(id,true,value),5);}};});
 await p.goto(pathToFileURL(source).href);await p.waitForFunction(()=>window.MorphSetupOptions&&window.MorphConnectFlow);
 await p.evaluate(()=>{document.querySelectorAll('.page').forEach(n=>n.hidden=n.id!=='page-connect');});
 for(const lang of ['ar','en'])for(const tv of [
  {name:'Hisense Android TV',brand:'android',os:'Android TV'},
  {name:'TCL Google TV',brand:'android',os:'Google TV'},
  {name:'Sony BRAVIA',brand:'android',os:'Android TV'},
  {name:'Fire TV Stick',brand:'android',fireTV:true,os:'Fire OS'},
  {name:'Samsung 7 Series',brand:'samsung',os:'Tizen 5.0',osVersion:'5.0'},
  {name:'LG Living Room',brand:'lg',os:'webOS'}]){
  await p.evaluate(({tv,lang})=>{MorphLocale.set(lang);window.testTV={...tv,ip:'10.0.0.153',model:tv.name,developerReady:false};document.getElementById('wizard-change-device').click();},{tv,lang});
  await p.locator('#scan').click();await p.locator('#devices button').click();await p.waitForFunction(()=>document.getElementById('page-connect').dataset.wizardStep==='2');
  const sam=tv.brand==='samsung',lg=tv.brand==='lg';
  assert.equal(await p.locator('#setup-samsung-wgt').isVisible(),sam,`${tv.name}: WGT visibility`);
  assert.equal(await p.locator('#wizard-version').isVisible(),sam);
  assert.equal(await p.locator('.guide').isVisible(),!sam);
  assert.equal(await p.locator('.wizard-panel:visible').count(),1);
  if(sam){assert.equal(await p.locator('#wizard-tizen-version').inputValue(),'tizen5');assert(await p.locator('#setup-continue').isDisabled());}
  else{
   assert((await p.locator('#setup-continue').textContent()).includes(lang==='ar'?'التالي':'Next'));
   if(lg){await p.locator('#guide-next').click();assert.match(await p.locator('#guide-text').textContent(),/Developer Mode/);}
   await p.locator('#setup-continue').click();
   assert(await p.locator('#smart-install').isVisible());assert(await p.locator('#smart-install').isEnabled());
   assert(await p.locator('#setup-samsung-wgt').isHidden());
   if(lg){assert(await p.locator('#lg-key-pair').isVisible());assert(await p.locator('#public-tv-download').isHidden());}
   else{assert(await p.locator('#public-tv-download').isVisible());assert(await p.locator('#android-pair').isVisible());}
   await p.locator('#smart-install').click();await p.waitForTimeout(120);
   const expected=lg?'installLG':tv.fireTV?'installFireTV':'shareAndroid';
   assert(await p.evaluate(action=>testCalls.some(c=>c.action===action),expected),`${tv.name}: native ${expected}`);
  }
  for(const width of [320,412,768]){await p.setViewportSize({width,height:915});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${tv.name}: overflow ${width}`);}
  await p.setViewportSize({width:412,height:915});results.push({device:tv.name,lang,package:sam?'WGT':lg?'IPK':'APK',pass:true});
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors,note:'Real staged UI and click routing; native network/install responses mocked. No screenshots.'},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
