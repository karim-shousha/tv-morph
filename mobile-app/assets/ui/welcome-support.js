/* Phone startup support: one dismissible invitation every three hours. */
(function(w,d){'use strict';
 var key='morph.support.last-shown',interval=3*60*60*1000;
 function start(){
  var now=Date.now(),last;try{last=Number(localStorage.getItem(key));if(last>0&&now-last<interval)return;}catch(e){return;}
  var source=d.querySelector('.morph-support');if(!source)return;
  var overlay=d.createElement('div');overlay.id='phone-support-invitation';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.style.cssText='position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(10,22,40,.48)';
  var card=d.createElement('section');card.dir=d.documentElement.lang==='ar'?'rtl':'ltr';card.style.cssText='position:relative;box-sizing:border-box;width:100%;max-width:440px;max-height:85vh;overflow:auto;padding:48px 22px 22px;border-radius:24px;background:var(--surface,#fff);color:var(--text,#173247)';
  var close=d.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',d.documentElement.lang==='ar'?'إغلاق':'Close');close.style.cssText='position:absolute;top:8px;right:10px;width:38px;height:38px;font-size:28px;border:0;border-radius:50%;background:transparent;color:inherit';
  var previous=d.activeElement;
  function dismiss(){overlay.remove();d.removeEventListener('keydown',escape,true);if(previous&&previous.focus)previous.focus();}
  function escape(e){if(e.key==='Escape'||e.keyCode===27){e.preventDefault();e.stopImmediatePropagation();dismiss();}}
  close.onclick=dismiss;card.appendChild(close);
  var content=source.cloneNode(true);content.classList.remove('home-support');content.style.cssText='margin:0;padding:0;border:0;box-shadow:none;background:transparent';
  var originals=source.querySelectorAll('a,button');Array.prototype.forEach.call(content.querySelectorAll('a,button'),function(a,i){a.onclick=function(e){if(a.classList.contains('support-plus'))dismiss();if(originals[i].onclick)return originals[i].onclick.call(a,e);};a.style.display='block';a.style.marginTop='10px';});
  card.appendChild(content);overlay.appendChild(card);overlay.onclick=function(e){if(e.target===overlay)dismiss();};
  try{localStorage.setItem(key,String(now));}catch(e){return;}
  d.body.appendChild(overlay);d.addEventListener('keydown',escape,true);close.focus();
 }
 w.addEventListener('load',function(){setTimeout(start,1500);});
})(window,document);
