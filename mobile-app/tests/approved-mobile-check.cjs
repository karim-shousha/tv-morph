const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
(async()=>{
 const root=path.resolve('mobile-app/build/assets/ui');
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));
  await page.route(/^https?:/,r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
  await page.addInitScript(()=>{localStorage.setItem('tvmorph.onboarded30','1');localStorage.setItem('morph.first-run.pearl.v1','1');localStorage.setItem('morph.welcome-support.v1','1');localStorage.setItem('tvmorph.appearance','dark');window.requests=[];window.fixtureReady=false;
   window.ClearNative={setAppearance(mode){window.appearance=mode},saveDraft(s){window.saved=JSON.parse(s)},request(id,action,s){const payload=JSON.parse(s);requests.push({action,payload});const data=action==='info'?{phoneIp:'10.0.0.64',tvIp:'10.0.0.137',brand:'android',draft:{theme:'night'}}:action==='connectionStatus'?{selected:true,ready:fixtureReady,message:'Fixture TV'}:action==='apps'?{apps:[],pins:[]}:action==='phoneIptvSummary'?{configured:false}:action==='phoneIptvOpen'||action==='remoteOpen'?{opened:true,embedded:true}:action==='scan'?[{name:'Fixture TV',ip:'192.0.2.137',model:'Smart TV',brand:'android'}]:{};setTimeout(()=>nativeResult(id,true,data),0)}};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);await page.waitForFunction(()=>document.body.hasAttribute('data-approved-mobile'));
  await page.evaluate(()=>Morph30.show('design'));
  for(const language of ['ar','en']){
   await page.evaluate(language=>{const e=document.getElementById('app-language');e.value=language;e.dispatchEvent(new Event('change',{bubbles:true}));},language);
   for(const width of [320,390,600]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow ${language} ${width}`);const brand=await page.locator('.brand').boundingBox(),reconnect=await page.locator('.studio-reconnect').boundingBox();assert(brand.x+brand.width<=reconnect.x+1,'Header overlap');}
   await page.setViewportSize({width:390,height:1000});await page.evaluate(()=>{Morph30.show('design');scrollTo(0,0)});await page.screenshot({path:path.resolve(`output/approved-mobile-${language}.png`),fullPage:true});
  }
  assert.equal(await page.locator('html').getAttribute('data-app-appearance'),'light');assert.equal(await page.evaluate(()=>window.appearance),'light');
  assert(await page.locator('#apply').isDisabled());
  await page.locator('.studio-theme-line button').click();assert(await page.locator('#theme-library').getAttribute('open')!==null);
  await page.locator('.theme[data-theme=blue]').click();await page.waitForFunction(()=>window.saved?.theme==='blue');
  await page.evaluate(()=>{window.fixtureReady=true;window.checkMorphConnection();});await page.waitForFunction(()=>!document.getElementById('apply').disabled);
  await page.locator('#apply').click();await page.waitForFunction(()=>requests.some(r=>r.action==='apply'&&r.payload.theme==='blue'));await page.locator('#operation-close').click();
  await page.locator('#reconnect-action').click();assert(await page.locator('#page-connect').isVisible());assert(await page.locator('#tv-ip').evaluate(e=>document.activeElement===e));
  await page.locator('.bottom-nav [data-page=control]').click();await page.locator('#integrated-remote-open').click();await page.waitForFunction(()=>requests.some(r=>r.action==='remoteOpen'));
  await page.evaluate(()=>{Morph30.show('home');document.getElementById('scan').click();});await page.waitForFunction(()=>document.querySelectorAll('#devices>button').length===1);assert.equal(await page.locator('#devices>button').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(232, 239, 255)','Discovered TV has strong blue surface');await page.evaluate(()=>{document.getElementById('connection-state').dataset.status='connected';});assert.equal(await page.locator('#connection-state').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(230, 239, 255)','Connected status is blue, not green');assert.deepEqual(errors,[]);console.log('PASS approved light design: previous-dark migration; AR/EN at 320/390/600; header/logo; real theme/save/apply payload; Reconnect IP focus; embedded remote launch; no script errors.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
