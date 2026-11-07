/* Morph TV Lite boot header. Hand-written ES5 only. Loads BEFORE every other
   script (including polyfills) so a single modern token elsewhere can never
   leave the TV with a silent blank screen and no diagnostics. */
(function(w,d){'use strict';
  var boot={es5:true,at:(new Date()).toISOString(),missing:[],errors:[]};
  function miss(name){boot.missing.push(name);}
  /* Object.assign shim (old WebKit). Full runtime reuses this, never assumes. */
  if(typeof Object!=='undefined'&&!Object.assign){
    Object.assign=function(t){if(t==null)throw new TypeError('assign on null');t=Object(t);for(var i=1;i<arguments.length;i++){var s=arguments[i];if(s!=null){for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k];}}}return t;};
    miss('Object.assign(native)');
  }
  /* Capability flags consumed by legacy-runtime.js and legacy-caps.js. */
  boot.hasPromise=typeof w.Promise==='function';
  boot.hasMutationObserver=typeof w.MutationObserver==='function';
  boot.hasLocalStorage=false;
  try{w.localStorage.setItem('__morph_probe','1');w.localStorage.removeItem('__morph_probe');boot.hasLocalStorage=true;}
  catch(e){miss('localStorage(native)');}
  /* Memory-backed storage stub: only when native storage throws (private mode).
     Never deletes user data; keeps the app running read-only. */
  if(!boot.hasLocalStorage){
    var mem={};
    w.localStorage={getItem:function(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},setItem:function(k,v){mem[String(k)]=String(v);},removeItem:function(k){delete mem[k];},clear:function(){for(var k in mem)delete mem[k];}};
  }
  /* Early error capture: runtime adopts this queue on load. */
  w.__morphBootErrors=boot.errors;
  if(w.addEventListener)w.addEventListener('error',function(e){if(boot.errors.length<24)boot.errors.push(String((e&&e.message)||'Script error'));});
  w.MorphLegacyBoot=boot;
})(window,document);
