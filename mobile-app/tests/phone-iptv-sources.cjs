const path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.resolve(process.env.MORPH_IPTV_FIXTURE_ROOT||'mobile-app/build/assets/iptv/index.html')).href;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});try{
for(const language of ['ar','en']){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.addInitScript(({language})=>{
  localStorage.setItem('tvmorph.iptv.first-source.v1','1');window.sent=[];
  window.IptvNative={exit(){window.exited=true},showKeyboard(){},hideKeyboard(){},importPlaylistFile(name){window.importedName=name},reloadSource(){window.reloadedSource=true},request(id,action,raw){const q=JSON.parse(raw);sent.push({action,payload:q});let data={};
   if(action==='summary')data=window.testPersonal?{configured:true,profileId:'my-fixture',name:'My IPTV',type:'xtream',publicMode:false,live:true,vod:true,series:true,subscription:{status:'Active',expires:4070908800},accounts:[{id:'my-fixture',name:'My IPTV',type:'xtream',active:true,subscription:{status:'Active',expires:4070908800}},{id:'second-fixture',name:'Family playlist',type:'m3u',active:false}]}:{configured:true,profileId:'public',name:'Free Arabic channels',type:'m3u',publicMode:true,publicSource:'arabic',live:true,vod:false,series:false,accounts:[]};
   if(action==='settings')data={language,resume:true};if(action==='profiles'||action==='history')data={items:[]};if(action==='categories'||action==='list')data={items:[],total:0,hasMore:false};
   if(action==='connect'){if(window.failConnect){setTimeout(()=>iptvResult(id,false,'Fixture: provider rejected connection'),0);return;}data={profileId:'my-fixture',name:q.name};}setTimeout(()=>iptvResult(id,true,data),0);
  }};
 },{language});
 await page.goto(url);await page.locator('#stream-loading').waitFor({state:'detached'});await page.locator('#iptv-first-source').waitFor();
 assert.equal(await page.locator('#iptv-first-source [data-choice]').count(),2);await page.locator('#phone-source-back').click();assert(await page.evaluate(()=>window.exited),'Choice back calls host exit');
 for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);const b=await page.locator('#iptv-first-source section').boundingBox();assert(b.x>=0&&b.x+b.width<=size.width+1,'Source choice fits');assert(await page.locator('[data-choice=free]').isVisible());}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(`output/phone-source-choice-${language}.png`)});
 await page.locator('[data-choice=add]').click();await page.locator('#iptv-settings-page-add').waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('tvmorph.phone.first-source.v1')),null,'Canceling account entry should not confirm a source');
 for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);
  const pageRect=await page.locator('#settings-panel .settings-dialog').boundingBox();assert(Math.abs(pageRect.width-size.width)<2&&Math.abs(pageRect.height-size.height)<2,'Settings occupy full screen');
  for(const [method,fields] of [['xtream',['name','server','port','user','password','format']],['m3u',['name','server']],['file',['name']],['portal',['name','server','port','mac']]]){
   await page.locator('#account-method-'+method).click();await page.waitForFunction(mode=>document.getElementById('account-panel').dataset.sourceScreen===mode,method);
   for(const id of ['name','server','port','user','password','format','mac'])assert.equal(await page.locator('#account-'+id).isVisible(),fields.includes(id),`${method}: ${id}`);
   assert.equal(await page.locator('#account-save').isVisible(),method!=='file');assert.equal(await page.locator('#account-import-file').isVisible(),method==='file');
   assert(await page.locator('.source-form-note').innerText());assert.equal(await page.locator('#source-inline-qr').count(),0,'TV QR helper excluded from phone');const inputWidth=await page.locator('#account-name').evaluate(e=>e.getBoundingClientRect().width);assert(inputWidth>size.width*.65,'Source form uses mobile width');
   const overflow=await page.evaluate(()=>{const d=document.querySelector('#settings-panel .settings-dialog');return d.scrollWidth>d.clientWidth+2});assert(!overflow,`Source ${method} fits ${size.width}`);
   if(size.width===390)await page.screenshot({path:path.resolve(`output/phone-source-${method}-${language}.png`)});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#account-method-file').click();await page.locator('#account-import-file').click();assert.equal(await page.evaluate(()=>window.importedName),'My TV');await page.evaluate(()=>MorphPlaylistFile.result(false,'Fixture picker canceled'));
 await page.locator('#account-method-m3u').click();await page.locator('#account-save').click();assert.equal(await page.locator('#iptv-feedback').getAttribute('data-state'),'error');assert.equal(await page.evaluate(()=>sent.filter(r=>r.action==='connect').length),0,'Empty input does not connect');
 await page.reload();await page.locator('#iptv-settings-page-add').waitFor({state:'visible'});assert(await page.locator('#iptv-first-source').isHidden(),'Personal choice resumes account entry');
 await page.locator('#settings-close').click();await page.locator('#phone-iptv-home').waitFor({state:'visible'});assert(await page.locator('main').isHidden(),'Personal choice never falls through to free channels');await page.locator('[data-phone-section=live]').click();await page.locator('#iptv-settings-page-add').waitFor({state:'visible'});
 await page.locator('#iptv-settings-tab-accounts').click();await page.locator('#account-public').click();await page.waitForFunction(()=>window.reloadedSource);assert.equal(await page.evaluate(()=>localStorage.getItem('tvmorph.phone.personal-pending.v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('tvmorph.phone.first-source.v1')),'1');
 await page.reload();await page.locator('#stream-loading').waitFor({state:'detached'});assert(await page.locator('#iptv-first-source').isHidden(),'Explicit free source remembered');
 await page.locator('#stream-top-settings').click();await page.locator('#iptv-settings-tab-add').click();await page.locator('#account-method-xtream').click();
 for(const [id,value] of [['server','https://fixture.invalid'],['port','8080'],['user','fixture-user'],['password','fixture-password'],['name','Fixture account']]){assert.equal(await page.locator('#account-'+id).evaluate(e=>e.readOnly),false,'Phone uses ordinary editable inputs');await page.locator('#account-'+id).fill(value);}
 await page.locator('#account-password').press('Enter');await page.waitForFunction(()=>window.reloadedSource);const payload=await page.evaluate(()=>sent.find(r=>r.action==='connect').payload);assert.equal(payload.type,'xtream');assert.equal(payload.server,'https://fixture.invalid:8080');assert.equal(payload.username,'fixture-user');assert.equal(payload.password,'fixture-password');assert.equal(await page.locator('#iptv-feedback').getAttribute('data-state'),'success');
 await page.evaluate(()=>window.failConnect=true);await page.locator('#account-method-m3u').click();await page.locator('#account-save').click();await page.waitForFunction(()=>document.getElementById('iptv-feedback').dataset.state==='error');assert((await page.locator('#iptv-feedback').innerText()).includes('rejected'));assert.equal(await page.locator('#account-save').isDisabled(),false);
 await page.evaluate(()=>{window.testPersonal=true;sessionStorage.setItem('fixture-personal','1')});
 await page.addInitScript(()=>{if(sessionStorage.getItem('fixture-personal'))window.testPersonal=true});await page.reload();await page.locator('#stream-loading').waitFor({state:'detached'});
 await page.locator('#stream-top-settings').click();await page.locator('#iptv-settings-page-accounts').waitFor({state:'visible'});
 assert((await page.locator('#iptv-active-name').innerText()).includes('My IPTV'));assert((await page.locator('#account-subscription-info').innerText()).includes('2098'),'Expiry retained in account facts');assert(await page.locator('#account-subscription-info').isVisible(),'Subscription data retained');assert.equal(await page.locator('#iptv-saved-rows [data-account-id]').count(),2,'Saved accounts retained');
 for(const tab of ['accounts','playback','library']){await page.locator('#iptv-settings-tab-'+tab).click();for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.locator('#iptv-settings-page-'+tab).isVisible());assert(await page.locator('#settings-panel .settings-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'All settings pages fit');if(size.width===390)await page.screenshot({path:path.resolve(`output/phone-settings-${tab}-${language}.png`)});}}
 assert.deepEqual(errors,[]);await context.close();
}
console.log('PASS phone source flow AR/EN: initial choice, migrated preference, cancel/retry, free remembered; fullscreen settings at 320/390/844; all 4 source methods and fields; native file picker; Xtream payload with port; retained expiry/status/saved accounts; no runtime errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

