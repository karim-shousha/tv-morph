const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),{pathToFileURL}=require('url'),assert=require('assert');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});try{const p=await b.newPage({viewport:{width:1920,height:1080}});await p.route(/^https?:/,r=>r.abort());await p.goto(pathToFileURL(path.resolve('mobile-app/tests/samsung-ui/index.html')).href);await p.waitForSelector('#samsung-apps-shelf [data-app-id]');
await p.evaluate(()=>{window.launches=0;ClearTV.Catalog.launch=()=>window.launches++;});
const shelf=p.locator('#samsung-apps-shelf [data-app-id]');const first=await shelf.first().getAttribute('data-app-id');await shelf.first().focus();await p.keyboard.down('Enter');await p.waitForTimeout(800);assert(await p.locator('#reorder-hint').isVisible());
// Real remotes repeatedly send keydown while OK is held. None may finish Move.
for(let i=0;i<7;i++)await p.keyboard.down('Enter');await p.waitForTimeout(1500);assert(await p.locator('#reorder-hint').isVisible());await p.keyboard.up('Enter');assert(await p.locator('#reorder-hint').isVisible());assert.equal(await p.evaluate(()=>window.launches),0);
await p.keyboard.press('ArrowRight');assert.equal(await shelf.nth(1).getAttribute('data-app-id'),first);assert(await p.locator('#reorder-hint').isVisible());await p.keyboard.press('Enter');assert(await p.locator('#reorder-hint').isHidden());assert.equal(await p.evaluate(()=>window.launches),0);
await p.reload();await p.waitForSelector('#samsung-apps-shelf [data-app-id]');assert.equal(await shelf.nth(1).getAttribute('data-app-id'),first);
await shelf.first().focus();await p.keyboard.down('Enter');await p.waitForTimeout(750);await p.keyboard.up('Enter');await p.keyboard.press('Escape');assert(await p.locator('#reorder-hint').isHidden());
// Pointer hold remains active even beyond the old 900ms click suppression window.
await shelf.first().scrollIntoViewIfNeeded();let box=await shelf.first().boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(1900);await p.mouse.up();assert(await p.locator('#reorder-hint').isVisible());await p.keyboard.press('Escape');assert(await p.locator('#reorder-hint').isHidden());
console.log('PASS: held OK repeats, release, persistent Move, arrow reorder, deliberate OK save, Back exit, reload persistence and long pointer release.');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
