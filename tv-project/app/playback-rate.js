(function(C){'use strict';
 var values=[0.5,0.75,1,1.25,1.5,2,3];
 function words(){return {ar:['السرعة','هذه السرعة غير مدعومة من الجهاز أو البث.','انتظر تحميل الفيديو.'],en:['Speed','This speed is not supported by the device or stream.','Wait for the video to load.'],fr:['Vitesse','Cette vitesse n’est pas prise en charge par l’appareil ou le flux.','Attendez le chargement de la vidéo.'],zh:['速度','设备或视频流不支持此速度。','请等待视频加载。'],ja:['速度','機器または配信がこの速度に対応していません。','動画の読み込みをお待ちください。']}[window.MorphLocale?MorphLocale.get():'en']||['Speed','This speed is not supported.','Wait for the video to load.'];}
 function apply(video,rate){
  if(values.indexOf(rate)<0)throw Error('Invalid playback rate');
  var previous=video.playbackRate,paused=video.paused;
  try{if('preservesPitch' in video)video.preservesPitch=true;if('webkitPreservesPitch' in video)video.webkitPreservesPitch=true;if('mozPreservesPitch' in video)video.mozPreservesPitch=true;video.playbackRate=rate;if(!isFinite(video.playbackRate)||Math.abs(video.playbackRate-rate)>0.02)throw Error('Rate rejected');return video.playbackRate;}
  catch(error){try{video.playbackRate=previous;}catch(ignore){}throw error;}
  finally{if(paused&&!video.paused)video.pause();}
 }
 // AVPlay.setSpeed takes an integer trick-play multiplier, not an audio time-stretch rate.
 function nativeNotice(){return window.MorphLocale&&window.MorphLocale.get()==='ar'?'مشغل سامسونج الأصلي لا يدعم 1.25× و1.5×. تظل السرعة 1× للحفاظ على الصوت.':'Samsung native playback does not support 1.25x or 1.5x. Keeping 1x to preserve audio.';}
 C.PlaybackRate={values:values,words:words,apply:apply,nativeNotice:nativeNotice};
})(window.ClearTV);
