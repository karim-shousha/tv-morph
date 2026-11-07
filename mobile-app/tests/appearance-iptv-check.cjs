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
 await page.addInitScript(theme=>{
  localStorage.clear();localStorage.setItem('tvmorph.phone.first-source.v1','free');window.sent=[];
  window.IptvNative={settingsJson(){return JSON.stringify({phoneAppearance:theme});},openTrailer(){},supportsMultiView(){return true;},multiView(){sent.push({action:'multiview'});},exit(){window.exited=true},request(id,action,raw){const q=JSON.parse(raw);sent.push({action,payload:q});let data={};
   if(action==='summary')data={accounts:[{id:'test-one',name:'QA One',active:true,type:'m3u',subscription:{status:'Active',checked:true}},{id:'test-two',name:'QA Two',active:false,type:'m3u'}],configured:true,type:'xtream',subscription:{status:'Active',expires:Math.floor(Date.now()/1000)+8640000,checkedAt:Math.floor(Date.now()/1000)},profileId:'test-one',name:'My library',live:true,vod:true,series:true};
   if(action==='refresh')window.refreshed=true;
   if(action==='removeAccount')data={removed:true,accounts:[{id:'test-two',name:'QA Two',active:true,type:'m3u'}]};
   if(action==='settings')data={language:'ar',resume:true};
   if(action==='profiles'||action==='history')data={items:[]};
   if(action==='categories')data={items:[{category_id:'101',category_name:'أخبار عربية'},{category_id:'102',category_name:'رياضة'}]};
   if(action==='list')data={items:Array.from({length:24},(_,i)=>({id:String(i+1),category:q.category||'101',category_id:q.category||'101',kind:q.kind==='all'?'live':q.kind,name:(window.refreshed?'Updated ':'')+['2M','Al Iraqia (1080p)','قناة الأخبار العربية والبث المباشر','Ajman TV (1080p)','Afaq TV','Al Ittihad TV (552p) [Not 24/7]'][i%6],icon:'https://fixture.test/logo'+i+'.svg',rating:'8',year:'2026',resumeMs:45000})),total:24,hasMore:false};
   if(action==='progress')data={items:q.items};if(action==='details')data=q;
   setTimeout(()=>iptvResult(id,true,data),0);
  }};
 },process.env.MORPH_TEST_APPEARANCE||'light');
 await page.goto(pathToFileURL(path.resolve(process.env.MORPH_IPTV_FIXTURE_ROOT||'mobile-app/build/assets/iptv/index.html')).href);
 await page.waitForFunction(()=>document.body.hasAttribute('data-phone-library'));
 await page.locator('#stream-loading').waitFor({state:'detached'});
 const audit=()=>{
  const rgb=s=>{const n=s.match(/[\d.]+/g);return n?[+n[0],+n[1],+n[2],n.length>3?+n[3]:1]:[0,0,0,0]};
  const over=(a,b)=>a.slice(0,3).map((x,i)=>x*a[3]+b[i]*(1-a[3])).concat(1);
  const lum=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const results=[];let checked=0;
  for(const e of document.querySelectorAll('button,label,summary,p,h1,h2,h3,strong,small,span,a,input,select')){
   if(e.tagName==='INPUT'&&['checkbox','radio','color','range','file','hidden'].includes(e.type))continue;
   if(e.closest('[hidden],[inert],#preview,.theme-swatch,.approved-logo-ink,.phone-logo-ink')||e.disabled)continue;
   if(!e.getClientRects().length)continue;const s=getComputedStyle(e),r=e.getBoundingClientRect();if(s.visibility==='hidden'||+s.opacity===0||!r.width||!r.height)continue;
   const text=Array.from(e.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||(['INPUT','SELECT'].includes(e.tagName)?(e.value||e.placeholder):'');if(!text)continue;
   let bg=[244,247,251,1],anc=[];for(let n=e;n;n=n.parentElement)anc.push(n);
   for(const n of anc.reverse()){let st=getComputedStyle(n),c=rgb(st.backgroundColor);const gradient=st.backgroundImage.match(/(?:rgba?\([^)]*\))/);if(gradient)c=rgb(gradient[0]);bg=over(c,bg);}
   const foreground=rgb(s.webkitTextFillColor||s.color);foreground[3]*=anc.reduce((a,n)=>a*Number(getComputedStyle(n).opacity),1);const fg=over(foreground,bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);checked++;
   const minimum=parseFloat(s.fontSize)>=24||parseFloat(s.fontSize)>=18.66&&+s.fontWeight>=700?3:4.5;
   if(ratio<minimum-.02)results.push({id:e.id,classes:e.className,text:text.slice(0,65),fg:s.webkitTextFillColor||s.color,bg:bg.map(Math.round).join(','),ratio:+ratio.toFixed(2)});
  }
  return {checked,failures:results};
 };

 page.setDefaultTimeout(7000);
 const report=[];const mode=process.env.MORPH_TEST_APPEARANCE||'light';
 async function check(screen,language,width){await page.waitForTimeout(30);report.push({mode,screen,language,width,...await page.evaluate(audit)});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow '+screen);}
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.appAppearance),mode);
 for(const language of ['ar','en']){
  await page.evaluate(l=>MorphLocale.set(l),language);
  for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);await page.evaluate(()=>document.getElementById('home-open').click());await page.locator('#phone-iptv-home').waitFor({state:'visible'});await check('home',language,size.width);
   for(const kind of ['live','vod','series']){
    await page.evaluate(k=>document.getElementById('kind-'+k).click(),kind);await page.waitForFunction(()=>document.querySelectorAll('#items .tile').length>=12);await check(kind,language,size.width);
   }
   await page.locator('#phone-categories-open').click();await check('categories',language,size.width);
   await page.locator('.phone-category-bar button').click();assert(await page.locator('#phone-category-drawer').isHidden());
   await page.locator('#stream-sources').click();await check('sources',language,size.width);
   await page.locator('#phone-host-back').click();assert(await page.locator('#stream-source-menu').isHidden());assert(!await page.evaluate(()=>window.exited),'Back closes sources before leaving IPTV');
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.getElementById('kind-vod').click());await page.locator('#items .tile').first().click();await page.locator('#details-panel').waitFor({state:'visible'});await check('details',language,390);await page.evaluate(()=>IptvUI.back());
  await page.evaluate(()=>IptvUI.settings(false));await page.locator('#settings-panel').waitFor({state:'visible'});
  for(const section of ['accounts','add','playback','library']){await page.evaluate(s=>IptvSettingsPages.open(s),section);await check('settings-'+section,language,390);if(section==='accounts'){assert.equal(await page.locator('.is-active .iptv-account-state').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(36, 99, 235)');assert.equal(await page.locator('[data-subscription-status=active]').count(),1);const remove=page.locator('[data-remove-account-id]').first();if(await remove.isVisible()){await remove.click();await check('delete-confirmation',language,390);await page.locator('#account-delete-cancel').click();}}if(section==='add'){for(const method of ['xtream','m3u','portal']){await page.locator('#account-method-'+method).click();await check('import-'+method,language,390);}}}
  await page.evaluate(()=>{for(let i=0;i<3;i++)IptvUI.back();});
 }
 await page.evaluate(()=>{IptvTvBridge.notice('Test: readable error message','error');});await check('feedback-error','en',390);
 fs.writeFileSync('output/mobile292-iptv-'+mode+'-contrast.json',JSON.stringify(report,null,2));
 const findings=[...new Map(report.flatMap(r=>r.failures.map(f=>[f.id+f.classes+f.text,{screen:r.screen,...f}]))).values()];console.log('Checked',report.length,'IPTV states;',report.reduce((s,x)=>s+x.checked,0),'text appearances;',report.reduce((s,x)=>s+x.failures.length,0),'contrast findings');console.log(JSON.stringify(findings.slice(0,55),null,2));assert.deepEqual(errors,[]);assert.equal(report.reduce((s,x)=>s+x.failures.length,0),0,'Every audited IPTV state must pass text contrast');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
