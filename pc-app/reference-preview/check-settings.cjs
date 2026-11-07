const path=require('path'),assert=require('assert'),fs=require('fs');
const {_electron}=require('../node_modules/playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const app=await _electron.launch({executablePath:path.join(root,'pc-app/node_modules/electron/dist/electron.exe'),args:[path.join(root,'pc-app')],env:{...process.env,MORPH_PC_TEST_DATA:path.join(root,'.private/gold-reference-settings-qa'),MORPH_PC_UI_DIR:path.join(root,'output/gold-reference-preview/ui')}});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.ReferencePreview&&document.querySelector('#reference-settings-back'));
  await page.evaluate(()=>{localStorage.setItem('morph.welcome-support.v1','1');document.querySelector('#morph-welcome-support')?.remove();});
  await page.locator('#nav-settings').click();await page.locator('#view-settings').waitFor({state:'visible'});
  const saved=await page.evaluate(()=>JSON.stringify(ClearTV.settings));
  const ids=await page.locator('#settings-categories-menu .settings-category-entry').evaluateAll(ns=>ns.filter(n=>!n.hidden).map(n=>n.id));
  const sections=[];
  for(const id of ids){
   await page.locator('#'+id).focus();
   await page.waitForTimeout(40);
   const info=await page.evaluate(id=>{const entry=document.getElementById(id),panel=document.getElementById(entry.getAttribute('aria-controls')),workspace=document.querySelector('.settings-workspace').getBoundingClientRect(),r=panel.getBoundingClientRect();return{id,panelVisible:!panel.hidden,icon:entry.querySelectorAll('.reference-settings-icon').length,selected:entry.getAttribute('aria-selected'),glass:getComputedStyle(entry).backgroundImage,panelFits:r.left>=workspace.left-2&&r.right<=workspace.right+2,horizontalOverflow:panel.scrollWidth>panel.clientWidth+1};},id);
   assert(info.panelVisible&&info.icon===1&&info.selected==='true'&&info.panelFits&&!info.horizontalOverflow,JSON.stringify(info));
   sections.push(info);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(ClearTV.settings)),saved,'Browsing settings preserves saved preferences');
  await page.locator('#settings-category-time-entry').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'setting-clock');
  const clock=await page.locator('#clock-format').textContent();await page.keyboard.press('Enter');assert.notEqual(await page.locator('#clock-format').textContent(),clock);await page.keyboard.press('Enter');assert.equal(await page.locator('#clock-format').textContent(),clock);
  for(const lang of ['ar','fr','en']){
   await page.evaluate(lang=>MorphLocale.set(lang),lang);await page.waitForTimeout(80);
   await page.locator('#settings-category-appearance-entry').focus();
   const layout=await page.evaluate(()=>{const root=document.querySelector('#view-settings'),menu=root.querySelector('#settings-categories-menu'),entry=root.querySelector('.settings-category-entry.is-selected');return {dir:root.querySelector('.settings-shell').dir,oneIcon:entry.querySelectorAll('.reference-settings-icon').length===1,menuFits:menu.scrollWidth<=menu.clientWidth+1,blur:[...root.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().width).some(n=>getComputedStyle(n).backdropFilter!=='none')};});
   assert.equal(layout.dir,lang==='ar'?'rtl':'ltr');assert(layout.oneIcon&&layout.menuFits&&!layout.blur);
  }
  await page.locator('#reference-settings-back').click();await page.locator('#view-home').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(root,'output/gold-reference-preview/settings-validation.json'),JSON.stringify({passed:true,sections:sections.map(s=>s.id),languages:['ar','fr','en'],remoteNavigation:true,clockSettingRestored:true,back:true,noBlur:true,screenshots:false},null,2));
  console.log('PASS Settings: all '+sections.length+' categories, icons, bounded panels, no navigation preference changes, D-pad, clock toggle/restore, Arabic/French/English, Back, no blur. No screenshots.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
