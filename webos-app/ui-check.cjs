const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const size of [{width:1920,height:1080},{width:1280,height:720}]){
  const p=await b.newPage({viewport:size});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route(/^https?:/,r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();if(u.hostname==='provider.invalid'){let result={user_info:{auth:1,status:'Active'}};if(u.searchParams.get('action')==='get_live_categories')result=[{category_id:'1',category_name:'Test channels'}];if(u.searchParams.get('action')==='get_live_streams')result=[{stream_id:1,name:'Test channel',stream_icon:'',category_id:'1'}];return r.fulfill({json:result,headers:{'access-control-allow-origin':'*'}});}return r.abort();});
  await p.goto(pathToFileURL(path.resolve('webos-app/build/app/index.html')).href);await p.waitForFunction(()=>window.MorphLG&&window.ClearTV&&window.ReferencePreview);await p.waitForTimeout(500);
  assert((await p.evaluate(()=>ClearTV.Catalog.apps.map(a=>a.name))).includes('Morph Bridge'));assert.equal(await p.evaluate(()=>typeof tizen),'undefined');assert.equal(await p.evaluate(()=>typeof webapis),'undefined');
  await p.evaluate(()=>MorphLocale.set('en'));assert.equal(await p.evaluate(()=>typeof ClearTV.Inputs.watch),'function');
  await p.evaluate(()=>ClearTV.Catalog.launch(ClearTV.Catalog.apps[0]));const frame=p.frameLocator('#morph-media-frame');await frame.locator('#cinematic-hero').waitFor({state:'attached'});await frame.locator('#iptv-first-source').waitFor();assert(await frame.locator('#iptv-first-source').isVisible(),'Unconfigured account offers subscription/playlist setup');
  await p.evaluate(()=>MorphMedia.exit());assert.equal(await p.locator('#morph-media-frame').count(),0);
  await p.evaluate(()=>MorphMedia.action('connect',{server:'https://provider.invalid',username:'test',password:'not-a-real-credential',name:'Test',live:true,vod:true,series:true}));await p.evaluate(()=>MorphMedia.open('iptv'));await frame.locator('#cinematic-hero').waitFor({state:'attached'});assert(await frame.locator('.cinematic-hero-art').evaluate(e=>e.complete&&e.naturalWidth>0));await p.evaluate(()=>MorphMedia.exit());
  await p.evaluate(()=>ClearTV.Catalog.launch(ClearTV.Catalog.apps[1]));await p.frameLocator('#morph-media-frame').locator('.station').first().waitFor();assert.equal(await p.locator('audio').count(),0,'No automatic parent audio');await p.evaluate(()=>MorphMedia.exit());
  await p.evaluate(()=>ClearTV.Prayer.open());await p.locator('#prayer-screen').waitFor();await p.evaluate(()=>ClearTV.Prayer.close());
  await p.evaluate(()=>MorphLocale.set('ar'));await p.locator('#favourites>button').first().focus();await p.keyboard.press('ArrowRight');assert(await p.evaluate(()=>document.activeElement.closest('#favourites')!==null));
  assert((await p.locator('main').boundingBox()).y<5,'Home must start at top of viewport');
  if(process.env.MORPH_TEST_NO_SCREENSHOTS!=='1')await p.screenshot({path:'output/lg-preview-'+size.width+'.png'});assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS: LG packaged UI 1080p/720p, AR/EN, Home D-pad, IPTV settings/connect with mock provider, artwork, radio and prayer. No physical webOS test.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});



