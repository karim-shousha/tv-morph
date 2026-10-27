(function(C){
 'use strict';
 var scope=document,lastKey=0,enteredInput=false,revealTarget=null,revealFrame=0,homeGeometry=null;
 function edit(input){if(!input)return;C.keyboardVisible=true;focus(input);try{if(window.TVNative&&TVNative.showKeyboard)TVNative.showKeyboard(input.id,input.value);}catch(ignore){}}
 function list(){var selector='button:not([disabled]):not([tabindex="-1"]),input:not([disabled]),select:not([disabled])',roots=[scope],choices=[];if(scope===document){var active=document.querySelector('main>.view:not([hidden])'),header=document.querySelector('main>header');if(active){roots=header?[header]:[];if(active.id==='view-home'&&document.body.classList.contains('dock-home')){Array.prototype.forEach.call(active.querySelectorAll('.home-tools,#home-usb-rail,#favourites,.recent-apps-section,.section-heading,#home-next-prayer,#home-download-pack'),function(root){roots.push(root);});}else roots.push(active);}}roots.forEach(function(root){if(root.nodeType===1&&root.matches(selector))choices.push(root);Array.prototype.forEach.call(root.querySelectorAll(selector),function(e){if(choices.indexOf(e)<0)choices.push(e);});});return choices.filter(function(e){return e.offsetWidth>0&&e.offsetHeight>0&&!e.closest('[hidden]');});}
 function rect(e){var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}
 function focus(e){
  if(!e)return;
  if(document.activeElement!==e){try{e.focus({preventScroll:true});}catch(error){e.focus();}}
  revealTarget=e;
  if(revealFrame)return;
  revealFrame=requestAnimationFrame(function(){
   revealFrame=0;var target=revealTarget;if(!target||!document.documentElement.contains(target)||document.activeElement!==target)return;
   var rail=target.closest('[data-scroll]');
   if(rail&&!rail.classList.contains('app-dock')){var a=target.getBoundingClientRect(),b=rail.getBoundingClientRect(),scale=window.MorphScreenFit?MorphScreenFit.scale():1;if(a.left<b.left+10)rail.scrollLeft-=(b.left+10-a.left)/scale;if(a.right>b.right-10)rail.scrollLeft+=(a.right-b.right+10)/scale;if(a.top<b.top+10)rail.scrollTop-=(b.top+10-a.top)/scale;if(a.bottom>b.bottom-10)rail.scrollTop+=(a.bottom-b.bottom+10)/scale;}
   var homeFeed=document.querySelector('#view-home .home-feed');if(homeFeed&&target.closest('header')&&homeFeed.scrollTop)homeFeed.scrollTop=0;
   var main=document.querySelector('main');if(main){if(main.scrollTop)main.scrollTop=0;if(main.scrollLeft)main.scrollLeft=0;}
   if(document.documentElement.scrollTop)document.documentElement.scrollTop=0;if(document.documentElement.scrollLeft)document.documentElement.scrollLeft=0;if(document.body.scrollTop)document.body.scrollTop=0;if(document.body.scrollLeft)document.body.scrollLeft=0;
  });
 }
 function invalidate(){homeGeometry=null;}
 window.addEventListener('resize',invalidate);window.addEventListener('morphLanguage',invalidate);document.addEventListener('scroll',invalidate,true);
 new MutationObserver(function(records){if(records.some(function(r){return r.type==='attributes'||Array.prototype.some.call(r.addedNodes,function(n){return n.nodeType===1;})||Array.prototype.some.call(r.removedNodes,function(n){return n.nodeType===1;});}))invalidate();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','disabled','tabindex']});
 new MutationObserver(invalidate).observe(document.body,{attributes:true,attributeFilter:['class','data-theme','style']});
 function move(code){
  var current=document.activeElement;
  if(C.DockArrow&&C.DockArrow(code,current))return;
  if(C.SettingsNav&&C.SettingsNav.arrow(code,current))return;
  var cached=scope===document&&document.body.classList.contains('light-mode')&&!document.getElementById('view-home').hidden;if(cached&&!homeGeometry){var nodes=list(),boxes=new WeakMap();nodes.forEach(function(node){boxes.set(node,rect(node));});homeGeometry={nodes:nodes,boxes:boxes};}var geometry=cached?homeGeometry:null;function position(node){return geometry&&geometry.boxes.get(node)||rect(node);}var choices=geometry?geometry.nodes:list();if((code===38||code===40)&&current&&current.closest('#view-home')&&!current.closest('.home-tools'))choices=choices.filter(function(e){return !e.closest('.home-tools');});
  if(C.catalogArrow&&C.catalogArrow(code,current)){return;}
  if(choices.indexOf(current)<0){focus(choices[0]);return;}
  var a=position(current),best=null,score=Infinity,horizontal=code===37||code===39;
  choices.forEach(function(e){if(e===current){return;}var b=position(e),dx=b.x-a.x,dy=b.y-a.y;if((code===37&&dx>=-2)||(code===39&&dx<=2)||(code===38&&dy>=-2)||(code===40&&dy<=2)){return;}
   var primary=horizontal?Math.abs(dx):Math.abs(dy),perp=horizontal?Math.abs(dy):Math.abs(dx);
   var overlap=horizontal?(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)):(Math.min(a.right,b.right)-Math.max(a.left,b.left));
   var cost=primary+perp*3+(overlap>0?0:700);
   if(cost<score){score=cost;best=e;}
  });focus(best);
 }
 document.addEventListener('visibilitychange',function(){if(!document.hidden){C.keyboardVisible=false;}});
 document.addEventListener('input',function(e){if(e.target&&e.target.type!=='range')C.keyboardVisible=true;});
 C.Focus={invalidate:invalidate,edit:edit,setScope:function(root){scope=root||document;invalidate();},focus:focus,first:function(){focus(list()[0]);},list:list};
 document.addEventListener('keydown',function(e){
  var code=e.keyCode;if(e.defaultPrevented)return;if(enteredInput&&e.repeat&&code>=37&&code<=40){e.preventDefault();return;}
  if(code===10009||code===27){e.preventDefault();C.back();return;}
  var active=document.activeElement;if(active&&active.tagName==='INPUT'&&active.type==='range'&&code>=37&&code<=40){e.preventDefault();if(code===38||code===40){C.keyboardVisible=false;move(code);}else{var step=Number(active.step)||1,min=Number(active.min)||0,max=Number(active.max)||100;active.value=Math.max(min,Math.min(max,Number(active.value)+(code===39?step:-step)));active.dispatchEvent(new Event('input',{bubbles:true}));}return;}
  var editing=active&&active.tagName==='INPUT';
  if(editing){if(code===13&&!C.keyboardVisible){e.preventDefault();edit(active);return;}if((code===38||code===40)&&!C.keyboardVisible){e.preventDefault();move(code);return;}if(code===65376||code===65385){e.preventDefault();C.keyboardVisible=false;focus(document.getElementById(document.activeElement.id==='app-search'?'search-installed':'city-search'));return;}if(code===13){e.preventDefault();if(document.activeElement.id==='app-search'){document.getElementById('search-installed').click();}else if(document.activeElement.id==='city-input'){document.getElementById('city-search').click();}}return;}
  if(code>=37&&code<=40){e.preventDefault();var now=Date.now();if(e.repeat&&now-lastKey<90){return;}lastKey=now;move(code);}
  if(code===13&&document.activeElement&&document.activeElement.tagName==='BUTTON'){e.preventDefault();document.activeElement.click();}
 });
 document.addEventListener('keyup',function(e){if(e.keyCode>=37&&e.keyCode<=40)enteredInput=false;});
 document.addEventListener('focusin',function(e){if(e.target&&e.target.tagName==='INPUT')enteredInput=true;if(e.target&&e.target.tagName==='BUTTON'){var label=e.target.getAttribute('aria-label');if(label){var hint=document.getElementById('focus-hint');if(hint.textContent!==label)hint.textContent=label;}}});
})(window.ClearTV);
