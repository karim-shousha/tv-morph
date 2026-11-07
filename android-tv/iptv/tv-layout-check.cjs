const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const testFile=process.argv[2]||'android-tv/build/assets/iptv/index.html', testName=process.argv[3]||'android';
const assert=require('assert'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}); const results=[];
 try { for(const size of [{width:1920,height:1080},{width:1280,height:720}]) for(const lang of ['ar','en']) {
  const page=await browser.newPage({viewport:size}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/samsung-bridge.js',r=>r.fulfill({contentType:'application/javascript',body:"document.addEventListener('keydown',function(e){if(e.keyCode===10009){e.preventDefault();IptvUI.back();}});"}));
  await page.addInitScript(({lang})=>{window.calls=[];window.IptvNative={settingsJson:()=>'{}',exit(){window.exited=true},request(id,action,data){const q=JSON.parse(data);calls.push({action,...q});let result={};
   const names=['قنوات الرياضة · Sports','قنوات الأخبار · News','الأفلام العربية · Arabic','وثائقيات · Documentary','قنوات الأطفال · Kids'];
   if(action==='settings')result={language:lang,resume:true,scale:'fit'};
   if(action==='summary')result={name:'Family TV',profileId:'tv-layout-fixture',live:true,vod:true,series:true};
   if(action==='categories')result={items:Array.from({length:35},(_,i)=>({category_id:String(i+1),category_name:names[i%5]+' '+(i+1)}))};
   if(action==='list'){
    let rows=Array.from({length:q.kind==='episode'?80:60},(_,i)=>({id:String(i+1),kind:q.kind,name:q.kind==='episode'?'S'+(i<40?'1':'2')+' · Episode '+(i+1):q.kind==='live'?'beIN Sports HD · '+(i+1):['رحلة إلى النور','MIDNIGHT','أيام جميلة','THE COAST','حكاية عائلة'][i%5]+' '+(i+1),rating:'8.2',icon:'https://fixture.invalid/poster-'+i+'.svg',duration:q.kind==='episode'?'31:00':'',plot:q.kind==='episode'?'Episode description supplied by the provider. تفاصيل الحلقة من المزوّد.':'',ext:'mp4'}));
    if(q.search)rows=rows.filter(r=>r.name.toLowerCase().includes(q.search.toLowerCase()));
    result={items:rows.slice((q.page||0)*60,(q.page||0)*60+60),total:rows.length,hasMore:(q.page+1)*60<rows.length};
   }
   if(action==='details')result={...q,genre:'Drama / Family',released:'2026',director:'Provider director',cast:'Provider cast',plot:'حكاية عائلة تجمعها رحلة جديدة. A family story, supplied by the provider.',rating:'8.2',seasons:['1','2']};
   if(action==='progress')result={items:q.items};
   if(action==='history')result={items:[]};
   if(action==='play')result={sent:true};
   setTimeout(()=>window.iptvResult(id,true,result),5);
  }};},{lang});
  await page.route('https://fixture.invalid/**',r=>{const n=Number((r.request().url().match(/poster-(\d+)/)||[])[1]||0);const colors=['#145876','#614474','#846044','#2b6561','#3a456f'];r.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="${colors[n%5]}"/><circle cx="200" cy="210" r="120" fill="#ffffff22"/><path d="M0 490L190 270 400 490V600H0" fill="#08172899"/><text x="200" y="510" fill="white" text-anchor="middle" font-family="Arial" font-size="35">TV MORPH</text><text x="200" y="552" fill="#cfe7ff" text-anchor="middle" font-family="Arial" font-size="20">PREVIEW ${n+1}</text></svg>`});});
  await page.goto(pathToFileURL(path.resolve(testFile)).href);
  await page.waitForSelector('#cinematic-hero');await page.waitForTimeout(100);
  assert.equal(await page.locator('.category-art').count(),5);
  assert(await page.locator('.category-art').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth===960)),'All generated cards load');
  assert(await page.locator('.cinematic-hero-art').evaluate(image=>image.complete&&image.naturalWidth>0),'Default hero artwork resolves in this package');
  await page.locator('#cinematic-browse').focus();await page.keyboard.press('ArrowDown');assert(await page.locator('[data-open=live]').evaluate(e=>e===document.activeElement));
  assert.equal(await page.locator('.portal-tools').isVisible(),false,'Home tools consolidated into Settings');
  assert.equal(await page.locator('#home-refresh').evaluate(e=>!!e.closest('.settings-dialog')),true);
  for(const category of ['vod','series','favorites','music','live']){
   await page.locator(category==='favorites'?'#home-favorites':category==='music'?'#home-music':'[data-open='+category+']').focus();
   await page.waitForFunction(name=>{const image=document.querySelector('.cinematic-hero-art');return image.complete&&image.naturalWidth>0&&image.getAttribute('src')==='card-'+name+'-v1.webp';},category);
   await page.evaluate(()=>window.MediaTheme&&MediaTheme.apply());
   assert.equal(await page.locator('.cinematic-hero-art').getAttribute('src'),'card-'+category+'-v1.webp','Theme does not overwrite category preview');
  }
  await page.waitForTimeout(220);
  assert.notEqual(await page.locator('[data-open=live]').evaluate(e=>getComputedStyle(e).transform),'none','Focused card grows');
  await page.evaluate(()=>document.body.classList.add('reduce-motion'));
  assert.equal(await page.locator('[data-open=live]').evaluate(e=>getComputedStyle(e).transform),'none','Reduced motion disables scaling');
  await page.evaluate(()=>document.body.classList.remove('reduce-motion'));
  await page.screenshot({path:`output/cinematic-reference/${testName}-iptv-home-${lang}-${size.width}.png`});
  await page.locator('[data-open=live]').click();await page.waitForSelector('.tile');
  assert(await page.locator('body').evaluate(e=>e.classList.contains('channel-grid')),'Channel grid is default');
  await page.locator('.tile').first().focus();await page.keyboard.press('ArrowRight');assert(await page.locator('.tile').nth(1).evaluate(e=>e===document.activeElement));
  await page.locator('#catalog-view-toggle').click();
  assert.equal(await page.locator('#tv-live-preview').isVisible(),true);
  await page.locator('.tile').first().focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.tile').nth(1).evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'tv-channel-play');await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.tile').nth(1).evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='play').length),0,'No playback while browsing');
  await page.keyboard.press('Enter');await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='play').length),1,'Exactly one OK playback');
  await page.locator('#browse-all').focus();for(let i=0;i<37;i++)await page.keyboard.press('ArrowDown');
  const rail=await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect(),a=document.querySelector('main aside').getBoundingClientRect();return {inside:r.top>=a.top&&r.bottom<=a.bottom+1,scroll:document.getElementById('categories').scrollTop}});assert(rail.inside&&rail.scroll>0,JSON.stringify(rail));
  await page.locator('#home-open').click();await page.locator('[data-open=vod]').click();await page.waitForSelector('.tile');await page.waitForTimeout(80);
  const geometry=await page.evaluate(()=>{const items=document.getElementById('items').getBoundingClientRect(),tile=document.querySelector('.tile').getBoundingClientRect(),footer=document.querySelector('footer').getBoundingClientRect();return {columns:getComputedStyle(document.getElementById('items')).gridTemplateColumns.split(' ').length,tileBottom:tile.bottom,itemsBottom:items.bottom,footerBottom:footer.bottom,bodyWidth:document.body.scrollWidth}});
  assert.equal(geometry.columns,5);assert(geometry.tileBottom<=geometry.itemsBottom+1&&geometry.footerBottom<=size.height+1&&geometry.bodyWidth<=size.width+1,JSON.stringify(geometry));
  assert.equal(await page.locator('input:visible').count(),1,'One search only');
  await page.screenshot({path:`output/iptv-tv-movies-${lang}-${size.width}.png`});
  await page.locator('.tile').first().click();await page.waitForFunction(()=>document.getElementById('detail-meta').textContent.includes('Drama'));await page.screenshot({path:`output/iptv-tv-film-${lang}-${size.width}.png`});await page.keyboard.press('Escape');
  await page.locator('#home-open').click();await page.locator('[data-open=series]').click();await page.waitForSelector('.tile');await page.locator('.tile').first().click();await page.waitForSelector('.tv-episode');await page.waitForSelector('#tv-season option[value="2"]',{state:'attached'});
  await page.locator('#tv-season').selectOption('2');await page.waitForFunction(()=>document.querySelectorAll('.tv-episode').length===40);assert((await page.locator('.tv-episode').first().textContent()).includes('S2'));
  await page.locator('#tv-season').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.tv-episode').first().evaluate(e=>e===document.activeElement),false,'Native season select retains arrow control');
  await page.locator('#detail-episodes').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.tv-episode').first().evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.tv-episode').nth(1).evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Enter');await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='play').length),2);
  await page.screenshot({path:`output/iptv-tv-series-${lang}-${size.width}.png`});await page.evaluate(()=>{var e=new Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'keyCode',{value:10009});document.dispatchEvent(e);});assert(await page.locator('#details-panel').isHidden());assert(await page.locator('#dashboard').isHidden(),'Back closes only one layer');
  await page.locator('#home-open').click();await page.locator('[data-open=live]').click();await page.waitForSelector('.tile');await page.locator('.tile').first().focus();await page.waitForTimeout(40);await page.screenshot({path:`output/iptv-tv-live-${lang}-${size.width}.png`});
  assert.deepEqual(errors,[]);results.push({size,lang,status:'PASS',checks:['live list and safe selection','one OK launch','scroll category rail','five poster columns','one search','series seasons and episodes','remote navigation','Back']});await page.close();
 }
 // The phone viewport must not activate TV additions.
 const phone=await browser.newPage({viewport:{width:844,height:390}});await phone.route('**/index.html',async r=>{const html=fs.readFileSync('android-tv/build/assets/iptv/index.html','utf8').replace('width=1920','width=device-width,initial-scale=1');await r.fulfill({contentType:'text/html',body:html})});
 await phone.addInitScript(()=>{window.IptvNative={request(){}}});await phone.goto(pathToFileURL(path.resolve(testFile)).href);assert.equal(await phone.locator('html').getAttribute('data-tv-library'),null);assert.equal(await phone.locator('#tv-live-preview').count(),0);await phone.close();
 fs.writeFileSync('output/iptv-tv-layout-'+testName+'-results.json',JSON.stringify({results,phone:'TV additions inactive',transport:'Mocked; native stream playback requires device verification'},null,2));console.log('PASS: TV layout at 1080p/720p in Arabic/English; remote navigation, seasons, one explicit playback, no automatic playback, phone excluded.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
