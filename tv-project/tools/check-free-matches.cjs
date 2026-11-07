const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const feed=JSON.parse(fs.readFileSync('output/matches-free-snapshot.json','utf8'));
 assert(feed.matches.length>0,'Use a captured real API response');
 const report=[];const preview=path.resolve('output/matches-preview.html');fs.writeFileSync(preview,fs.readFileSync('tv-project/app/index.html','utf8').replace('<head>','<head><base href="'+pathToFileURL(path.resolve('tv-project/app')).href+'/">').replace('<body data-theme=','<body data-fixed-layout="true" data-theme='));
 try{for(const lang of ['en','ar']){
  const p=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];let calls=0;
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({lang,feed})=>{
   window.MorphLocale={get:()=>lang,t:(a,b)=>lang==='ar'?a:b};
   localStorage.setItem('morph.welcome-support.v1','1');
   localStorage.setItem('cleartv.settings',JSON.stringify({theme:'blue',motion:false,showHomeHdmi:true}));
   localStorage.setItem('cleartv.matches-free-v1',JSON.stringify(feed));
  },{lang,feed});
  await p.route(/^https?:/,r=>{
   if(r.request().url().startsWith('https://r2.thesportsdb.com/images/media/team/badge/'))return r.continue();if(r.request().url().includes('/api/matches')){calls++;return r.fulfill({json:feed});}
   return r.fulfill({status:503,json:{error:'offline_preview'}});
  });
  await p.goto(pathToFileURL(preview).href);
  await p.waitForFunction(()=>window.ClearTV&&ClearTV.Matches);
  await p.waitForTimeout(1100);
  await p.locator('#home-matches').focus();
  const homeBounds=await p.locator('#home-matches').boundingBox(),prayer=await p.locator('#home-next-prayer').boundingBox(),dock=await p.locator('#favourites').boundingBox();
  assert(homeBounds&&homeBounds.y>=100,'Card is on-screen below header');
  if(prayer)assert(homeBounds.y>=prayer.y+prayer.height-1||homeBounds.y+homeBounds.height<=prayer.y+1,'Prayer and matches do not overlap');
  assert(homeBounds.y+homeBounds.height<dock.y,'Card clears the dock');
  await p.screenshot({path:path.resolve('output/matches-home-badges-v3-'+lang+'.png')});
  await p.keyboard.press('Enter');await p.waitForSelector('#view-matches',{state:'visible'});await p.waitForTimeout(100);
  assert(await p.locator('.match-row').count()>0);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'matches-tab-upcoming');
  await p.waitForFunction(()=>document.querySelectorAll('.match-initial.has-badge img').length>=6,{},{timeout:12000});await p.screenshot({path:path.resolve('output/matches-club-badges-v3-'+lang+'.png')}); 
  await p.keyboard.press(lang==='ar'?'ArrowLeft':'ArrowRight');assert.equal(await p.evaluate(()=>document.activeElement.id),'matches-tab-results');
  await p.locator('#matches-tab-results').focus();await p.keyboard.press('Enter');
  assert(await p.locator('.match-row').count()>0);
  await p.screenshot({path:path.resolve('output/matches-simple-results-'+lang+'.png')});
  await p.locator('#matches-team-138995').click();assert.equal(await p.locator('.match-row').count(),1);
  assert((await p.locator('.match-detail strong').textContent()).includes('4 – 0'));
  await p.evaluate(()=>ClearTV.Remote.key('RETURN'));assert.equal(await p.locator('#view-home').getAttribute('hidden'),null);await p.waitForSelector('#home-matches',{state:'visible'});
  assert.equal(await p.evaluate(()=>document.activeElement.id),'home-matches');
  await p.keyboard.press('Enter');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'home-matches');
  await p.keyboard.press('Enter');await p.waitForTimeout(100);await p.locator('#matches-manage-favorites').click();await p.locator('#matches-favorite-138995').click();await p.locator('#matches-favorite-133602').click();assert.deepEqual(await p.evaluate(()=>ClearTV.read('matchesFavorites',[])),['138995','133602']);await p.keyboard.press('Escape');assert.equal(await p.locator('#matches-favorite-panel').count(),0);await p.keyboard.press('Escape');await p.evaluate(()=>{ClearTV.showView('settings');ClearTV.SettingsNav.open('home');});await p.locator('#setting-home-matches').click();assert(await p.locator('#home-matches').isHidden());assert.equal(await p.evaluate(()=>ClearTV.read('settings',{}).showHomeMatches),false);await p.locator('#setting-home-matches').click();assert.equal(await p.evaluate(()=>ClearTV.read('settings',{}).showHomeMatches),true);assert.equal(calls,0,'Fresh cache prevents duplicate requests on navigation');
  assert.deepEqual(errors,[]);report.push({lang,realMatches:feed.matches.length,calls,homeBounds});await p.close();
 }}finally{await browser.close();fs.unlinkSync(preview);}
 fs.writeFileSync('output/matches-simple-ui-check.json',JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
