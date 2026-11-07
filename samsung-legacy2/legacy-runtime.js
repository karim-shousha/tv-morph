/* Morph TV Lite 2 boot runtime. Hand-written ES5 only. Tizen 2.3 / 2.4 WebKit. Loaded after legacy-es5-header.js and legacy-polyfills.js, before every shared application script. */
(function(w,d){'use strict';
 w.MorphTVLowMemory=true;
  var boot=w.MorphLegacyBoot||{missing:[],errors:[]};
  if(typeof w.MutationObserver!=='function'&&boot.installMutationObserver)boot.installMutationObserver();
  function assign(t){t=Object(t);for(var i=1;i<arguments.length;i++){var s=arguments[i];if(s!=null){for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k];}}}return t;}
  var nativeAssign=Object.assign||assign;
 if(!w.CSS)w.CSS={};if(!w.CSS.supports)w.CSS.supports=function(){return false;};
 if(!Element.prototype.matches)Element.prototype.matches=Element.prototype.webkitMatchesSelector||function(selector){var nodes=(this.ownerDocument||d).querySelectorAll(selector);for(var i=0;i<nodes.length;i++)if(nodes[i]===this)return true;return false;};
 if(!Element.prototype.closest)Element.prototype.closest=function(selector){var node=this;while(node&&node.nodeType===1){if(node.matches(selector))return node;node=node.parentElement;}return null;};
 if(!Element.prototype.remove)Element.prototype.remove=function(){if(this.parentNode)this.parentNode.removeChild(this);};
 function fragment(args){var f=d.createDocumentFragment();for(var i=0;i<args.length;i++)f.appendChild(args[i] instanceof Node?args[i]:d.createTextNode(String(args[i])));return f;}
 if(!Element.prototype.append)Element.prototype.append=function(){this.appendChild(fragment(arguments));};
 if(!Element.prototype.prepend)Element.prototype.prepend=function(){this.insertBefore(fragment(arguments),this.firstChild);};
 if(!Element.prototype.before)Element.prototype.before=function(){if(this.parentNode)this.parentNode.insertBefore(fragment(arguments),this);};
 if(!Element.prototype.after)Element.prototype.after=function(){if(this.parentNode)this.parentNode.insertBefore(fragment(arguments),this.nextSibling);};
 if(w.NodeList&&!NodeList.prototype.forEach)NodeList.prototype.forEach=Array.prototype.forEach;
 if(typeof w.Event!=='function'){var NativeEvent=w.Event;w.Event=function(type,options){var event=d.createEvent('Event');options=options||{};event.initEvent(type,!!options.bubbles,!!options.cancelable);return event;};if(NativeEvent)w.Event.prototype=NativeEvent.prototype;}
 if(typeof w.CustomEvent!=='function'){w.CustomEvent=function(type,options){var event=d.createEvent('CustomEvent');options=options||{};event.initCustomEvent(type,!!options.bubbles,!!options.cancelable,options.detail);return event;};}
 if(!w.requestAnimationFrame)w.requestAnimationFrame=w.webkitRequestAnimationFrame||function(fn){return setTimeout(function(){fn(Date.now());},16);};if(!w.cancelAnimationFrame)w.cancelAnimationFrame=w.webkitCancelAnimationFrame||clearTimeout;

 // Old TV WebKit may omit width/height from ClientRect. Spatial focus requires finite centers.
 var nativeRect=Element.prototype.getBoundingClientRect;
 Element.prototype.getBoundingClientRect=function(){var r=nativeRect.call(this);if(typeof r.width==='number'&&typeof r.height==='number')return r;return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.right-r.left,height:r.bottom-r.top,x:r.left,y:r.top};};
  w.MorphLegacy={version:'0.8.216-tizen2',target:'Tizen 2.3 / 2.4 WebKit',light:true,errors:('__morphBootErrors' in w&&w.__morphBootErrors)||[]};
  if(w.MorphLegacy.errors.length>12)w.MorphLegacy.errors=w.MorphLegacy.errors.slice(0,12);
 if(!('isConnected' in Node.prototype))Object.defineProperty(Node.prototype,'isConnected',{get:function(){return !!this.ownerDocument&&this.ownerDocument.documentElement.contains(this);}});
 if(!Element.prototype.replaceWith)Element.prototype.replaceWith=function(){if(!this.parentNode)return;var frag=d.createDocumentFragment();for(var i=0;i<arguments.length;i++)frag.appendChild(arguments[i] instanceof Node?arguments[i]:d.createTextNode(String(arguments[i])));this.parentNode.replaceChild(frag,this);};
 w.addEventListener('error',function(e){if(MorphLegacy.errors.length<12)MorphLegacy.errors.push(String(e.message||'Script error'));});
 var defaults={'--ui-radius-md':'22px','--ui-radius-sm':'14px','--ui-radius-lg':'28px'},values=defaults,timer,stamp='',running=false,again=false;
 function oldColors(text){return String(text).replace(/#([0-9a-f]{8}|[0-9a-f]{4})\b/gi,function(all,hex){if(hex.length===4)hex=hex.replace(/./g,function(c){return c+c;});return 'rgba('+parseInt(hex.slice(0,2),16)+','+parseInt(hex.slice(2,4),16)+','+parseInt(hex.slice(4,6),16)+','+(parseInt(hex.slice(6,8),16)/255).toFixed(3)+')';});}
 var set=CSSStyleDeclaration.prototype.setProperty,get=CSSStyleDeclaration.prototype.getPropertyValue;
 CSSStyleDeclaration.prototype.setProperty=function(k,v,p){if(String(k).indexOf('--')===0){if(!this._morphVars)this._morphVars={};this._morphVars[k]=oldColors(v);return;}return set.call(this,k,oldColors(v),p);};
 CSSStyleDeclaration.prototype.getPropertyValue=function(k){if(String(k).indexOf('--')===0)return this._morphVars&&this._morphVars[k]||values[k]||'';return get.call(this,k);};
 function seed(){try{var profile=localStorage.getItem('cleartv.activeViewer')||'default',prefix='cleartv.'+(profile==='default'?'':'viewer.'+profile+'.'),s=JSON.parse(localStorage.getItem(prefix+'settings')||'{}');s.motion=false;s.slideshowEnabled=false;s.backgroundImages=[];s.uiMode='modern';localStorage.setItem(prefix+'settings',JSON.stringify(s));localStorage.setItem(prefix+'launcher-balanced-navigation-v1','true');localStorage.setItem(prefix+'performanceMode','\"performance\"');localStorage.setItem(prefix+'visualEffects','{\"blur\":false,\"glow\":false,\"motion\":false}');localStorage.setItem('cleartv.launcher-balanced-navigation-v1','true');localStorage.setItem('cleartv.performanceMode','"performance"');localStorage.setItem('cleartv.visualEffects','{"blur":false,"glow":false,"motion":false}');}catch(e){}}
 seed();
  function variables(){var out=nativeAssign({},defaults);(w.MorphLegacyVariableRules||[]).forEach(function(r){try{if(r.media&&r.media.some(function(query){return !w.matchMedia||!w.matchMedia(query).matches;}))return;if(r.selector===':root'||d.documentElement.matches(r.selector)||d.body&&d.body.matches(r.selector))nativeAssign(out,r.vars);}catch(e){}});if(d.documentElement.style._morphVars)nativeAssign(out,d.documentElement.style._morphVars);if(d.body&&d.body.style._morphVars)nativeAssign(out,d.body.style._morphVars);var dock=d.getElementById('favourites');if(dock&&dock.style._morphVars)nativeAssign(out,dock.style._morphVars);Object.keys(out).forEach(function(k){out[k]=oldColors(out[k]);});values=out;return out;}
  function refresh(force){if(!d.body)return;if(!w.cssVars){d.documentElement.classList.add('legacy-no-cssvars');return;}var vars=variables(),next=JSON.stringify(vars);if(!force&&next===stamp)return;if(running){again=true;return;}running=true;stamp=next;cssVars({variables:vars,watch:false,onlyLegacy:false,preserveStatic:true,preserveVars:false,silent:true,onSuccess:function(css){return oldColors(css);},onFinally:function(){running=false;if(again){again=false;queue();}d.documentElement.classList.add('legacy-css-ready');}});}
 function queue(){clearTimeout(timer);timer=setTimeout(function(){refresh(false);},120);}
 ['morphTheme','morphLanguage','morphPerformance','morphTextSize','morphDockSize','morphDockColour','morphViewer','resize'].forEach(function(n){w.addEventListener(n,queue);});
  function watch(){
   if(typeof w.MutationObserver==='function'){
    new MutationObserver(function(records){for(var i=0;i<records.length;i++){var r=records[i];if(r.type==='childList'&&r.addedNodes.length){for(var j=0;j<r.addedNodes.length;j++){var n=r.addedNodes[j];if(n.nodeType===1&&n.tagName==='STYLE'&&!n.hasAttribute('data-cssvars')){queue();return;}}}else if(r.type==='attributes'){queue();return;}}}).observe(d.body,{attributes:true,attributeFilter:['data-theme','style'],childList:true});
    return;
   }
   /* Oldest 2.3 WebKit: no MutationObserver. Poll cheaply; theme events + load already refresh. */
   boot.missing.push('MutationObserver(poll-fallback)');
   var seen=(d.body.getAttribute('data-theme')||'')+'|'+(d.body.getAttribute('style')||'')+'|'+d.getElementsByTagName('STYLE').length;
   setInterval(function(){if(!d.body)return;var now=(d.body.getAttribute('data-theme')||'')+'|'+(d.body.getAttribute('style')||'')+'|'+d.getElementsByTagName('STYLE').length;if(now!==seen){seen=now;queue();}},1500);
  }
  function ready(){d.documentElement.classList.add('morph-button-grid-compat');d.documentElement.classList.add('morph-legacy-layout','morph-tizen2');d.body.setAttribute('data-legacy-target','tizen2');refresh(true);watch();
  if(w.ClearTV){var C=w.ClearTV;C.settings.slideshowEnabled=false;C.settings.backgroundImages=[];if(C.Performance){C.Performance.set('performance');C.Performance.setEffect('blur',false);C.Performance.setEffect('glow',false);C.Performance.setEffect('motion',false);}if(C.Focus&&C.Focus.invalidate)C.Focus.invalidate();}
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready);else ready();
 w.addEventListener('load',function(){refresh(true);});
 w.MorphLegacy.refresh=function(){refresh(true);};
})(window,document);
