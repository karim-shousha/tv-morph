/* Exercise the real launcher DOM, theme cascade and remote focus on the TV canvas. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../../..');
const extras=['reference.css','reference-theme.js','reference.js','settings-reference.css','surfaces-reference.css','themes-reference.css','settings-reference.js','themes-reference.js','settings-expand.js','focus-reference.css'];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const [width,height,language,theme] of [[1920,1080,'en','blue'],[1280,720,'en','night'],[960,540,'ar','emerald']]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.hostname!=='fitness.test')return route.abort();
  const name=decodeURIComponent(url.pathname.slice(1));
  let file=path.join(root,'tv-project/app',name);
  if(extras.includes(name))file=path.join(root,'tv-project/visual-system',name);
  if(name.startsWith('reference-assets/'))file=path.join(root,'tv-project/visual-system/assets',name.slice(17));
  if(name==='locale.js')file=path.join(root,'mobile-app/assets/ui/locale.js');
  if(name==='samsung-locks.js')file=path.join(root,'mobile-app/samsung-locks.js');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
  let body=fs.readFileSync(file);
  if(name==='index.html')body=body.toString().replace('<body data-theme=','<body data-fixed-layout="true" data-theme=').replace('<script defer src="core.js">','<script defer src="locale.js"></script><script defer src="core.js">').replace('</body>',extras.map(f=>f.endsWith('.css')?'<link rel="stylesheet" href="'+f+'">':'<script defer src="'+f+'"></script>').join('')+'</body>');
  return route.fulfill({body,contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream')});
 });
 await page.addInitScript(language=>{localStorage.setItem('tvmorph.language',language);localStorage.setItem('morph.welcome-support.v1','1');},language);
 await page.goto('http://fitness.test/index.html');
 await page.waitForFunction(()=>window.ClearTV&&ClearTV.FitnessUI&&window.ReferenceTheme);
 await page.evaluate(async()=>{if(window.MorphPresentationReady)await MorphPresentationReady;});
 await page.evaluate(({theme,language})=>{MorphPlus.isActive=()=>true;ClearTV.settings.theme=theme;ReferenceTheme.apply();document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';ClearTV.showView('fitness');}, {theme,language});
 await page.waitForTimeout(400);
 const metrics=await page.evaluate(()=>{
  const page=document.getElementById('view-fitness'),box=page.getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();
  const cards=Array.from(page.querySelectorAll('[data-fitness-category]'));
  const art=page.querySelector('.fit-hero-art'),artBox=art.getBoundingClientRect(),hero=page.querySelector('.fit-hero').getBoundingClientRect();
  const outside=Array.from(page.querySelectorAll('button')).filter(b=>b.offsetWidth).filter(b=>{const r=b.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1;}).map(b=>b.textContent);
  return{box:{x:box.x,y:box.y,width:box.width,height:box.height,bottom:box.bottom},mainBottom:main.bottom,cards:cards.length,rows:new Set(cards.map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:page.scrollWidth-page.clientWidth,vertical:page.scrollHeight-page.clientHeight,outside,background:getComputedStyle(page).backgroundImage,images:Array.from(page.querySelectorAll('img')).every(i=>i.complete&&i.naturalWidth>0),panorama:art.naturalWidth/art.naturalHeight,artFit:getComputedStyle(art).objectFit,fullWidth:Math.abs(artBox.width-hero.width)<1};
 });
 console.log(width,height,language,theme,JSON.stringify(metrics));
 assert.equal(metrics.cards,6);assert.equal(metrics.rows,1);assert(metrics.overflow<=1);assert(metrics.vertical<=1);assert.deepEqual(metrics.outside,[]);assert(metrics.box.bottom<=metrics.mainBottom+1);assert(metrics.images);assert(metrics.background.includes('bridge-background-v2'));
 assert(metrics.panorama>3.1);assert.equal(metrics.artFit,'contain');assert(metrics.fullWidth);
 const sequence=await page.locator('[data-fitness-category]').evaluateAll(cards=>cards.map(c=>c.dataset.fitnessCategory));assert.deepEqual(sequence,['full_body','upper_body','lower_body','core','cardio','stretching']);
 await page.locator('[data-fitness-category="full_body"]').focus();await page.keyboard.press(language==='ar'?'ArrowLeft':'ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-fitness-category')),'upper_body');
 await page.locator('.fit-see-all').click();assert(await page.locator('.fit-screen-programs').isVisible());
 await page.evaluate(()=>ClearTV.FitnessUI.back());assert(await page.locator('.fit-screen-home').isVisible());
 await page.locator('.fit-hero-side button').nth(2).click();assert(await page.locator('.fit-screen-builder').isVisible());
 await page.evaluate(()=>ClearTV.FitnessUI.back());
 if(width===1920)await page.screenshot({path:path.join(root,'output/fitness-reference-layout.png')});
 for(const screen of ['programs','builder','progress','settings','music','complete']){
  await page.evaluate(screen=>ClearTV.FitnessUI.show(screen),screen);
  if(screen==='programs'){const count=await page.locator('[data-program-id]').count();await page.locator('[data-program-id]').nth(1).click();assert.equal(await page.locator('[data-program-id]').count(),count);assert.equal(await page.locator('[data-program-id][aria-pressed=true]').count(),1);}
  if(screen==='builder'){assert.equal(await page.locator('[data-exercise-id]').count(),32);await page.locator('[data-exercise-id]').nth(0).click();await page.locator('[data-exercise-id]').nth(1).click();assert.equal(await page.locator('.fit-builder-summary .fit-exercise-sequence li').count(),2);await page.locator('.fit-remove-exercise').first().click();assert.equal(await page.locator('.fit-builder-summary .fit-exercise-sequence li').count(),1);}
  if(screen==='settings'){await page.locator('[data-fitness-setting=beeps] button').click();assert.equal(await page.evaluate(()=>document.activeElement.closest('[data-fitness-setting]').getAttribute('data-fitness-setting')),'beeps');}
  if(screen==='progress'){assert(await page.locator('.fit-bar-value').evaluateAll(bars=>bars.every(b=>b.getBoundingClientRect().height===0)),'No filled bars for zero activity');}
  const internal=await page.evaluate(()=>{const page=document.getElementById('view-fitness'),box=page.getBoundingClientRect(),nodes=Array.from(page.querySelectorAll('button,.fit-panel,.fit-grid,.fit-kpi')).filter(n=>n.offsetWidth);return{overflow:page.scrollWidth-page.clientWidth,outside:nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1;}).map(n=>n.className),background:getComputedStyle(page).backgroundImage};});
  assert(internal.overflow<=1,screen+' horizontal overflow');assert.deepEqual(internal.outside,[],screen+' bounds');assert(internal.background.includes('bridge-background-v2'));
  if(width===1920)await page.screenshot({path:path.join(root,'output/fitness-'+screen+'-layout.png')});
 }
 await page.evaluate(()=>{var s=ClearTV.FitnessStore.settings();s.musicEnabled=false;s.voice=false;s.beeps=false;s.countdown=false;ClearTV.FitnessStore.saveSettings(s);ClearTV.FitnessUI.show('settings');ClearTV.FitnessUI.open();});
 await page.locator('.fit-hero-cta .fit-btn-primary').click();await page.locator('.fit-active-identity h2').waitFor();await page.locator('[data-pause]').click();assert(await page.locator('.fit-screen-active').isVisible());
 assert(await page.evaluate(()=>{const p=document.getElementById('view-fitness');return p.scrollWidth<=p.clientWidth+1;}));
 assert(await page.evaluate(()=>{const p=document.getElementById('view-fitness'),r=p.getBoundingClientRect();return Array.from(p.querySelectorAll('button,.fit-active-layout>.fit-panel')).filter(e=>e.offsetWidth).every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom;});}),'Active page controls stay within canvas');
 const ring=await page.locator('.fit-timer-value').evaluate(e=>getComputedStyle(e).stroke);assert.notEqual(ring,'none');
 if(width===1920)await page.screenshot({path:path.join(root,'output/fitness-active-layout.png')});
 await page.locator('[data-act=music]').click();assert(await page.locator('.fit-screen-music').isVisible());await page.evaluate(()=>ClearTV.FitnessUI.back());assert(await page.locator('.fit-screen-active').isVisible());
 await page.locator('[data-act=exit]').click();assert(await page.locator('#fit-exit-dialog').isVisible());await page.locator('#fit-exit-dialog button').nth(1).click();assert(await page.locator('.fit-screen-home').isVisible());
 for(const code of [27,10009,461,4]){
  await page.evaluate(()=>ClearTV.showView('fitness',document.getElementById('home-fitness')));
  await page.evaluate(code=>{document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,cancelable:true,keyCode:code,which:code,key:'Escape'}));},code);
  assert(await page.locator('#view-home').isVisible(),'Back '+code+' returns to launcher Home');assert.equal(await page.evaluate(()=>document.activeElement.id),'home-fitness');
 }
 await page.evaluate(()=>{ClearTV.showView('fitness',document.getElementById('home-fitness'));ClearTV.FitnessUI.show('programs');});await page.locator('.fit-launcher-back').click();assert(await page.locator('#view-home').isVisible());
 await page.evaluate(()=>ClearTV.showView('fitness',document.getElementById('home-fitness')));await page.locator('.fit-hero-cta .fit-btn-primary').click();await page.locator('.fit-active-identity h2').waitFor();await page.keyboard.press('Escape');assert(await page.locator('#fit-exit-dialog').isVisible());await page.locator('#fit-exit-dialog button').nth(1).click();assert(await page.locator('#view-home').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'home-fitness');
 await page.evaluate(()=>ClearTV.showView('settings'));await page.waitForTimeout(120);
 const menu=await page.locator('#settings-categories-menu').evaluate(e=>({width:getComputedStyle(e).width,overflow:e.scrollWidth-e.clientWidth,lines:Array.from(e.querySelectorAll('.settings-menu-divider')).filter(n=>n.offsetHeight).map(n=>({display:getComputedStyle(n).display,height:getComputedStyle(n).height,colour:getComputedStyle(n).backgroundColor}))}));assert.equal(menu.width,'400px');assert(menu.overflow<=1);assert(menu.lines.length>=5&&menu.lines.every(n=>n.display==='block'&&n.height==='1px'&&n.colour!=='rgba(0, 0, 0, 0)'));
 if(width===1920)await page.screenshot({path:path.join(root,'output/settings-sidebar-expanded.png')});
 assert.deepEqual(errors,[]);await page.close();
}
console.log('PASS fitness reference layout, actual canvas bounds, themes, images, category navigation, builder and Back.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
