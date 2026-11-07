const {chromium}=require('../../pc-app/node_modules/playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert/strict');
const out=process.env.PHONE_HOME_QA_OUTPUT||'output/home-services-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const lang of ['ar','en'])for(const width of [320,390,600]){
   const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
   await page.addInitScript(lang=>{
    localStorage.setItem('morph.first-run.pearl.v1','1');localStorage.setItem('morph.support.last-shown',String(Date.now()));localStorage.setItem('tvmorph.onboarded30','1');localStorage.setItem('morph.welcome-support.v1','1');localStorage.setItem('tvmorph.language',lang);
    window.requests=[];window.ClearNative={settingsJson:()=>JSON.stringify({language:lang}),setLanguage(){},request(id,action,s){
     const payload=JSON.parse(s);requests.push({action,payload});
     const data=action==='info'?{phoneIp:'10.0.0.64',tvIp:'',brand:'samsung',draft:{theme:'night'}}:action==='connectionStatus'?{selected:false,ready:false}:action==='scan'?[]:action==='apps'?{apps:[],pins:[]}:{};
     setTimeout(()=>window.nativeResult(id,true,data),0);
    }};
   },lang);
   await page.goto(pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href);
   await page.locator('#page-start .rebuild-tile').nth(7).waitFor();
   const order=await page.locator('#page-start .rebuild-tile').evaluateAll(nodes=>nodes.map(n=>n.dataset.homeFeature));
   assert.deepEqual(order,['tv','bridge','remote','play','design','prayer','plus','cleaner']);
   assert.match(await page.locator('[data-home-feature=tv] strong').textContent(),lang==='ar'?/تثبيت/:/Install/);
   assert.match(await page.locator('[data-home-feature=bridge] strong').textContent(),/APK/);
   const layout=await page.locator('#page-start').evaluate(section=>{
    const hero=section.querySelector('.rebuild-hero').getBoundingClientRect();
    const tiles=[...section.querySelectorAll('.rebuild-tile')].map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,overflow:[...n.querySelectorAll("strong,small,svg")].some(child=>{const c=child.getBoundingClientRect();return c.left<r.left-1||c.right>r.right+1||c.top<r.top-1||c.bottom>r.bottom+1})};});
    return {heroHeight:hero.height,heroGap:tiles[0].y-hero.bottom,tiles,pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert(layout.heroHeight<=210 && layout.heroGap>=0 && layout.heroGap<=14,JSON.stringify(layout));assert(!layout.pageOverflow);assert(layout.tiles.every(t=>!t.overflow),JSON.stringify(layout));
   for(let row=0;row<4;row++)assert(Math.abs(layout.tiles[row*2].y-layout.tiles[row*2+1].y)<2);
   if(width===390)await page.screenshot({path:path.join(out,'home-'+lang+'.png'),fullPage:true});
   await page.locator('[data-home-feature=bridge]').click();await page.waitForFunction(()=>requests.some(x=>x.action==='bridgeOpen'));
   await page.locator('[data-home-feature=cleaner]').click();await page.waitForFunction(()=>requests.some(x=>x.action==='cleanerOpen'));
   await page.locator('[data-home-feature=tv]').click();await page.locator('#page-connect:not([hidden])').waitFor();
   await page.evaluate(()=>MorphPhoneShell.navigate('home'));
   await page.locator('[data-home-feature=plus]').click();await page.locator('.morph-plus-overlay').waitFor();
   assert.deepEqual(errors,[]);console.log('PASS eight ordered services, compact hero, installation/Bridge/Cleaner/Plus actions',width,lang);await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
