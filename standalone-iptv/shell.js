/* Product shell only. No catalog/player implementation is duplicated here. */
(function(w){'use strict';
 var C=w.ClearTV,opened=false;
 function backend(){return w.MorphMedia||w.SamsungMedia;}
 function start(){if(document.hidden||opened)return;var media=backend();if(!media)return;opened=true;media.open('iptv');}
 C.showView=function(){opened=false;start();};
 var originalRemote=C.Remote.key;C.Remote.key=function(key){if(w.MorphStandalonePrayerRemote&&w.MorphStandalonePrayerRemote(key))return {sent:true};return originalRemote.apply(C.Remote,arguments);};
 w.addEventListener('keydown',function(e){var key={13:'ENTER',27:'RETURN',10009:'RETURN',461:'RETURN',37:'LEFT',38:'UP',39:'RIGHT',40:'DOWN'}[e.keyCode];if(key&&w.MorphStandalonePrayerRemote&&w.MorphStandalonePrayerRemote(key)){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.body.setAttribute('data-fixed-layout','true');
 if(w.MorphScreenFit)w.MorphScreenFit.refresh();
 w.addEventListener('load',function(){var media=backend(),original=media.exit;media.exit=function(force){original(force);opened=false;if(force!==true){if(w.MorphLG)MorphLG.exit();else if(w.tizen)tizen.application.getCurrentApplication().exit();else document.body.setAttribute('data-exit-requested','true');}};start();});
 document.addEventListener('visibilitychange',function(){if(document.hidden)opened=false;else start();});
})(window);
