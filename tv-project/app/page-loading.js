/* Cover local page handoffs until the destination has painted its first frame. */
(function(w,d){'use strict';
 function watch(frame){if(frame._morphLoading)return;frame._morphLoading=true;
  var cover=d.createElement('section');cover.setAttribute('role','status');cover.className='morph-page-loading';
  cover.style.cssText='position:fixed;left:0;right:0;top:0;bottom:0;z-index:11999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#07101e;color:#f2f5fa;font:26px/1.6 Arial,sans-serif;';
  var image=d.createElement('img');image.src='assets/morph-header-symbol.webp';image.alt='M';image.style.cssText='width:130px;height:130px;object-fit:contain';cover.appendChild(image);
  var title=d.createElement('strong');title.textContent='orph Launcher';cover.appendChild(title);
  var text=d.createElement('p');text.textContent=d.documentElement.lang==='ar'?'جاري تجهيز الصفحة…':'Loading your page…';cover.appendChild(text);frame.style.visibility='hidden';
  var finished=false,timer,showTimer=w.setTimeout(function(){if(!finished)d.body.appendChild(cover);},300);function done(){if(finished)return;finished=true;clearTimeout(timer);clearTimeout(showTimer);if(d.documentElement.contains(frame)){frame.style.visibility='visible';try{frame.contentWindow.focus();}catch(ignore){}}if(cover.parentNode)cover.parentNode.removeChild(cover);}
  frame.addEventListener('load',function(){var ready=null;try{ready=frame.contentDocument.fonts&&frame.contentDocument.fonts.ready;}catch(ignore){}function painted(){w.requestAnimationFrame(function(){w.requestAnimationFrame(done);});}if(ready&&ready.then)ready.then(painted,painted);else painted();});
  timer=w.setTimeout(done,12000);frame._morphLoadingClose=done;
 }
 new MutationObserver(function(records){records.forEach(function(record){for(var i=0;i<record.addedNodes.length;i++){var node=record.addedNodes[i];if(node.tagName==='IFRAME'&&/^(morph-bridge-receiver|morph-network-screen|morph-media-frame)$/.test(node.id))watch(node);}for(var j=0;j<record.removedNodes.length;j++){var old=record.removedNodes[j];if(old._morphLoadingClose)old._morphLoadingClose();}});}).observe(d.body,{childList:true});
})(window,document);
