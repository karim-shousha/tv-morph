/* One logical canvas; fit the visible viewport, never the panel pixel density. */
(function(w){'use strict';
 var scheduled=false,last=null,stable=null;
 function positive(n){return typeof n==='number'&&isFinite(n)&&n>0;}
 function editing(){var doc=document,e;for(var depth=0;doc&&depth<8;depth++){e=doc.activeElement;if(e&&(e.tagName==='INPUT'||e.tagName==='TEXTAREA'||e.isContentEditable))return true;try{if(doc.defaultView&&doc.defaultView.ClearTV&&doc.defaultView.ClearTV.keyboardVisible)return true;doc=e&&e.tagName==='IFRAME'?e.contentDocument:null;}catch(ignore){doc=null;}}return false;}
 function fit(){scheduled=false;var body=document.body;if(!body||body.getAttribute('data-fixed-layout')!=='true')return;var root=document.documentElement,v=w.visualViewport,width=root.clientWidth||w.innerWidth,height=root.clientHeight||w.innerHeight,left=0,top=0;
  if(v&&positive(v.width)&&positive(v.height)){width=v.width;height=v.height;left=Number(v.offsetLeft)||0;top=Number(v.offsetTop)||0;}
  if(!positive(width)||!positive(height))return;
  // The device IME can resize both axes. IPTV inputs live inside an iframe,
  // so checking only the host's activeElement misses the editing session.
  var keyboard=stable&&editing()&&width<=stable.width*1.05&&height<stable.height*.9;
  if(keyboard){width=stable.width;height=stable.height;left=stable.left;top=stable.top;}else stable={width:width,height:height,left:left,top:top};
  // Desktop layouts use real CSS pixels. TV keeps the original normalized canvas.
  if(body.hasAttribute('data-desktop')){
   height=Math.max(1,height-64);top+=64;
   root.removeAttribute('data-tv-canvas');body.style.width=width+'px';body.style.height=height+'px';body.style.position='absolute';body.style.zoom='1';body.style.transform='none';body.style.webkitTransform='none';body.style.left=left+'px';body.style.top=top+'px';
   last={signature:[width,height,left,top,'desktop'].join(':'),width:width,height:height,scale:1,left:left,top:top,browserScale:v&&v.scale||1};
   if(w.ClearTV&&ClearTV.Focus&&ClearTV.Focus.invalidate)ClearTV.Focus.invalidate();return;
  }
  var scale=Math.min(width/1920,height/1080);if(!positive(scale))return;
  var x=left+Math.max(0,(width-1920*scale)/2),y=top+Math.max(0,(height-1080*scale)/2),signature=[width,height,x,y,scale].join(':');
  if(last&&last.signature===signature)return;
  root.setAttribute('data-tv-canvas','true');body.style.width='1920px';body.style.height='1080px';body.style.position='absolute';body.style.zoom='1';body.style.transformOrigin='0 0';body.style.webkitTransformOrigin='0 0';body.style.transform='scale('+scale+')';body.style.webkitTransform='scale('+scale+')';body.style.left=x+'px';body.style.top=y+'px';
  last={signature:signature,width:width,height:height,scale:scale,left:x,top:y,browserScale:v&&v.scale||1};
  if(w.ClearTV&&ClearTV.Focus&&ClearTV.Focus.invalidate)ClearTV.Focus.invalidate();
 }
 function queue(){if(scheduled)return;scheduled=true;(w.requestAnimationFrame||function(fn){return setTimeout(fn,16);})(fit);}
 w.MorphScreenFit={refresh:queue,scale:function(){return last?last.scale:1;},metrics:function(){return last;}};
 fit();['resize','load','pageshow','orientationchange'].forEach(function(name){w.addEventListener(name,queue);});if(w.visualViewport){w.visualViewport.addEventListener('resize',queue);w.visualViewport.addEventListener('scroll',queue);}document.addEventListener('visibilitychange',function(){if(!document.hidden)queue();});
})(window);
