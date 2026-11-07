/* Same presentation as Android; only compensate for engine capabilities. */
(function(w,d){'use strict';
 d.documentElement.classList.add('morph-tizen5');
 if(!(w.CSS&&CSS.supports&&CSS.supports('accent-color','red')))d.documentElement.classList.add('morph-range-compat');
 try {
  if(localStorage.getItem('cleartv.tizen-light-default-v1')&&!localStorage.getItem('cleartv.tizen5-visual-parity-v1')){
   localStorage.setItem('cleartv.performanceMode','"balanced"');
   localStorage.setItem('cleartv.visualEffects','{"blur":false,"glow":true,"motion":true}');
   localStorage.removeItem('cleartv.tizen-light-default-v1');
   localStorage.setItem('cleartv.tizen5-visual-parity-v1','true');
  }
 }catch(ignore){}
 function ready(){
  var probe=d.createElement('button');probe.style.cssText='position:absolute;left:-1000px;visibility:hidden;display:grid;grid-template-columns:2px 2px;grid-gap:0;padding:0;border:0';
  for(var i=0;i<2;i++){var child=d.createElement('span');child.style.cssText='display:block;width:2px;height:2px';probe.appendChild(child);}
  d.body.appendChild(probe);var broken=Math.abs(probe.children[1].getBoundingClientRect().left-probe.children[0].getBoundingClientRect().left)<1;probe.parentNode.removeChild(probe);
  if(broken)d.documentElement.classList.add('morph-button-grid-compat');
 }
 function paintRanges(){var ranges=d.querySelectorAll('input[type=range]');for(var i=0;i<ranges.length;i++){var e=ranges[i],min=Number(e.min)||0,max=Number(e.max)||100,pct=Math.max(0,Math.min(100,100*(Number(e.value)-min)/(max-min||1)));e.style.setProperty('--tizen-range-percent',pct+'%');}}
 d.addEventListener('input',paintRanges,true);d.addEventListener('change',paintRanges,true);
 w.addEventListener('load',paintRanges);w.addEventListener('morphTheme',paintRanges);
 var timer=0;function schedule(){if(timer)return;timer=w.setTimeout(function(){timer=0;paintRanges();},60);}
 function watch(){new MutationObserver(schedule).observe(d.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','value']});paintRanges();}
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',function(){ready();watch();});else{ready();watch();}
})(window,document);
