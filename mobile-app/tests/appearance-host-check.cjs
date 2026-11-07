const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
(async()=>{
 const root=path.resolve(process.env.MORPH_HOST_FIXTURE_ROOT||'mobile-app/build/assets/ui');
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{if(!fs.existsSync(file))file=path.resolve('mobile-app/build/assets/ui','.'+decodeURIComponent(req.url.split('?')[0]));const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
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
 const report=[];
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.appAppearance),'light','Existing forced dark value migrates to the approved light default');
 for(const mode of ['light','dark'])for(const language of ['en','ar']){
  await page.evaluate(({mode,language})=>{MorphAppearance.set(mode);MorphLocale.set(language);},{mode,language});
  for(const screen of ['home','design','remote','cast','iptv']){
   await page.evaluate(s=>Morph30.show(s),screen);await page.waitForTimeout(80);
   for(const width of [320,390,600]){
    await page.setViewportSize({width,height:1000});await page.waitForTimeout(40);
    report.push({mode,language,screen,width,...await page.evaluate(audit)});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal layout overflow '+screen+' '+width);
    if(screen==='home'){
      const art=await page.locator('.connect-tv-picture').boundingBox(),copy=await page.locator('.connect-intro-copy').boundingBox();assert(copy.x+copy.width<=art.x+1,'Device hero television and copy do not overlap');
    }
    if(screen==='remote'){
      assert.equal(await page.locator('#page-remote .remote-cast-entry').count(),0,'No duplicate Cast card');assert.equal(await page.locator('#m30-control-segment [aria-selected=true]').evaluate(e=>getComputedStyle(e).webkitTextFillColor),'rgb(255, 255, 255)');
      assert.equal(await page.locator('.pm-remote-showcase .pm-remote-device').count(),0,'Old remote illustration is replaced');
      const image=await page.locator('.reference-remote-device').boundingBox(),copy=await page.locator('.pm-remote-copy').boundingBox();assert(copy.x+copy.width<=image.x+2,'Remote text stays left and artwork stays right without overlap');
    }

    const dock=await page.locator('.bottom-nav').evaluate(e=>{const r=e.getBoundingClientRect();return{bottom:r.bottom,left:r.left,right:r.right,height:innerHeight,width:innerWidth}});
    assert(Math.abs(dock.bottom-dock.height)<=1&&Math.abs(dock.left)<=1&&Math.abs(dock.right-dock.width)<=1,'Navigation reaches bottom and both viewport edges');
    if(screen==='design'){
      assert(await page.locator('.approved-preview-card').isHidden(),'Large preview card is removed from design');
      assert.equal(await page.locator('#page-studio img').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').length),1,'Only the top-right television image remains on design');
      const art=await page.locator('.reference-design-tv').boundingBox();const heading=await page.locator('#m30-design-heading h1').boundingBox();assert(art.x>=heading.x+heading.width-1,'Design illustration stays to the right of the headline');
      const lines=await page.locator('#m30-design-heading h1>span').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})));
      assert.equal(lines.length,2);assert(lines[1].top>=lines[0].bottom-1,'Design headline uses two stacked lines');
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      assert(await page.evaluate(()=>document.getElementById('apply').getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top-6),'Apply remains reachable above the dock at the end of the page');
      await page.evaluate(()=>window.scrollTo(0,0));

    }

   }
  }
  await page.evaluate(()=>{Morph30.show('home');document.getElementById('connect-step-1').open=true;});await page.locator('#scan').click();await page.locator('#devices>button').waitFor();
  report.push({mode,language,screen:'discovered-device',width:390,...await page.evaluate(audit)});
  assert.notEqual(await page.locator('#devices>button').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  await page.evaluate(()=>{Morph30.show('home');MorphGuide.setType('auto');MorphGuide.setType('android');document.getElementById('connect-step-3').open=true;});
  await page.locator('#guide-next').click();await page.locator('#guide-next').click();assert.equal(await page.locator('#guide-dots').getAttribute('aria-valuenow'),'3');assert.equal(await page.locator('#guide-dots i.done').count(),3);assert.equal(await page.locator('#guide-dots i.current').count(),1);
  const completed=await page.locator('#guide-dots i.done').first().evaluate(e=>getComputedStyle(e).backgroundColor),pending=await page.locator('#guide-dots i:not(.done)').first().evaluate(e=>getComputedStyle(e).backgroundColor);assert.notEqual(completed,pending,'Progress segments show the completed steps');
  await page.locator('#guide-prev').click();assert.equal(await page.locator('#guide-dots i.done').count(),2);
  await page.evaluate(()=>Morph30.show('design'));await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#page-studio .studio-quick-actions').count(),0,'Design contains only design features');
  assert.equal(await page.locator('#m30-control-segment [data-msub=cast]').count(),1,'Share remains accessible through the Remote section tabs');
  await page.locator('#personal-touch>summary').click();await page.waitForTimeout(70);
  assert(await page.locator('#personal-touch').evaluate(e=>e.open),'Background opens the editor');
  assert.equal(await page.locator('.morph-plus-overlay').count(),0,'Opening editor does not open purchase');
  assert.equal(await page.locator('#personal-touch').evaluate(e=>Math.round(e.getBoundingClientRect().width)),390);
  assert(await page.locator('#pick-art').isEnabled(),'Theme image stays free');
  report.push({mode,language,screen:'background-editor',width:390,...await page.evaluate(audit)});
  await page.locator('#personal-touch>.studio-editor-heading button').click();
  await page.locator('#theme-library>summary').click();await page.waitForTimeout(50);
  report.push({mode,language,screen:'theme-library-page',width:390,...await page.evaluate(audit)});
  await page.locator('#themes .theme[data-theme=night]').click();await page.waitForTimeout(70);
  assert(await page.locator('#theme-library').evaluate(e=>!e.open),'Choosing free theme returns to preview');
  assert.equal(await page.locator('#preview').evaluate(e=>e.style.getPropertyPriority('background')),'important');
  assert.equal(await page.locator('#preview-title').evaluate(e=>getComputedStyle(e).webkitTextFillColor),'rgb(255, 255, 255)');
  await page.locator('#personal-touch>summary').click();await page.waitForTimeout(50);
  await page.locator('.studio-editor-plus button').click();await page.waitForTimeout(50);
  assert.equal(await page.locator('.morph-plus-overlay').count(),1,'Plus opens only after an explicit choice');
  report.push({mode,language,screen:'plus-page',width:390,...await page.evaluate(audit)});
  assert.equal(await page.locator('.plus-actions').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','No black footer behind Plus actions');
  await page.locator('.plus-close').click();
  await page.evaluate(()=>{window.qaPlusGetter=MorphPlus.isActive;MorphPlus.isActive=()=>true;dispatchEvent(new Event('morphPlus'));});
  assert(await page.locator('#backgroundStart').isEnabled(),'Activated Plus retains existing editor controls');
  await page.evaluate(()=>{const input=document.getElementById('backgroundStart');input.value='#123456';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert(await page.locator('#preview').evaluate(e=>e.style.background.includes('18, 52, 86')),'Editing a background updates the real preview');
  await page.evaluate(()=>{MorphPlus.isActive=qaPlusGetter;delete window.qaPlusGetter;dispatchEvent(new Event('morphPlus'));});
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{Morph30.show('home');MorphGuide.state('connected','Connected','Ready');const toast=document.getElementById('toast');toast.hidden=false;toast.dataset.state='connected';toast.textContent='Connection verified.';});await page.waitForTimeout(40);report.push({mode,language,screen:'connected-success',width:600,...await page.evaluate(audit)});assert.equal(await page.locator('#connection-state').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(36, 99, 235)');await page.evaluate(()=>document.getElementById('toast').hidden=true);
  await page.locator('#m30-gear-btn').click();await page.waitForTimeout(40);
  report.push({mode,language,screen:'settings',width:600,...await page.evaluate(audit)});
  assert.equal(await page.locator('.appearance-choice').count(),1);
  await page.locator('#m30-settings-close').click();
 }
 await page.evaluate(()=>MorphAppearance.set('dark'));await page.reload();await page.waitForFunction(()=>document.body.hasAttribute('data-approved-mobile'));
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.appAppearance),'dark','Explicit selection survives restart');
 fs.writeFileSync('output/mobile292-host-contrast.json',JSON.stringify(report,null,2));
 console.log('Checked',report.length,'host states;',report.reduce((s,x)=>s+x.checked,0),'text appearances;',report.reduce((s,x)=>s+x.failures.length,0),'contrast findings');
 const findings=[...new Map(report.flatMap(r=>r.failures.map(f=>[r.mode+f.id+f.classes+f.text,{mode:r.mode,screen:r.screen,...f}]))).values()];console.log(JSON.stringify(findings.slice(0,50),null,2));
 assert.deepEqual(errors,[]);assert.equal(report.reduce((s,x)=>s+x.failures.length,0),0,'Every audited host state must pass text contrast');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
