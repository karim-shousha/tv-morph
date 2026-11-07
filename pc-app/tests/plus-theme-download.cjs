const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{_electron}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/plus-theme-download');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const app=await _electron.launch({args:process.env.MORPH_PC_TEST_EXECUTABLE?[]:[root],executablePath:process.env.MORPH_PC_TEST_EXECUTABLE||undefined,env:{...process.env,MORPH_PC_TEST_DATA:path.join(out,'user-'+Date.now()),ELECTRON_RUN_AS_NODE:undefined}});
 try{
  await app.evaluate(({net},{files})=>{
   const original=net.fetch.bind(net);global.themeRequests=[];
   net.fetch=async(url,options={})=>{
    const u=new URL(url);if(u.origin!=='https://morph-tv.com')return original(url,options);
    if(u.pathname==='/api/plus/status')return Response.json({active:true,scope:'tv',maxDevices:5,usedDevices:1,remainingDevices:4});
    if(u.pathname.startsWith('/api/plus/assets/')){
     const headers=new Headers(options.headers);const authorized=headers.get('Authorization')==='Bearer '+'b'.repeat(48);
     themeRequests.push({path:u.pathname,authorized,redirect:options.redirect});
     if(!authorized)return new Response('Plus required',{status:403});
     return new Response(Uint8Array.from(atob(files[u.pathname.split('/').pop()]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp'}});
    }
    if(u.pathname.startsWith('/theme-packs/')){global.ordinaryAuthorization=new Headers(options.headers).get('Authorization');return new Response(Uint8Array.from(atob(files[u.pathname.split('/').pop()]),c=>c.charCodeAt(0)));}
    return new Response('Fixture does not provide this route',{status:404});
   };
  },{files:Object.fromEntries(fs.readdirSync(path.resolve(root,'../distribution/theme-packs')).filter(n=>n.startsWith('national-v6-')).map(n=>[n,fs.readFileSync(path.resolve(root,'../distribution/theme-packs',n)).toString('base64')]))});
  const page=await app.firstWindow();await page.waitForFunction(()=>window.MorphPlus&&window.ThemePacks&&window.ClearTV);
  await page.evaluate(()=>MorphPlus.restoreIdentity({device:'a'.repeat(48),token:'b'.repeat(48)}));
  assert(await page.evaluate(()=>MorphPlus.isActive()),'Fixture account must be active');
  await page.evaluate(async()=>{await ThemePacks.download('national');const result=ClearTV.applyRemoteConfig({theme:'egypt'});if(!result.applied)throw Error(result.error);});
  assert.equal(await page.evaluate(()=>ClearTV.settings.theme),'egypt');
  assert(await page.evaluate(()=>ThemePacks.status('national').installed));
  assert((await page.locator('#cinema-background>img').first().getAttribute('src')).startsWith('blob:'),'Paid art must render after a real checksum-verified download');
  assert.equal(await page.locator('.morph-plus-overlay').count(),0,'An active account must not be sent back to the Plus screen');
  const requests=await app.evaluate(()=>global.themeRequests);assert(requests.length>0);assert(requests.every(row=>row.authorized&&row.redirect==='error'));
  const ordinary=await page.evaluate(async()=>{const response=await fetch('https://morph-tv.com/theme-packs/national-v6-egypt-national-team-v1.webp',{headers:{Authorization:'Bearer '+'b'.repeat(48)}});return response.status;});assert.equal(ordinary,200);
  assert.equal(await app.evaluate(()=>global.ordinaryAuthorization),null,'Activation must not be forwarded to ordinary remote requests');
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,protectedFiles:requests.length,activeAccount:true,theme:'egypt',rendered:true,protocol:'Actual Electron morph protocol + production XHR transport; upstream fixture enforces bearer authorization'},null,2));
  console.log('PASS actual Electron: active Plus downloads protected artwork through the desktop protocol, verifies hashes and applies theme without reopening Plus');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exit(1);});
