const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Matches,normalize}=require('../matches.cjs');
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'morph-matches-'));let calls=0;const event={idEvent:'123',dateEvent:new Date().toISOString().slice(0,10),strTime:'20:00:00',strHomeTeam:'Home',strAwayTeam:'Away',idHomeTeam:'133738',idAwayTeam:'133739',strLeague:'Test league',strStatus:'NS',intHomeScore:null,intAwayScore:''};
 const cache=new Matches(dir,async url=>{calls++;return url.includes('herroshetta.com')?new Response('{}',{status:404}):Response.json({events:[event]});});
 const data=await cache.snapshot();assert.equal(data.matches.length,1);assert.equal(data.matches[0].score.home,null);assert.equal(data.matches[0].status,'scheduled');assert.equal(data.loading,false);assert.equal(calls,13);await cache.snapshot();assert.equal(calls,13);
 assert.equal(normalize({...event,strStatus:'FT',intHomeScore:'0',intAwayScore:'2'}).score.home,0);assert.equal(normalize({...event,idEvent:'<script>'}),null);assert.equal(normalize({...event,dateEvent:'not a date'}),null);
 const reopened=new Matches(dir,()=>{throw Error('Should use cache');});assert.equal((await reopened.snapshot()).matches.length,1);console.log('PASS: primary 404 fallback, actual free-feed contract, null/zero scores, cache and restart persistence.');
})().catch(error=>{console.error(error);process.exitCode=1});
