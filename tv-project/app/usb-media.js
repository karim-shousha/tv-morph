/* Local file routing; video/audio use the same player as IPTV. */
(function(C){'use strict';
 var groups={video:'mp4 m4v mkv avi mov webm ts tp trp mts m2ts mpg mpeg mpe m2v vob vro wmv asf flv 3gp 3g2 divx ogv rm rmvb',audio:'mp3 aac m4a wav flac ogg oga opus wma aif aiff ac3 eac3 dts ape alac',image:'jpg jpeg png webp bmp gif heic heif avif tif tiff'};
 function kind(name){var ext=String(name||'').toLowerCase().split('.').pop(),keys=Object.keys(groups);for(var i=0;i<keys.length;i++)if((' '+groups[keys[i]]+' ').indexOf(' '+ext+' ')>=0)return keys[i];return '';}

 function open(box,uri,name,type,back,navigate){var media=window.SamsungMedia||window.MorphMedia,dead=false,observer=null,old=box.style.display;
 if(type==='image'){var image=document.createElement('img');image.src=uri;image.alt=name;image.style.cssText='max-width:95%;max-height:90%;object-fit:contain';box.appendChild(image);var close=document.createElement('button');close.className='usb-button';close.textContent=window.MorphLocale?MorphLocale.t('رجوع للملفات','Back to files'):'Back to files';close.onclick=back;box.appendChild(close);C.Focus.focus(close);return function(){image.removeAttribute('src');};}
 if(!media||!media.playLocal)throw Error('Shared media player unavailable');box.style.display='none';
 function restore(){if(dead)return;dead=true;if(observer)observer.disconnect();box.style.display=old;back();}
 Promise.resolve().then(function(){return media.playLocal(uri,name,type,navigate);}).then(function(){if(dead){media.parentalStop();return;}var player=document.getElementById('morph-player');if(!player){restore();return;}observer=new MutationObserver(function(){if(!document.getElementById('morph-player'))restore();});observer.observe(document.body,{childList:true});}).catch(function(error){box.style.display=old;if(C.toast)C.toast(error.message||String(error));restore();});
 return function(){if(dead)return;dead=true;if(observer)observer.disconnect();if(document.getElementById('morph-player')&&media.parentalStop)media.parentalStop();box.style.display=old;};
 }
 C.USBMedia={kind:kind,open:open};
})(window.ClearTV);
