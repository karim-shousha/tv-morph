const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route(/^https?:/,route=>{
  if(!route.request().url().startsWith('https://fixture.test/'))return route.abort();
  const id=Number(new URL(route.request().url()).pathname.match(/\d+/)?.[0]||0),color=['#2463eb','#087f70','#7040bd','#b82d4e'][id%4];
  return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${id%2?500:220}" height="${id%2?160:220}"><rect width="100%" height="100%" rx="18" fill="${color}"/><text x="50%" y="56%" text-anchor="middle" font-family="Arial" font-size="54" fill="white">${['NEWS','SPORT','TV','LIVE'][id%4]}</text></svg>`});
 });
 await page.addInitScript(()=>{
  localStorage.clear();window.sent=[];
  window.IptvNative={exit(){window.exited=true},request(id,action,raw){const q=JSON.parse(raw);sent.push({action,payload:q});let data={};
   if(action==='summary')data={configured:true,profileId:'phone-grid-fixture',name:'My library',live:true,vod:true,series:true};
   if(action==='refresh')window.refreshed=true;
   if(action==='settings')data={language:'ar',resume:true};
   if(action==='profiles'||action==='history')data={items:[]};
   if(action==='categories')data={items:[{category_id:'101',category_name:'أخبار عربية'},{category_id:'102',category_name:'رياضة'}]};
   if(action==='list')data={items:Array.from({length:24},(_,i)=>({id:String(i+1),kind:q.kind==='all'?'live':q.kind,name:(window.refreshed?'Updated ':'')+['2M','Al Iraqia (1080p)','قناة الأخبار العربية والبث المباشر','Ajman TV (1080p)','Afaq TV','Al Ittihad TV (552p) [Not 24/7]'][i%6],icon:'https://fixture.test/logo'+i+'.svg',rating:'8',year:'2026'})),total:24,hasMore:false};
   if(action==='progress')data={items:q.items};if(action==='details')data=q;
   setTimeout(()=>iptvResult(id,true,data),0);
  }};
 });
 await page.goto(pathToFileURL(path.resolve(process.env.MORPH_IPTV_FIXTURE_ROOT||'mobile-app/build/assets/iptv/index.html')).href);
 await page.waitForFunction(()=>document.body.hasAttribute('data-phone-library'));
 await page.locator('#stream-loading').waitFor({state:'detached'});
 for(const language of ['ar','en']){
  await page.evaluate(language=>MorphLocale.set(language),language);
  for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);
   await page.locator('#home-open').click();
   assert(await page.locator('#phone-iptv-home').isVisible());
   assert.equal(await page.locator('.ph-home-grid button:visible').count(),4);
   assert(await page.locator('#stream-home').isHidden(),'TV home hidden on phone');
   assert(await page.locator('main').isHidden(),'Library does not overlap mobile home');
   const homeBounds=await page.locator('#phone-iptv-home').boundingBox();assert(homeBounds.x>=-1&&homeBounds.x+homeBounds.width<=size.width+1,'Mobile home fits');
   if(size.width===390)await page.screenshot({path:path.resolve(`output/phone-pearl-home-${language}.png`)});
   for(const kind of ['live','vod','series']){
    await page.locator('#kind-'+kind).click();await page.waitForFunction(()=>document.querySelectorAll('#items .tile').length>=12);
    const layout=await page.evaluate(()=>{const grid=document.getElementById('items'),rect=grid.getBoundingClientRect(),tiles=[...grid.querySelectorAll('.tile')].slice(0,8).map(e=>e.getBoundingClientRect());return {overflow:document.documentElement.scrollWidth>innerWidth,gridOverflow:grid.scrollWidth>grid.clientWidth+1,height:rect.height,widths:tiles.map(t=>t.width),heights:tiles.map(t=>t.height),tops:tiles.map(t=>t.top),columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,bg:getComputedStyle(document.body).backgroundImage};});
    assert(!layout.overflow&&!layout.gridOverflow,JSON.stringify({language,size,kind,layout}));assert(layout.height>150,'Usable grid');assert(Math.max(...layout.widths)-Math.min(...layout.widths)<1.5,'Equal widths');assert(Math.max(...layout.heights)-Math.min(...layout.heights)<1.5,'Equal heights');assert.equal(layout.columns,size.width<600?2:4);assert.equal(layout.tops[0],layout.tops[1]);assert.equal(layout.bg,'none');
    if(size.width===390)await page.screenshot({path:path.resolve(`output/phone-pearl-${kind}-${language}.png`)});
   }
   await page.locator('#phone-categories-open').click();assert(await page.locator('#phone-category-drawer').isVisible());await page.locator('#phone-category-filter').fill('أخبار');assert(await page.locator('#categories button:visible').count()>=1);await page.locator('.phone-category-bar button').click();assert(await page.locator('#phone-category-drawer').isHidden());
  }
 }
 for(const language of ['ar','en']){await page.evaluate(l=>MorphLocale.set(l),language);await page.setViewportSize({width:390,height:844});await page.locator('#kind-vod').click();await page.waitForFunction(()=>document.querySelectorAll('#items .tile').length>=12);await page.locator('#items .tile').first().click();await page.locator('#details-panel').waitFor({state:'visible'});for(const id of ['detail-resume','detail-start','tv-detail-favorite','tv-detail-trailer']){const b=page.locator('#'+id);if(await b.isVisible()){const color=await b.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).webkitTextFillColor}));assert.notEqual(color.bg,'rgba(0, 0, 0, 0)','Details button has a surface: '+id);assert.notEqual(color.bg,color.fg,'Readable details button: '+id);}}await page.screenshot({path:path.resolve(`output/phone-details-${language}.png`)});await page.evaluate(()=>IptvUI.back());}
 await page.locator('#kind-live').click();await page.waitForFunction(()=>document.body.dataset.kind==='live');
 const searchColor=await page.locator('#search-go').evaluate(e=>getComputedStyle(e).webkitTextFillColor);assert.equal(searchColor,'rgb(255, 255, 255)','Search text is white');await page.locator('#search').fill('NEWS');await page.locator('#search-go').click();await page.waitForFunction(()=>sent.some(r=>r.action==='list'&&r.payload.search==='NEWS'));
 await page.locator('#items .tile').first().click();await page.waitForFunction(()=>sent.some(r=>r.action==='play'));
 await page.locator('#stream-update').click();await page.waitForFunction(()=>[...document.querySelectorAll('#items .tile')].some(e=>e.textContent.includes('Updated')));assert.equal(await page.locator('#iptv-feedback').getAttribute('data-state'),'success');await page.locator('#phone-host-back').click();assert(await page.evaluate(()=>window.exited),'Header back calls native exit');assert.deepEqual(errors,[]);console.log('PASS phone pearl IPTV: AR/EN live/movies/series at 320/390/844; equal card widths/heights; 2/4 columns; usable scroll viewport; search/category drawer; native play payload; no runtime errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
