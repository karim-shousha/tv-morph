const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const {pathToFileURL}=require('url'),path=require('path'),assert=require('assert');
const URL='android-tv/iptv/index.html';
async function readyPage(b){const p=await b.newPage({viewport:{width:1920,height:1080}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});await p.route('**/locale.js',r=>r.fulfill({body:require('fs').readFileSync('mobile-app/assets/ui/locale.js','utf8'),contentType:'text/javascript'}));
await p.addInitScript(()=>{function summary(){return {configured:true,profileId:'a',viewerId:'default',viewerName:'Family',type:'xtream',live:true,vod:true,series:true,subscription:{status:'Active',expires:Date.now()/1000+864000},accounts:[{id:'a',name:'Account A',subscription:{status:'Active',expires:Date.now()/1000+864000},active:true}]};}window.IptvNative={settingsJson:()=>'{"language":"en"}',showKeyboard(){},request(id,action,payload){const q=JSON.parse(payload);let value={};if(action==='summary')value=summary();else if(action==='settings')value={language:'en',resume:true};else if(action==='connect'){localStorage.setItem('fixture.server',q.server||'');localStorage.setItem('fixture.user',q.username||'');value=summary();}else if(action==='categories')value={items:[]};else if(action==='list')value={items:[],total:0,page:0,hasMore:false};else if(action==='accounts')value={items:summary().accounts};else if(action==='progress'||action==='history')value={items:[]};setTimeout(()=>window.iptvResult(id,true,value),1);}};});
await p.goto(pathToFileURL(path.join(process.cwd(),URL)).href);
await p.waitForFunction(()=>window.IptvTvBridge&&window.IptvTvBridge.homeInfo&&window.IptvTvBridge.homeInfo().profileId==='a');
await p.evaluate(async()=>{await IptvTvBridge.showAccount();window.IptvSettingsPages.open('add');});
await p.waitForSelector('#account-server:not([hidden])');
return {p,errors};}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
// Case 0: port field visibility per type
let t=await readyPage(b),p=t.p,errors=t.errors;
assert(await p.locator('#account-port').isVisible(),'port field visible for xtream');
await p.locator('#account-method-m3u').click();assert(await p.locator('#account-port').isHidden(),'port field hidden for m3u');
await p.locator('#account-method-xtream').click();await p.close();
// Case A: host without port + port field -> combined
t=await readyPage(b);p=t.p;errors.push(...t.errors);
await p.locator('#account-server').fill('example.com');await p.locator('#account-port').fill('8080');
await p.locator('#account-user').fill('user1');await p.locator('#account-password').fill('pass1');
await Promise.all([p.waitForNavigation({waitUntil:'load'}).catch(()=>{}),p.locator('#account-save').click()]);
await p.waitForFunction(()=>localStorage.getItem('fixture.server')==='example.com:8080');
assert.equal(await p.evaluate(()=>localStorage.getItem('fixture.user')),'user1');
await p.close();
// Case B: existing port in server + port field -> replaced
t=await readyPage(b);p=t.p;errors.push(...t.errors);
await p.locator('#account-server').fill('http://example.com:8181/live');await p.locator('#account-port').fill('9090');
await p.locator('#account-user').fill('user1');await p.locator('#account-password').fill('pass1');
await Promise.all([p.waitForNavigation({waitUntil:'load'}).catch(()=>{}),p.locator('#account-save').click()]);
await p.waitForFunction(()=>localStorage.getItem('fixture.server')==='http://example.com:9090/live');
await p.close();
// Case C: invalid port -> blocked with guidance, no connect
t=await readyPage(b);p=t.p;errors.push(...t.errors);
await p.locator('#account-server').fill('example.com');await p.locator('#account-port').fill('abc');
await p.locator('#account-user').fill('user1');await p.locator('#account-password').fill('pass1');
await p.locator('#account-save').click();await p.waitForTimeout(400);
assert(/المنفذ|Invalid port/.test(await p.locator('#account-status').innerText()),'invalid port explained');
assert.equal(await p.evaluate(()=>localStorage.getItem('fixture.server')),null,'no connect on invalid port');
// Case D: no port anywhere -> passes through untouched
await p.locator('#account-port').fill('');await p.locator('#account-server').fill('http://example.com');
await Promise.all([p.waitForNavigation({waitUntil:'load'}).catch(()=>{}),p.locator('#account-save').click()]);
await p.waitForFunction(()=>localStorage.getItem('fixture.server')==='http://example.com');
assert.deepEqual(errors,[]);console.log('PASS account port option: explicit port combined, existing port replaced, invalid port blocked with guidance, empty port passes through untouched. Native/backend mocked.');
await p.screenshot({path:'output/iptv-account-port-preview.png'});await p.close();}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
