/* Desktop transport for the existing FreeMatches contract. The UI is shared. */
const fs=require('node:fs'),path=require('node:path');
const TEAMS=[['138995','Al Ahly','الأهلي'],['138997','Zamalek','الزمالك'],['133738','Real Madrid','ريال مدريد'],['133739','Barcelona','برشلونة'],['133602','Liverpool','ليفربول'],['133604','Arsenal','أرسنال']];
function normalize(e){if(!e||!/^\d+$/.test(String(e.idEvent||'')))return null;let stamp=e.strTimestamp||(e.dateEvent?e.dateEvent+'T'+(e.strTime||'00:00:00'):'');if(stamp&&!/(?:Z|[+-]\d\d:\d\d)$/.test(stamp))stamp+='Z';const time=Date.parse(stamp);if(!Number.isFinite(time))return null;
 const status=String(e.strStatus||'').toUpperCase();function score(value){return value!==null&&value!==undefined&&value!==''&&/^\d+$/.test(String(value))&&Number(value)<=99?Number(value):null;}
 function badge(value){return /^https:\/\/(r2\.thesportsdb\.com|www\.thesportsdb\.com)\/images\/media\/team\/badge\//.test(value||'')&&value.length<350?value:'';}
 return {id:String(e.idEvent),kickoff:new Date(time).toISOString(),timeKnown:!!e.strTime,status:['FT','AET','PEN','MATCHFINISHED'].includes(status)?'finished':['PST','CANC','ABD','POSTPONED','CANCELLED'].includes(status)?'postponed':'scheduled',competition:String(e.strLeague||'').slice(0,100),home:{id:String(e.idHomeTeam||''),name:String(e.strHomeTeam||'').slice(0,90),badge:badge(e.strHomeTeamBadge)},away:{id:String(e.idAwayTeam||''),name:String(e.strAwayTeam||'').slice(0,90),badge:badge(e.strAwayTeamBadge)},score:{home:score(e.intHomeScore),away:score(e.intAwayScore)}};}
class Matches {
 constructor(directory,fetcher){this.file=path.join(directory,'matches-cache.json');this.fetcher=fetcher;this.cache={matches:[],updatedAt:0};this.busy=null;this.retryAt=0;try{const data=JSON.parse(fs.readFileSync(this.file,'utf8'));if(this.valid(data))this.cache=data;}catch{}}
 valid(data){return data&&Array.isArray(data.matches)&&data.matches.length<=32&&Number.isFinite(Number(data.updatedAt));}
 async json(url){const response=await this.fetcher(url,{signal:AbortSignal.timeout(6000),credentials:'omit',headers:{'User-Agent':'MorphLauncher-Matches/1.0'}});if(!response.ok)throw Error('Matches service HTTP '+response.status);const body=await response.text();if(body.length>1048576)throw Error('Matches response is too large');return JSON.parse(body);}
 async refresh(){
  try{try{const upstream=await this.json('https://morph-tv.com/api/matches');if(!this.valid(upstream))throw Error('Invalid matches response');this.save(upstream);return;}catch{}
   // If the website is unavailable, use the identical public feed already
   // used by distribution/community/matches_free.py, keeping its coverage limits.
   const jobs=TEAMS.flatMap(([id])=>['eventsnext.php','eventslast.php'].map(endpoint=>[id,endpoint]));let successes=0;const rows=new Map();
   async function worker(owner){while(jobs.length){const [id,endpoint]=jobs.shift();try{const data=await owner.json('https://www.thesportsdb.com/api/v1/json/123/'+endpoint+'?id='+id);if(!Object.hasOwn(data,'events')&&!Object.hasOwn(data,'results'))throw Error('Invalid feed');const events=data.events||data.results||[];if(!Array.isArray(events))throw Error('Invalid feed');successes++;for(const raw of events.slice(0,10)){const row=normalize(raw);if(row)rows.set(row.id,row);}}catch{}}}
   await Promise.all([worker(this),worker(this),worker(this)]);
   if(!successes){this.retryAt=Date.now()+300000;return;}
   if(successes<12)for(const row of this.cache.matches)if(!rows.has(row.id))rows.set(row.id,row);
   this.save({matches:[...rows.values()].filter(row=>Date.parse(row.kickoff)>=Date.now()-35*86400000).sort((a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff)).slice(0,32),updatedAt:Date.now()/1000,partial:successes<12,source:'TheSportsDB',limitedCoverage:true});
  }finally{this.busy=null;}
 }
 save(data){this.cache=data;fs.mkdirSync(path.dirname(this.file),{recursive:true});const temporary=this.file+'.tmp';fs.writeFileSync(temporary,JSON.stringify(data));fs.renameSync(temporary,this.file);}
 async snapshot(){if(Date.now()-this.cache.updatedAt*1000>=3600000&&!this.busy&&Date.now()>=this.retryAt)this.busy=this.refresh();if(this.busy)await Promise.race([this.busy,new Promise(resolve=>{const timer=setTimeout(resolve,6500);timer.unref?.();})]);const data={...this.cache};if(Date.now()-data.updatedAt*1000>7*86400000)data.matches=[];
 const badges={};for(const match of data.matches)for(const side of [match.home,match.away])if(side.badge)badges[side.id]=side.badge;
 return {...data,source:'TheSportsDB',limitedCoverage:true,stale:Date.now()-data.updatedAt*1000>=3600000,loading:!!this.busy,refreshAfter:3600,teams:TEAMS.map(([id,name,ar])=>({id,name,ar,badge:badges[id]||''})),news:[]};}
}
module.exports={Matches,normalize};
