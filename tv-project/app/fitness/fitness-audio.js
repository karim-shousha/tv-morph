(function (w) {
'use strict';
var C = w.ClearTV = w.ClearTV || {};
/* Audio: WebAudio beeps (no assets needed) + speech voice guidance + music-pack metadata. */
var ctx = null;
function ac() { try { if (!ctx) ctx = new (w.AudioContext || w.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch (e) { return null; } }
function tone(freq, ms, vol, when) {
  try {
    var c = ac(); if (!c) return; var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol || 0.25), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + ms / 1000 + 0.05);
  } catch (e) {}
}
var Audio = {
  enabled: function () { try { return C.FitnessStore.settings().beeps !== false; } catch (e) { return true; } },
  count: function (n) { if (!Audio.enabled()) return; tone(n <= 0 ? 880 : 520, n <= 0 ? 450 : 160, 0.3); },
  go: function () { if (!Audio.enabled()) return; tone(880, 450, 0.32); setTimeout(function () { tone(1174, 350, 0.28); }, 120); },
  rest: function () { if (!Audio.enabled()) return; tone(392, 300, 0.28); },
  done: function () { if (!Audio.enabled()) return; [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 260, 0.3, i * 0.16); }); },
  click: function () { if (!Audio.enabled()) return; tone(660, 60, 0.12); }
};
function speak(text, lang) {
  try {
    var s = C.FitnessStore.settings(); if (s && s.voice === false) return false;
    if (!('speechSynthesis' in w)) return false;
    w.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = lang || 'en-US'; u.rate = 1; u.volume = 0.9;
    w.speechSynthesis.speak(u); return true;
  } catch (e) { return false; }
}
/* The three original HER sports tracks are streamed from Morph TV on demand. */
var PACKS=[
 {id:'motivation',title:{ar:'طاقة الصباح',en:'Morning Energy',fr:'Énergie du matin',zh:'晨间活力',ja:'朝のエネルギー'},status:'streaming',url:'https://morph-tv.com/fitness-music/v1/Sport1.mp3'},
 {id:'energy',title:{ar:'إيقاع الحركة',en:'Rhythm of Movement',fr:'Rythme du mouvement',zh:'运动节奏',ja:'動きのリズム'},status:'streaming',url:'https://morph-tv.com/fitness-music/v1/Sport2.mp3'},
 {id:'focus',title:{ar:'دفعة قوية',en:'Power Boost',fr:'Coup de boost',zh:'强劲动力',ja:'パワーブースト'},status:'streaming',url:'https://morph-tv.com/fitness-music/v1/Sport3.mp3'},
 {id:'none',title:{ar:'بدون موسيقى',en:'No Music',fr:'Sans musique',zh:'无音乐',ja:'音楽なし'},status:'off'}
];
var words={
 ar:{listen:'استماع',stopPreview:'إيقاف المعاينة',musicOnline:'الموسيقى تحتاج اتصال إنترنت، وتتحمّل عند التشغيل.',musicIdle:'اختار مقطعًا للاستماع أو للتمرين.',musicLoading:'جاري تجهيز الموسيقى…',musicPlaying:'الموسيقى تعمل',musicPaused:'الموسيقى متوقفة مؤقتًا',musicFailed:'تعذّر تشغيل الموسيقى. راجع الإنترنت وجرّب الاستماع مرة أخرى.',on:'تشغيل',off:'إيقاف'},
 en:{listen:'Listen',stopPreview:'Stop preview',musicOnline:'Music needs an internet connection and loads when played.',musicIdle:'Choose a track to preview or use during your workout.',musicLoading:'Loading music…',musicPlaying:'Music is playing',musicPaused:'Music is paused',musicFailed:'Music could not play. Check your connection and try Listen again.',on:'On',off:'Off'},
 fr:{listen:'Écouter',stopPreview:'Arrêter l’écoute',musicOnline:'La musique nécessite Internet et se charge à la lecture.',musicIdle:'Choisissez un morceau à écouter ou à utiliser pendant la séance.',musicLoading:'Chargement de la musique…',musicPlaying:'Lecture en cours',musicPaused:'Musique en pause',musicFailed:'Lecture impossible. Vérifiez la connexion puis réessayez.',on:'Activé',off:'Désactivé'},
 zh:{listen:'试听',stopPreview:'停止试听',musicOnline:'音乐播放时加载，需要网络连接。',musicIdle:'选择音乐进行试听或用于锻炼。',musicLoading:'正在加载音乐…',musicPlaying:'音乐正在播放',musicPaused:'音乐已暂停',musicFailed:'音乐无法播放，请检查网络后重试。',on:'开启',off:'关闭'},
 ja:{listen:'試聴',stopPreview:'試聴を停止',musicOnline:'音楽は再生時に読み込まれ、インターネット接続が必要です。',musicIdle:'試聴またはトレーニング用の曲を選んでください。',musicLoading:'音楽を読み込み中…',musicPlaying:'音楽を再生中',musicPaused:'音楽は一時停止中',musicFailed:'再生できません。接続を確認して再試行してください。',on:'オン',off:'オフ'}
};
Object.keys(words).forEach(function(lang){Object.assign(C.FitnessI18n.all[lang],words[lang]);});
var audio=null,track='',mode='',state='idle',epoch=0;
function selected(id){return PACKS.filter(function(p){return p.id===id;})[0]||PACKS[0];}
function notify(next){state=next;if(w.dispatchEvent&&w.CustomEvent)w.dispatchEvent(new CustomEvent('morphFitnessMusic'));}
function ensure(){if(audio)return audio;audio=document.createElement('audio');audio.id='fitness-background-music';audio.preload='none';audio.loop=true;audio.style.display='none';document.body.appendChild(audio);
 audio.addEventListener('playing',function(){if(mode)notify('playing');});
 audio.addEventListener('pause',function(){if(mode&&(audio.error||state==='error')){notify('error');return;}notify(mode?'paused':'idle');});
 audio.addEventListener('error',function(){if(mode)notify('error');});
 return audio;
}
function stop(){epoch++;mode='';track='';if(audio){audio.pause();audio.removeAttribute('src');audio.load();}notify('idle');}
function pause(){epoch++;if(audio)audio.pause();if(mode)notify('paused');}
function start(kind,id){var settings=C.FitnessStore.settings(),p=selected(id||settings.musicPack);
 if(p.status==='off'||kind!=='preview'&&settings.musicEnabled===false){stop();return Promise.resolve(false);}
 var a=ensure(),token=++epoch;mode=kind||'workout';a.volume=Math.max(0,Math.min(100,Number(settings.musicVolume)||0))/100;
 if(track!==p.id||a.error||state==='error'){a.pause();a.src=p.url;track=p.id;a.load();}
 notify('loading');var promise;
 try{promise=a.play();}catch(e){notify('error');return Promise.resolve(false);}
 return Promise.resolve(promise).then(function(){return token===epoch&&!a.paused;},function(e){if(token===epoch&&e.name!=='AbortError')notify('error');return false;});
}
function sync(running){var settings=C.FitnessStore.settings();if(settings.musicEnabled===false||selected(settings.musicPack).status==='off'){stop();return;}
 if(audio)audio.volume=Math.max(0,Math.min(100,Number(settings.musicVolume)||0))/100;
 if(running)return start('workout');if(mode==='workout'&&track!==selected(settings.musicPack).id)pause();
}
var music={
 start:start,pause:pause,stop:stop,sync:sync,
 select:function(id){var settings=C.FitnessStore.settings();settings.musicPack=selected(id).id;C.FitnessStore.saveSettings(settings);stop();},
 preview:function(id){if(mode==='preview'&&track===id&&audio&&!audio.paused){stop();return Promise.resolve(false);}return start('preview',id);},
 stopPreview:function(){if(mode==='preview')stop();},
 snapshot:function(){return {track:track,mode:mode,state:state,paused:!audio||audio.paused,volume:audio?audio.volume:0,time:audio?audio.currentTime:0,duration:audio&&isFinite(audio.duration)?audio.duration:0};},
 statusText:function(){return C.FitnessI18n.t({idle:'musicIdle',loading:'musicLoading',playing:'musicPlaying',paused:'musicPaused',error:'musicFailed'}[state]||'musicIdle');}
};
C.FitnessAudio={beep:Audio,speak:speak,PACKS:PACKS,music:music,
 packTitle:function(id,lang){var p=selected(id);return p.title[lang]||p.title.en;}
};
if(w.addEventListener){w.addEventListener('morphAudioExclusive',pause);w.addEventListener('unload',stop);}
})(window);
