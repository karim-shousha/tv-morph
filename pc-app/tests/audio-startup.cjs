const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {_electron}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/audio-startup');
fs.mkdirSync(out,{recursive:true});
const fixture=path.join(out,'two-audio-tracks.mp4');
if(!fs.existsSync(fixture))execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=black:size=320x180:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-f','lavfi','-i','sine=frequency=880:sample_rate=44100','-t','12','-map','0:v','-map','1:a','-map','2:a','-c:v','libx264','-preset','ultrafast','-c:a','aac','-metadata:s:a:0','language=eng','-metadata:s:a:0','handler_name=SoundHandler','-metadata:s:a:1','language=ara','-metadata:s:a:1','handler_name=SoundHandler','-movflags','+faststart','-y',fixture],{windowsHide:true});
const server=http.createServer((req,res)=>{
 const size=fs.statSync(fixture).size,match=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
 const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(size-1,Number(match[2])):size-1;
 res.writeHead(match?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(match?{'Content-Range':'bytes '+start+'-'+end+'/'+size}:{})});
 fs.createReadStream(fixture,{start,end}).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/two-audio-tracks.mp4';
 const app=await _electron.launch({args:process.env.MORPH_PC_TEST_EXECUTABLE?[]:[root],executablePath:process.env.MORPH_PC_TEST_EXECUTABLE||undefined,env:{...process.env,MORPH_PC_TEST_DATA:path.join(out,'user-'+Date.now()),ELECTRON_RUN_AS_NODE:undefined}});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.MorphDesktopMedia&&window.MorphPlayerChrome);
  await page.evaluate(url=>{
   localStorage.removeItem('morph.pc.audio-preference');
   const video=document.createElement('video');video.id='audio-fixture';video.volume=.41;document.body.append(video);
   video.addEventListener('loadedmetadata',()=>Array.from(video.audioTracks).forEach(track=>track.enabled=false),{once:true});
   const context=new AudioContext(),analyser=context.createAnalyser(),silent=context.createGain();silent.gain.value=0;
   context.createMediaElementSource(video).connect(analyser);analyser.connect(silent);silent.connect(context.destination);context.resume();
   window.audioFixture={video,context,analyser};window.fixtureFailure='';
   MorphDesktopMedia.attach(video,url,{kind:'episode',id:'fixture'},message=>fixtureFailure=message);
  },url);
  await page.waitForFunction(()=>{
   const {video,analyser}=audioFixture,samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);
   return video.audioTracks.length===2&&Array.from(video.audioTracks).filter(t=>t.enabled).length===1&&samples.some(n=>Math.abs(n)>.002);
  },null,{timeout:20000});
  const initial=await page.evaluate(()=>({muted:audioFixture.video.muted,volume:audioFixture.video.volume,labels:MorphDesktopMedia.trackRows(audioFixture.video,false).map(row=>row.label)}));
  assert.equal(initial.muted,false);assert.equal(initial.volume,.41);assert(initial.labels.some(label=>/Arabic/i.test(label)));assert(initial.labels.every(label=>!/SoundHandler/.test(label)));
  await page.evaluate(()=>MorphDesktopMedia.trackRows(audioFixture.video,false).find(row=>/Arabic/i.test(row.label)).action());
  assert.deepEqual(await page.evaluate(()=>Array.from(audioFixture.video.audioTracks).map(t=>t.enabled)),[false,true]);
  await page.waitForFunction(()=>{const data=new Float32Array(audioFixture.analyser.fftSize);audioFixture.analyser.getFloatTimeDomainData(data);return data.some(n=>Math.abs(n)>.002);});
  await page.evaluate(url=>{
   MorphDesktopMedia.detach(audioFixture.video);audioFixture.video.pause();audioFixture.video.remove();audioFixture.context.close();
   const video=document.createElement('video');video.id='audio-next';video.muted=true;video.volume=.23;document.body.append(video);window.nextAudioVideo=video;
   MorphDesktopMedia.attach(video,url,{kind:'episode',id:'next-episode'},()=>{});
  },url);
  await page.waitForFunction(()=>nextAudioVideo.audioTracks.length===2&&nextAudioVideo.audioTracks[1].enabled);
  assert.deepEqual(await page.evaluate(()=>({muted:nextAudioVideo.muted,volume:nextAudioVideo.volume,enabled:Array.from(nextAudioVideo.audioTracks).map(t=>t.enabled)})),{muted:true,volume:.23,enabled:[false,true]});
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,realDecodedAudioSamples:true,disabledDefaultRecovered:true,trackSwitch:true,languageRestoredForNextEpisode:true,userMuteAndVolumePreserved:true,labels:initial.labels},null,2));
  console.log('PASS actual Electron MP4/AAC: unselected SoundHandler tracks activate automatically, decoded audio samples are nonzero, Arabic switching and next-episode preference work, user mute/volume are preserved.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
