const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.addInitScript(()=>{window.TVNative={appsJson:()=> '[]',inputsJson:()=> '[]',radioJson:()=> '[]',saveSettings:()=>{},pairing:()=>{},iptv:()=>{}};});
 await page.goto(pathToFileURL(path.resolve('android-tv/build/assets/tv/index.html')).href);
 const art='data:image/png;base64,'+fs.readFileSync('tv-project/app/assets/madrid.png').toString('base64');
 for(const lang of ['ar','en'])for(const theme of ['blue','night','emerald','amber','violet','ahly','madrid','barcelona','egypt','zamalek']){
  await page.evaluate(({theme,lang,art})=>{MorphLocale.set(lang);ClearTV.applyRemoteConfig({theme,artImage:art,customTitle:'',customSubtitle:''});}, {theme,lang,art});
  await page.waitForFunction(()=>document.querySelector('.club-team-photo img').complete);
  const boxes=await page.evaluate(()=>{function r(s){let v=document.querySelector(s).getBoundingClientRect();return {l:v.left,r:v.right,t:v.top,b:v.bottom,w:v.width};}return {logo:r('.club-hero-logo'),copy:r('.club-hero-copy'),photo:r('.club-team-photo'),duplicate:!!document.getElementById('personal-art')};});
  assert(!boxes.duplicate,'duplicate overlay image');
  if(['ahly','madrid','barcelona','egypt','zamalek'].includes(theme))assert(boxes.logo.r+15<=boxes.copy.l,theme+' '+lang+' crest/copy overlap');
  assert(boxes.copy.w>=500,theme+' text column too narrow');
  assert(boxes.copy.r+15<=boxes.photo.l,theme+' '+lang+' copy/art overlap');
  if(theme==='madrid'&&lang==='en')await page.screenshot({path:'android-tv/hero-madrid-fixed.png'});
  if(theme==='ahly'&&lang==='ar')await page.screenshot({path:'android-tv/hero-ahly-fixed.png'});
 }
 await page.evaluate(()=>ClearTV.applyRemoteConfig({theme:'madrid',artImage:''}));assert(await page.locator('.club-team-photo').isHidden());
 await page.evaluate(()=>ClearTV.applyRemoteConfig({theme:'ahly',artImage:''}));assert(await page.locator('.club-team-photo').isVisible());await page.waitForFunction(()=>document.querySelector('.club-team-photo img').complete);await page.screenshot({path:'android-tv/hero-ahly-fixed.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 10 themes × Arabic/English; crest left, text middle, image right; no duplicate overlay; correct no-art fallback.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
