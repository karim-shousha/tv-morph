/* Quiet, original navigation tick. One reusable audio context, no media downloads. */
(function(w){'use strict';
 var context=null,unlocked=false,last=null,lastAt=0,played=0;
 function nativeSound(){return w.TVNative&&typeof TVNative.navigationTick==='function';}
 // Prepare the audio graph after first paint, not in the first arrow handler.
 function prepare(){if(context||nativeSound())return;var Audio=w.AudioContext||w.webkitAudioContext;if(Audio)try{context=new Audio();}catch(ignore){}}
 w.addEventListener('load',function(){if(w.requestIdleCallback)w.requestIdleCallback(prepare,{timeout:2000});else setTimeout(prepare,1200);});
 function unlock(){
  if(nativeSound()){unlocked=true;return;}
  if(!context){var Audio=w.AudioContext||w.webkitAudioContext;if(!Audio)return;context=new Audio();}
  unlocked=true;if(context.state==='suspended')context.resume().catch(function(){});
 }
 function target(node){return node&&node.closest&&node.closest('#reference-cards button,#reference-card-controls button,#favourites button,.home-tools button,#morph-header nav button,#home-continue,#view-settings button,#view-settings [data-settings-focus]');}
 function tick(node){
  if(!node||node.disabled||!unlocked||document.hidden)return;
  var now=performance.now();if(last===node||now-lastAt<85)return;
  last=node;lastAt=now;
  if(nativeSound()){TVNative.navigationTick();played++;return;}
  if(!context||context.state!=='running')return;
  var time=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(760,time);osc.frequency.exponentialRampToValueAtTime(430,time+.055);
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.045,time+.005);gain.gain.exponentialRampToValueAtTime(.0001,time+.065);
  osc.connect(gain);gain.connect(context.destination);osc.start(time);osc.stop(time+.075);
  osc.onended=function(){osc.disconnect();gain.disconnect();};played++;
 }
 document.addEventListener('keydown',function(e){if(String(e.key||'').indexOf('Arrow')===0||[9,13,37,38,39,40].indexOf(e.keyCode)>=0){unlock();}},true);
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('focusin',function(e){tick(target(e.target));});
 document.addEventListener('pointerover',function(e){var node=target(e.target);if(node&&(!e.relatedTarget||!node.contains(e.relatedTarget)))tick(node);},{passive:true});
 document.addEventListener('visibilitychange',function(){last=null;});
 w.ReferenceNavigationSound={status:function(){return {state:context?context.state:'idle',played:played};}};
})(window);
