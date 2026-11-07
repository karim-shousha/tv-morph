const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});try{
 for(const language of ['ar','en']){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.route(/^https?:/,r=>r.abort());
  await page.addInitScript(()=>{window.ClearNative={saveDraft(){},request(id,action,raw){const data=action==='info'?{phoneIp:'192.0.2.11',draft:{theme:'night'}}:action==='scan'?[]:action==='phoneIptvSummary'?{configured:false}:{};setTimeout(()=>nativeResult(id,true,data),0)}};});
  const url=pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href;await page.goto(url);
  await page.locator('#morph-first-run').waitFor();assert(await page.locator('#fr-start').isDisabled());assert.equal(await page.locator('[data-first-language]').count(),2);assert(await page.locator('.bottom-nav').evaluate(e=>e.inert));
  assert.equal(await page.evaluate(()=>Morph30.back()),true);assert(await page.locator('#morph-first-run').isVisible());
  await page.locator(`[data-first-language=${language}]`).click();assert.equal(await page.locator('html').getAttribute('lang'),language);assert(await page.locator('#fr-start').isEnabled());
  for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.locator('#morph-first-run').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No welcome overflow');}
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const e=document.querySelector('#morph-first-run img');return e.complete&&e.naturalWidth>0});await page.screenshot({path:path.resolve(`output/mobile-welcome-${language}.png`)});
  await page.locator('#fr-start').click();assert.equal(await page.locator('#morph-first-run').count(),0);assert(await page.locator('#page-connect').isVisible());assert(await page.locator('.bottom-nav').evaluate(e=>!e.inert));
  await page.reload();await page.waitForFunction(()=>document.body.hasAttribute('data-approved-mobile'));assert.equal(await page.locator('#morph-first-run').count(),0);assert.equal(await page.locator('html').getAttribute('lang'),language);
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS first run: explicit AR/EN choice, translated welcome/services, background focus blocked, Android Back guarded, 320/390/844, start and persistent locale without repeat.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
