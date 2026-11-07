/* Standalone TV receivers share the launcher trial and existing TV Plus service. */
(function(w,d){'use strict';
 var loaded=false,frontReady=false,timer=null;
 function nativeMode(){try{if(w.MorphDevice&&MorphDevice.useBrowserKeys)MorphDevice.useBrowserKeys(!frontReady||!!d.querySelector('.morph-plus-overlay'));}catch(ignore){}}
 function fitPlus(){var n=d.querySelector('.morph-plus-overlay');if(!n)return;var scale=Math.min(w.innerWidth/1920,w.innerHeight/1080);n.style.width='1920px';n.style.height='1080px';n.style.right='auto';n.style.bottom='auto';n.style.left=((w.innerWidth-1920*scale)/2)+'px';n.style.top=((w.innerHeight-1080*scale)/2)+'px';n.style.transformOrigin='0 0';n.style.transform='scale('+scale+')';var panel=n.querySelector('.morph-plus-dialog');if(panel){panel.style.width='1660px';panel.style.maxWidth='1660px';panel.style.maxHeight='972px';}}
 var openPlus=w.MorphPlus.open;w.MorphPlus.open=function(){openPlus();fitPlus();nativeMode();};
 w.MorphBridgeLicenseBack=function(){if(d.querySelector('.morph-plus-overlay')){var e=d.createEvent('Event');e.initEvent('keydown',true,true);e.keyCode=10009;d.dispatchEvent(e);setTimeout(nativeMode,0);}else if(w.MorphPlatform)MorphPlatform.exit();};
 d.addEventListener('click',function(){setTimeout(nativeMode,0);},true);w.addEventListener('resize',fitPlus);
 nativeMode();
 if(w.MorphDevice&&MorphDevice.bridgeTrialJson)w.TVNative=MorphDevice;
 var locked=d.createElement('section');locked.id='bridge-access-gate';locked.hidden=true;
 var title=d.createElement('h1');title.textContent='Morph Bridge · Plus';
 var copy=d.createElement('p'),action=d.createElement('button');action.type='button';
 locked.appendChild(title);locked.appendChild(copy);locked.appendChild(action);d.body.appendChild(locked);
 function words(){var ar=w.MorphLocale&&MorphLocale.get()==='ar';copy.textContent=ar?'انتهت التجربة المجانية لمدة 3 أيام. فعّل Plus على التلفزيون لمتابعة استخدام البريدج.':'Your 3-day free trial has ended. Activate Plus on this TV to keep using Bridge.';action.textContent=ar?'تفعيل Plus':'Activate Plus';}
 action.onclick=function(){if(w.MorphPlus)MorphPlus.open();};
 function load(){locked.hidden=true;d.documentElement.classList.remove('bridge-license-pending');if(loaded)return;loaded=true;var script=d.createElement('script');script.src='js/app.js';script.onload=function(){frontReady=true;nativeMode();};d.body.appendChild(script);schedule();}
 function block(){words();locked.hidden=false;d.documentElement.classList.add('bridge-license-pending');if(!d.querySelector('.morph-plus-overlay')){action.focus();if(w.MorphPlus)MorphPlus.open();}nativeMode();}
 function check(){clearTimeout(timer);var trial=MorphBridgeAccess.status(true),paid=w.MorphPlus&&MorphPlus.isActive();if(paid||!trial.expired){load();schedule();return;}if(loaded){w.location.reload();return;}block();}
 function schedule(){clearTimeout(timer);var trial=MorphBridgeAccess.status(false);if(!trial.expired)timer=setTimeout(check,Math.max(1,Math.min(2147483647,trial.remainingMs)));}
 w.addEventListener('morphPlus',function(){if(w.MorphPlus&&MorphPlus.isActive())load();else if(loaded&&MorphBridgeAccess.status(false).expired)check();});
 w.addEventListener('focus',check);d.addEventListener('visibilitychange',function(){if(!d.hidden)check();});
 w.addEventListener('pagehide',function(){clearTimeout(timer);});
 words();d.documentElement.classList.add('bridge-license-pending');
 MorphBridgeAccess.require(load);
 if(!loaded){locked.hidden=false;if(!d.querySelector('.morph-plus-overlay'))action.focus();}
})(window,document);
