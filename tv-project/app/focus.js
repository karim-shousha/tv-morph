(function(C){
 'use strict';
 var scope=document,lastKey=0,enteredInput=false,revealTarget=null,revealFrame=0,homeHeaderFocus=null,homeHeroFocus=null;
 // Versioned spatial cache: rebuilt at most once per invalidation generation.
 // Invalidation is explicit and scoped (view/scope/overlay/settings changes);
 // class/style churn (focus rings, dock neighbours, theme variables) never invalidates.
 var cacheSeq=0,cacheScope=null,cacheView='',cacheModal=false,cacheNodes=null,cacheBoxes=null;
 var SELECTOR='button:not([disabled]):not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),#view-settings [data-settings-focus]';
 function edit(input){if(!input)return;C.keyboardVisible=true;focus(input);try{if(window.TVNative&&TVNative.showKeyboard)TVNative.showKeyboard(input.id,input.value);}catch(ignore){}}
 function activeViewId(){var v=document.querySelector('main>.view:not([hidden])');return v?v.id:'';}
 function modalOpen(){var o=document.getElementById('overlay');return !!o&&!o.hidden;}
 function collectRoots(){
  var roots=[],choices=[];
  if(scope===document){
   var active=document.querySelector('main>.view:not([hidden])'),header=document.querySelector('main>header');
   if(active){roots=header?[header]:[];if(active.id==='view-home'&&document.body.classList.contains('dock-home')){Array.prototype.forEach.call(active.querySelectorAll('#home-continue,.home-tools,#home-hdmi-shortcuts,#home-last-hdmi,#home-usb-rail,#favourites,.section-heading,#home-next-prayer,#home-matches,#home-download-pack,#reference-cards,#reference-card-controls'),function(root){roots.push(root);});}else roots.push(active);}
   var mini=document.getElementById('radio-mini');if(mini&&!mini.hidden&&active)roots.push(mini);
  }else roots=[scope];
  return roots;
 }
 // State-only candidate pass: no layout reads (no offsetWidth/getBoundingClientRect).
 // Zero-area elements are filtered after measurement using the same rects used for navigation.
 function stateVisible(e){
  if(e.disabled||e.tabIndex===-1||e.hidden)return false;
  if(e.closest&&e.closest('[hidden]'))return false;
  return true;
 }
 function list(){
  var roots=collectRoots(),choices=[];
  roots.forEach(function(root){
   if(!root||root.nodeType!==1)return;
   if(root.nodeType===1&&root.matches&&root.matches(SELECTOR)){if(stateVisible(root))choices.push(root);}
   Array.prototype.forEach.call(root.querySelectorAll(SELECTOR),function(e){if(choices.indexOf(e)<0&&stateVisible(e))choices.push(e);});
  });
  return choices;
 }
 function rect(e){var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height};}
 function drifted(){
  // Scrolling, resize, or zoom moves every rect. Probe only the focused
  // element: if it moved since measurement, the whole cache is stale.
  var cur=document.activeElement;
  if(!cur||cur===document.body)return true;
  var old=cacheBoxes&&cacheBoxes.get(cur);
  if(!old)return true;
  var now=rect(cur);
  return Math.abs(now.x-old.x)>=2||Math.abs(now.y-old.y)>=2;
 }
 function geometry(){
  var view=scope===document?activeViewId():'#',mo=modalOpen();
  if(cacheNodes&&cacheSeq===geometry.seq&&cacheScope===scope&&cacheView===view&&cacheModal===mo&&!drifted()){
   // Prune detached nodes without layout reads.
   var kept=cacheNodes,pruned=false;
   for(var i=kept.length-1;i>=0;i--){if(!document.documentElement.contains(kept[i])){kept.splice(i,1);pruned=true;}}
   if(!pruned)return {nodes:kept,boxes:cacheBoxes};
  }
  var nodes=list(),boxes=new WeakMap(),kept=[];
  for(var j=0;j<nodes.length;j++){
   var n=nodes[j];
   if(!document.documentElement.contains(n))continue;
   var b=rect(n);
   if(b.w<=0&&b.h<=0)continue;
   boxes.set(n,b);kept.push(n);
  }
  cacheNodes=kept;cacheBoxes=boxes;cacheScope=scope;cacheView=view;cacheModal=mo;geometry.seq=cacheSeq;
  return {nodes:kept,boxes:boxes};
 }
 geometry.seq=-1;
 function focus(e){
  if(!e)return;
  if(document.activeElement!==e){try{e.focus({preventScroll:true});}catch(error){e.focus();}}
  revealTarget=e;
  if(revealFrame)return;
  revealFrame=requestAnimationFrame(function(){
   revealFrame=0;var target=revealTarget;if(!target||!document.documentElement.contains(target)||document.activeElement!==target)return;
   var rail=target.closest('[data-scroll]');
   if(rail&&rail.id!=='reference-cards'&&!rail.classList.contains('app-dock')){var a=target.getBoundingClientRect(),b=rail.getBoundingClientRect(),scale=window.MorphScreenFit?window.MorphScreenFit.scale():1;if(a.left<b.left+10)rail.scrollLeft-=(b.left+10-a.left)/scale;if(a.right>b.right-10)rail.scrollLeft+=(a.right-b.right+10)/scale;if(a.top<b.top+10)rail.scrollTop-=(b.top+10-a.top)/scale;if(a.bottom>b.bottom-10)rail.scrollTop+=(a.bottom-b.bottom+10)/scale;}
   var homeFeed=document.querySelector('#view-home .home-feed');if(homeFeed&&target.closest('header')&&homeFeed.scrollTop)homeFeed.scrollTop=0;
   var main=document.querySelector('main');if(main){if(main.scrollTop)main.scrollTop=0;if(main.scrollLeft)main.scrollLeft=0;}
   if(document.documentElement.scrollTop)document.documentElement.scrollTop=0;if(document.documentElement.scrollLeft)document.documentElement.scrollLeft=0;if(document.body.scrollTop)document.body.scrollTop=0;if(document.body.scrollLeft)document.body.scrollLeft=0;
  });
 }
 function invalidate(){cacheSeq++;cacheNodes=null;cacheBoxes=null;geometry.seq=-1;}
 function handleMutations(records){
  for(var i=0;i<records.length;i++){
   var r=records[i];
   if(r.type==='attributes'){if(r.oldValue===r.target.getAttribute(r.attributeName))continue;invalidate();return;}
   var added=r.addedNodes,removed=r.removedNodes,j,n;
   for(j=0;j<added.length;j++){n=added[j];if(n.nodeType!==1)continue;if((n.matches&&n.matches(SELECTOR))||(n.querySelector&&n.querySelector(SELECTOR))){invalidate();return;}}
   for(j=0;j<removed.length;j++){n=removed[j];if(n.nodeType!==1)continue;if((n.matches&&n.matches(SELECTOR))||(n.querySelector&&n.querySelector(SELECTOR))){invalidate();return;}}
  }
 }
 // Scoped observer: subtree childList + only focusability attributes.
 // Class/data-theme/style mutations (focus rings, theme variables) intentionally ignored.
 new MutationObserver(handleMutations).observe(document.body,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['hidden','disabled','tabindex']});
 ['morphLanguage','morphViewer','morphTheme','morphUIMode','morphTextSize','morphAppOrder','morphPlus','morphPacks'].forEach(function(name){window.addEventListener(name,invalidate);});
 function move(code){
  var current=document.activeElement;
  if(scope===document&&!modalOpen()&&activeViewId()==='view-home'&&code===40&&current&&current.id==='viewer-button'){var sidebar=Array.prototype.filter.call(document.querySelectorAll('#view-home .home-tools button:not([disabled])'),function(node){return stateVisible(node)&&node.getBoundingClientRect().width>0;}).sort(function(a,b){return a.getBoundingClientRect().top-b.getBoundingClientRect().top;});if(sidebar.length){focus(sidebar[0]);return;}}
  // The mini player is a real row between the header and hero, not an overlay to skip.
  if(scope===document&&!modalOpen()&&activeViewId()==='view-home'){
   var mini=document.getElementById('radio-mini'),miniRows=mini&&!mini.hidden&&mini.getBoundingClientRect().width?Array.prototype.filter.call(mini.querySelectorAll('button'),function(n){return stateVisible(n)&&n.getBoundingClientRect().width>0;}):[];
   function nearestRow(rows){var origin=rect(current),target=null,distance=Infinity;rows.forEach(function(n){var gap=Math.abs(rect(n).x-origin.x);if(gap<distance){distance=gap;target=n;}});return target;}
   if(miniRows.length&&current){var inMini=mini.contains(current),inHeader=!!current.closest('main>header'),inHero=['home-continue','home-next-prayer','home-matches'].indexOf(current.id)>=0;
    if(code===40&&inHeader||code===38&&inHero){homeHeaderFocus=null;focus(nearestRow(miniRows));return;}
    if(inMini){var destinations=code===38?Array.prototype.filter.call(document.querySelectorAll('main>header button'),function(n){return stateVisible(n)&&rect(n).w>0;}):code===40?['home-continue','home-next-prayer','home-matches'].map(function(id){return document.getElementById(id);}).filter(function(n){return n&&stateVisible(n)&&rect(n).w>0;}):null;if(destinations){focus(nearestRow(destinations));return;}var ordered=miniRows.slice().sort(function(a,b){return rect(a).x-rect(b).x;}),index=ordered.indexOf(current),next=index+(code===37?-1:1);if(code===37||code===39){focus(ordered[next]);return;}}
   }
  }
  // Descend into the hero row before considering the much lower app dock.
  if(scope===document&&!modalOpen()&&activeViewId()==='view-home'&&current&&((code===40&&current.closest('main>header'))||(code===38&&['home-continue','home-next-prayer','home-matches'].indexOf(current.id)>=0))){
   var hero=['home-continue','home-next-prayer','home-matches'].map(function(id){return document.getElementById(id);}).filter(function(e){return e&&stateVisible(e)&&e.getBoundingClientRect().width>0;});
   if(code===40&&current.closest('main>header')&&hero.length){var cards=hero.filter(function(e){return e.id!=='home-continue';});if(cards.length&&['nav-home','nav-apps','nav-settings'].indexOf(current.id)<0)hero=cards;var origin=rect(current),target=null,distance=Infinity;hero.forEach(function(e){var b=rect(e),gap=Math.max(b.left-origin.right,origin.left-b.right,0),score=gap*3+Math.abs(b.x-origin.x);if(score<distance){distance=score;target=e;}});homeHeaderFocus=current;homeHeroFocus=target;focus(target);return;}
   if(code===38&&hero.indexOf(current)>=0){if(homeHeroFocus===current&&homeHeaderFocus&&stateVisible(homeHeaderFocus)){focus(homeHeaderFocus);return;}var origin=rect(current),target=null,distance=Infinity;Array.prototype.forEach.call(document.querySelectorAll('main>header button:not([disabled])'),function(e){if(!stateVisible(e))return;var b=rect(e);if(!b.w)return;var score=Math.abs(b.x-origin.x);if(score<distance){distance=score;target=e;}});if(target){focus(target);return;}}
  }
  // Horizontal rows stay in their own row, even while focus scaling animates.
  var referenceRow=scope===document&&!modalOpen()&&activeViewId()==='view-home'&&document.getElementById('reference-cards');
  if(referenceRow&&current&&(code===37||code===39)){
   // This fixed LTR grid already stores buttons in visual order; measuring and sorting
   // every animated card on each key forces synchronous style/layout work.
   var productButtons=Array.prototype.filter.call(referenceRow.children,function(n){return n.tagName==='BUTTON'&&stateVisible(n);});
   if(current.id==='reference-card-previous'&&code===39){focus(productButtons[0]);return;}if(current.id==='reference-card-next'&&code===37){focus(productButtons[productButtons.length-1]);return;}
   if(productButtons.length&&current.closest('#view-home .home-tools')&&code===39){focus(productButtons[0]);return;}
   if(current.parentNode===referenceRow){var at=productButtons.indexOf(current),next=at+(code===39?1:-1);if(productButtons[next])focus(productButtons[next]);else if(code===39){focus(document.getElementById('reference-card-next'));}else if(code===37&&document.getElementById('reference-card-previous')){focus(document.getElementById('reference-card-previous'));}else if(code===37){var side=Array.prototype.filter.call(document.querySelectorAll('#view-home .home-tools>button'),function(n){return stateVisible(n)&&rect(n).w>0;}),origin=rect(current),nearest=null,distance=Infinity;side.forEach(function(n){var gap=Math.abs(rect(n).y-origin.y);if(gap<distance){distance=gap;nearest=n;}});focus(nearest);}return;}
  }
  if(C.DockArrow&&C.DockArrow(code,current))return;
  if(C.SettingsNav&&C.SettingsNav.arrow(code,current))return;
  var g=geometry(),choices=g.nodes;
  function position(node){return g.boxes.get(node)||rect(node);}
  if((code===38||code===40)&&current&&current.closest&&current.closest('#view-home')&&!current.closest('.home-tools'))choices=choices.filter(function(e){return !e.closest('.home-tools');});
  if(C.catalogArrow&&C.catalogArrow(code,current)){return;}
  if(choices.indexOf(current)<0){focus(choices[0]);return;}
  var a=position(current),best=null,score=Infinity,horizontal=code===37||code===39;
  for(var i=0;i<choices.length;i++){
   var e=choices[i];if(e===current)continue;
   var b=position(e),dx=b.x-a.x,dy=b.y-a.y;
   if((code===37&&dx>=-2)||(code===39&&dx<=2)||(code===38&&dy>=-2)||(code===40&&dy<=2))continue;
   var primary=horizontal?Math.abs(dx):Math.abs(dy),perp=horizontal?Math.abs(dy):Math.abs(dx);
   var overlap=horizontal?(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)):(Math.min(a.right,b.right)-Math.max(a.left,b.left));
   var cost=primary+perp*3+(overlap>0?0:700);
   if(cost<score){score=cost;best=e;}
  }
  focus(best);
 }
 document.addEventListener('visibilitychange',function(){if(!document.hidden){C.keyboardVisible=false;}});
 document.addEventListener('input',function(e){if(e.target&&e.target.type!=='range')C.keyboardVisible=true;});
 C.Focus={invalidate:invalidate,edit:edit,setScope:function(root){scope=root||document;invalidate();},focus:focus,first:function(){focus(list()[0]);},list:list};
 document.addEventListener('keydown',function(e){
  var code=e.keyCode;if(e.defaultPrevented)return;if(enteredInput&&e.repeat&&code>=37&&code<=40){e.preventDefault();return;}
  if(code===10009||code===27){e.preventDefault();if(!e.repeat)C.back();return;}
  var active=document.activeElement;if(active&&active.tagName==='INPUT'&&active.type==='range'&&code>=37&&code<=40){e.preventDefault();if(code===38||code===40){C.keyboardVisible=false;move(code);}else{var step=Number(active.step)||1,min=Number(active.min)||0,max=Number(active.max)||100;active.value=Math.max(min,Math.min(max,Number(active.value)+(code===39?step:-step)));active.dispatchEvent(new Event('input',{bubbles:true}));}return;}
  var editing=active&&active.tagName==='INPUT';
  if(editing){var search=active.type==='search'||['app-search','city-input','prayer-city'].indexOf(active.id)>=0,horizontal=code===37||code===39,plain=!e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.isComposing,boundary=active.selectionStart===active.selectionEnd&&(code===37?active.selectionStart===0:active.selectionEnd===active.value.length),desktop=document.body.hasAttribute('data-desktop');if(search&&horizontal&&plain&&(!C.keyboardVisible||desktop&&boundary)){e.preventDefault();C.keyboardVisible=false;move(code);return;}if(code===13&&!C.keyboardVisible){e.preventDefault();edit(active);return;}if((code===38||code===40)&&!C.keyboardVisible){e.preventDefault();move(code);return;}if(code===65376||code===65385){e.preventDefault();C.keyboardVisible=false;if(document.activeElement.id.indexOf('prayer-local-')===0)return;focus(document.getElementById(document.activeElement.id==='app-search'?'search-installed':document.activeElement.id==='prayer-city'?'prayer-search':'city-search'));return;}if(code===13){e.preventDefault();if(document.activeElement.id==='app-search'){document.getElementById('search-installed').click();}else if(document.activeElement.id==='city-input'){document.getElementById('city-search').click();}}return;}
  if(code>=37&&code<=40){e.preventDefault();var now=Date.now();if(e.repeat&&now-lastKey<45){return;}lastKey=now;move(code);}
  if(code===13&&document.activeElement&&document.activeElement.tagName==='BUTTON'){e.preventDefault();document.activeElement.click();}
 });
 document.addEventListener('keyup',function(e){if(e.keyCode>=37&&e.keyCode<=40)enteredInput=false;});
 document.addEventListener('focusout',function(e){var n=e.target;if(n&&n.tagName==='INPUT'&&(n.type==='search'||['app-search','city-input','prayer-city'].indexOf(n.id)>=0))C.keyboardVisible=false;});
 document.addEventListener('focusin',function(e){if(e.target&&e.target.tagName==='INPUT')enteredInput=true;if(e.target&&e.target.tagName==='BUTTON'){var label=e.target.getAttribute('aria-label');if(label){var hint=document.getElementById('focus-hint');if(hint.textContent!==label)hint.textContent=label;}}});
})(window.ClearTV);
