const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
async function fixture(page,language,free){
 await page.route('**/*',route=>{const url=new URL(route.request().url()),rel=decodeURIComponent(url.pathname);let file=rel.startsWith('/iptv/')?path.join(root,'android-tv/iptv',rel.slice(6)):rel.startsWith('/tv/')?path.join(root,'tv-project/app',rel.slice(4)):'';if(rel.endsWith('/locale.js'))file=path.join(root,'mobile-app/assets/ui/locale.js');if(url.hostname==='art.test')file=path.join(root,'android-tv/iptv/card-live-v1.webp');if(!file||!fs.existsSync(file))return route.abort();const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});});
 await page.addInitScript(({language,free})=>{localStorage.setItem('tvmorph.iptv.first-source.v1','1');window.nativeCalls=[];const rows=kind=>Array.from({length:95},(_,i)=>({id:String(i+1),name:kind+' '+(i+1),kind,category:'1',icon:'http://art.test/a',backdrop:'http://art.test/a',rating:'8'}));window.IptvNative={settingsJson:()=>JSON.stringify({theme:'night'}),showKeyboard(){},hideKeyboard(){},request(id,action,raw){let q=JSON.parse(raw);nativeCalls.push({action,q});let value=action==='summary'?{configured:true,profileId:'rail-fixture',live:true,vod:!free,series:!free,publicMode:free,accounts:[{id:'rail-fixture',active:true,name:'Fixture'}]}:action==='settings'?{language,scale:'fit',resume:true}:action==='categories'?{items:[{id:'1',name:'All channels'},{id:'2',name:'Another category'}]}:action==='list'?{items:rows(q.kind).slice((q.page||0)*(q.pageSize||30),(q.page||0)*(q.pageSize||30)+(q.limit||q.pageSize||30)),total:95,hasMore:true}:action==='accounts'?{items:[{id:'rail-fixture',active:true,name:'Fixture'}]}:action==='history'?{items:[]}:action==='progress'?{items:q.items}:action==='details'?q:{};setTimeout(()=>iptvResult(id,true,value),5);}};},{language,free});
 await page.goto('http://preview.test/iptv/index.html');await page.waitForFunction(()=>window.IptvCinemaNavigation&&document.getElementById('stream-home').getAttribute('aria-busy')==='false'&&!document.getElementById('morph-brand-loader'));
}
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),report=[];try{
 for(const width of [1280,1920])for(const language of ['ar','en'])for(const free of [false,true]){
  const page=await browser.newPage({viewport:{width,height:width===1920?1080:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,language,free);
  const remote=async key=>{await page.evaluate(key=>IptvUI.remote('key',key),key);await page.waitForTimeout(30);};
  const ids=await page.locator('#stream-sidebar button').evaluateAll(nodes=>nodes.filter(n=>!n.hidden&&n.getBoundingClientRect().height&&n.getBoundingClientRect().width).map(n=>n.id));assert(ids.length>=9,'Full rail present');
  await page.locator('#stream-nav-settings').focus();
  for(const id of ids.slice(1)){await remote('DOWN');assert.equal(await page.evaluate(()=>document.activeElement.id),id,'Rail Down: '+id);}
  await remote('DOWN');assert.equal(await page.evaluate(()=>document.activeElement.id),ids.at(-1),'Bottom stays bounded');
  // Physical keyboard input must show focus, not merely update activeElement.
  await page.locator('#stream-nav-favorites').focus();
  for(const id of ids.slice(ids.indexOf('stream-nav-favorites')+1)){
   const before=await page.locator('#'+id).evaluate(n=>{const s=getComputedStyle(n);return [s.backgroundColor,s.boxShadow];});
   await page.keyboard.press('ArrowDown');
   assert.equal(await page.evaluate(()=>document.activeElement.id),id,'Keyboard Down after heart: '+id);
   const focused=await page.locator('#'+id).evaluate(n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius,width:n.offsetWidth,height:n.offsetHeight};});
   assert.notEqual(focused.background,'rgba(0, 0, 0, 0)','Visible focus fill: '+id);
   assert.notEqual(focused.shadow,'none','Visible focus edge: '+id);
   assert.notDeepEqual([focused.background,focused.shadow],before,'Focus changes appearance: '+id);
   assert.equal(focused.radius,'50%','Circular focus: '+id);assert.equal(focused.width,focused.height,'Square circle target: '+id);
  }
  for(const id of ids.slice(0,-1).reverse()){
   await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.id),id,'Keyboard Up: '+id);
  }
  await page.locator('#'+ids.at(-1)).focus();
  for(const id of ids.slice(0,-1).reverse()){await remote('UP');assert.equal(await page.evaluate(()=>document.activeElement.id),id,'Rail Up: '+id);}
  for(const id of ids.slice(1)){await page.locator('#'+id).focus();await remote('LEFT');assert.equal(await page.evaluate(()=>document.activeElement.id),id,'Left stays in rail');await remote('RIGHT');assert(await page.evaluate(()=>!document.activeElement.closest('#stream-sidebar')),'Right enters content');}
  await page.locator('#stream-nav-settings').focus();await remote('ENTER');await page.locator('#settings-panel').waitFor({state:'visible'});for(let i=0;i<4&&await page.locator('#settings-panel').isVisible();i++)await page.evaluate(()=>IptvUI.back());assert(await page.locator('#settings-panel').isHidden());
  for(const kind of ['live','vod','series']){await page.locator('#stream-nav-'+kind).focus();await remote('ENTER');if(free&&kind!=='live'){await page.locator('#stream-source-menu').waitFor({state:'visible'});await page.evaluate(()=>IptvUI.back());}else{await page.waitForFunction(kind=>document.getElementById('dashboard').hidden&&IptvTvBridge.getState().kind===kind,kind);}await page.locator('#stream-nav-home').click();}
  await page.locator('#stream-sources').focus();await remote('ENTER');await page.locator('#stream-source-menu').waitFor({state:'visible'});await page.evaluate(()=>IptvUI.back());assert.equal(await page.evaluate(()=>document.activeElement.id),'stream-sources');
  const calls=await page.evaluate(()=>nativeCalls.length);await page.locator('#stream-update').focus();await remote('ENTER');await page.waitForFunction(calls=>nativeCalls.length>calls,calls);
  await page.locator('#stream-nav-home').click();assert(await page.locator('#dashboard').isVisible());assert.deepEqual(errors,[]);
  report.push({width,language,free,icons:ids,arrows:true,activation:true,errors});await page.close();
 }
 fs.writeFileSync(path.join(root,'output/iptv-side-rail-verification.json'),JSON.stringify(report,null,2));console.log('PASS 8 TV layouts: every sidebar icon Up/Down/Left/Right; sections, settings, accounts, refresh and Back');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
