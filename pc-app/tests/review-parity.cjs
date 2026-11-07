/* Exercise the reviewed shared UI through the real, sandboxed desktop host. */
const {_electron}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),data=fs.mkdtempSync(path.join(os.tmpdir(),'morph-review-parity-'));
(async()=>{const env={...process.env,MORPH_PC_TEST_DATA:data};delete env.ELECTRON_RUN_AS_NODE;let app;
try{
 app=await _electron.launch({executablePath:process.env.MORPH_PC_TEST_EXECUTABLE||require('electron'),args:process.env.MORPH_PC_TEST_EXECUTABLE?[]:[root],cwd:root,env,timeout:60000});
 const p=await app.firstWindow(),errors=[],missing=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404&&r.url().startsWith('morph://app/'))missing.push(r.url());});
 await p.waitForFunction(()=>window.ClearTV&&ClearTV.Catalog.get('local.tvmorph.cleaner')&&window.SamsungMedia);
 await p.evaluate(()=>{localStorage.setItem('morph.welcome-support.v1','1');MorphLocale.set('en');ClearTV.showView('home');window.__reviewSession=Date.now();});
 const session=await p.evaluate(()=>window.__reviewSession);
 for(const [width,height] of [[960,600],[1280,720],[1920,1080]]){
  await app.evaluate(({BrowserWindow},size)=>{const win=BrowserWindow.getAllWindows()[0];win.unmaximize();win.setContentSize(...size);},[width,height]);await p.waitForTimeout(150);
  for(const lang of ['en','ar']){
   await p.evaluate(lang=>MorphLocale.set(lang),lang);
   const bad=await p.locator('#view-home .home-tools').evaluate(e=>Array.from(e.querySelectorAll('.ui-sidebar-icon,svg,.reference-side-label')).filter(n=>n.getBoundingClientRect().width&&!n.closest('.morph-feature-lock')&&getComputedStyle(n).color!=='rgb(244, 245, 248)').map(n=>n.className.baseVal||n.className));assert.deepEqual(bad,[]);
   await p.evaluate(()=>MorphCleaner.open());
   await p.waitForFunction(()=>document.querySelector('.storage-values').textContent.includes('GB'));
   const layout=await p.locator('#morph-cleaner').evaluate(e=>{const list=e.querySelector('.cleaner-list'),r=e.getBoundingClientRect(),b=getComputedStyle(document.querySelector('#view-settings .settings-shell')).backgroundImage;return {inside:r.left>=-1&&r.top>=63&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,list:list.clientHeight,theme:getComputedStyle(e).backgroundImage===b,title:e.querySelector('h1').textContent};});
   assert(layout.inside&&layout.list>=140&&layout.theme&&layout.title==='orph Cleaner',JSON.stringify({width,height,lang,layout}));
   await p.locator('#pc-back').click();assert.equal(await p.locator('#morph-cleaner').count(),0);
  }
 }
 checks.push('White sidebar and system-themed Cleaner fit 3 window sizes in Arabic and English; toolbar Back closes Cleaner');
 await p.evaluate(()=>MorphLocale.set('en'));
 const native=await p.evaluate(()=>MorphPC.cleaner('storage'));assert(native.total>0&&native.free>=0&&native.free<=native.total);
 const cache=path.join(data,'GPUCache');fs.mkdirSync(cache,{recursive:true});for(let i=0;i<24;i++)fs.writeFileSync(path.join(cache,'review-file-'+i+'.tmp'),'fixture');
 await p.evaluate(()=>MorphCleaner.open());await p.locator('[data-cleaner-scope=cache]').click();await p.waitForFunction(()=>document.querySelectorAll('.cleaner-file').length>=24);
 assert(await p.locator('.cleaner-list').evaluate(e=>e.scrollHeight>e.clientHeight));await p.locator('.cleaner-file').last().focus();await p.locator('#pc-home').click();assert.equal(await p.locator('#morph-cleaner').count(),0);checks.push('Real device storage, scrollable native cache results and Home dismissal');
 await p.locator('#nav-settings').click();await p.locator('#view-settings').waitFor();await p.locator('#pc-back').click();await p.waitForFunction(()=>document.activeElement.id==='nav-settings',null,{timeout:3000});
 await p.evaluate(()=>{const s=document.getElementById('dock-circle-transparency');s.value='35';s.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>ClearTV.settings.dockCircleTransparency),35);
 await p.locator('#home-local-network').click();await p.locator('#morph-network-screen').waitFor();const f=p.frameLocator('#morph-network-screen');await f.locator('#network-return').waitFor();
 const dlna=await f.locator('#network-main>header').evaluate(e=>{const back=e.querySelector('#network-return'),help=e.querySelector('#network-help'),img=e.querySelector('.morph-header-symbol'),brand=e.querySelector('.brand>span');return {right:back.getBoundingClientRect().left>help.getBoundingClientRect().left,unboxed:getComputedStyle(back).backgroundImage==='none'&&getComputedStyle(back).borderTopWidth==='0px',logo:img&&img.getAttribute('src').includes('morph-header-symbol.webp')&&getComputedStyle(img).filter==='none',line:brand.getBoundingClientRect().height};});assert(dlna.right&&dlna.unboxed&&dlna.logo&&dlna.line<45,JSON.stringify(dlna));
 await f.locator('#network-return').click();assert.equal(await p.locator('#morph-network-screen').count(),0);assert.equal(await p.evaluate(()=>window.__reviewSession),session);
 await p.locator('#home-local-network').click();await p.locator('#morph-network-screen').waitFor();await p.locator('#pc-home').click();assert.equal(await p.locator('#morph-network-screen').count(),0);checks.push('DLNA current logo, right unboxed Back and desktop Home return without reloading');
 for(const kind of ['radio','iptv']){await p.evaluate(kind=>SamsungMedia.open(kind),kind);await p.locator('#morph-media-frame').waitFor();await p.waitForFunction(()=>{const f=document.getElementById('morph-media-frame');return f.contentDocument.readyState==='complete'&&getComputedStyle(f).visibility==='visible';});assert.equal(await p.locator('.morph-page-loading').count(),0);await p.locator('#pc-home').click();assert.equal(await p.evaluate(()=>window.__reviewSession),session);}
 checks.push('Radio and IPTV handoff ends without a stale loading cover or host reload');
 await p.reload();await p.waitForFunction(()=>window.ClearTV&&ClearTV.settings.dockCircleTransparency===35);checks.push('Dock transparency survives reload');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.mkdirSync(path.join(root,'test-output'),{recursive:true});fs.writeFileSync(path.join(root,'test-output/review-parity.json'),JSON.stringify({passed:true,checks,dlna,nativeStorage:true},null,2));console.log('PASS desktop reviewed changes: '+checks.join('; '));
}finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
