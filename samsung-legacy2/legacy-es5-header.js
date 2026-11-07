/* Morph TV Lite boot header. Hand-written ES5 only. Loads BEFORE every other
   script (including polyfills) so a single modern token elsewhere can never
   leave the TV with a silent blank screen and no diagnostics. */
(function(w,d){'use strict';
  var boot={es5:true,at:(new Date()).toISOString(),missing:[],errors:[]};
  function miss(name){boot.missing.push(name);}
  /* Some early WebKit firmware exposes only the prefixed DOM observer.
     The shared focus/theme code requires the standard constructor at startup. */
  if(typeof w.MutationObserver!=='function'){
    var NativeObserver=w.WebKitMutationObserver||w.MozMutationObserver;
    if(typeof NativeObserver==='function'){
      w.MutationObserver=NativeObserver;miss('MutationObserver(prefixed-native)');
    }else{
      /* Event-driven compatibility for firmware with neither constructor.
         No document-wide timer or repeated DOM scans on idle televisions. */
      function Observer(callback){this.callback=callback;this.records=[];this.listeners=[];this.timer=0;}
      Observer.prototype.takeRecords=function(){var records=this.records;this.records=[];return records;};
      Observer.prototype.disconnect=function(){for(var i=0;i<this.listeners.length;i++){var l=this.listeners[i];l.target.removeEventListener(l.type,l.fn,true);}this.listeners=[];this.records=[];clearTimeout(this.timer);this.timer=0;};
      Observer.prototype.observe=function(target,options){
        if(!target||!target.addEventListener)throw new TypeError('Invalid observation target');
        var self=this,o=options||{};
        function enqueue(record){if(self.records.length<64)self.records.push(record);if(!self.timer)self.timer=setTimeout(function(){self.timer=0;var records=self.takeRecords();if(records.length)self.callback(records,self);},50);}
        function listen(type,fn){target.addEventListener(type,fn,true);self.listeners.push({target:target,type:type,fn:fn});}
        if(o.childList){['DOMNodeInserted','DOMNodeRemoved'].forEach(function(type){listen(type,function(e){var parent=e.relatedNode||e.target.parentNode;if(!o.subtree&&parent!==target)return;enqueue({type:'childList',target:parent||target,addedNodes:type==='DOMNodeInserted'?[e.target]:[],removedNodes:type==='DOMNodeRemoved'?[e.target]:[]});});});}
        if(o.attributes)listen('DOMAttrModified',function(e){if(!o.subtree&&e.target!==target)return;if(o.attributeFilter&&o.attributeFilter.indexOf(e.attrName)<0)return;enqueue({type:'attributes',target:e.target,attributeName:e.attrName,oldValue:o.attributeOldValue?e.prevValue:null,addedNodes:[],removedNodes:[]});});
        if(o.characterData)listen('DOMCharacterDataModified',function(e){if(!o.subtree&&e.target!==target)return;enqueue({type:'characterData',target:e.target,oldValue:o.characterDataOldValue?e.prevValue:null,addedNodes:[],removedNodes:[]});});
      };
      /* Install after core-js: its Promise scheduler must not mistake this
         compatibility observer for a native microtask implementation. */
      boot.installMutationObserver=function(){w.MutationObserver=Observer;};
      miss('MutationObserver(legacy-dom-events)');
    }
  }
  /* Object.assign shim (old WebKit). Full runtime reuses this, never assumes. */
  if(typeof Object!=='undefined'&&!Object.assign){
    Object.assign=function(t){if(t==null)throw new TypeError('assign on null');t=Object(t);for(var i=1;i<arguments.length;i++){var s=arguments[i];if(s!=null){for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k];}}}return t;};
    miss('Object.assign(native)');
  }
  /* Capability flags consumed by legacy-runtime.js and legacy-caps.js. */
  boot.hasPromise=typeof w.Promise==='function';
  boot.hasMutationObserver=typeof w.MutationObserver==='function';
  boot.hasLocalStorage=false;boot.storageWritable=false;
  try{w.localStorage.getItem('__morph_probe');boot.hasLocalStorage=true;}
  catch(e){miss('localStorage(native)');}
  if(boot.hasLocalStorage){try{w.localStorage.setItem('__morph_probe','1');w.localStorage.removeItem('__morph_probe');boot.storageWritable=true;}catch(e){miss('localStorage(write-unavailable)');}}
  /* Memory-backed storage stub: only when native storage throws (private mode).
     Never deletes user data; keeps the app running read-only. */
  if(!boot.hasLocalStorage){
    var mem={};
    var memoryStorage={getItem:function(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},setItem:function(k,v){mem[String(k)]=String(v);},removeItem:function(k){delete mem[k];},clear:function(){for(var k in mem)delete mem[k];}};
    try{Object.defineProperty(w,'localStorage',{configurable:true,value:memoryStorage});}catch(e){miss('localStorage(fallback-unavailable)');}
  }
  /* Early error capture: runtime adopts this queue on load. */
  w.__morphBootErrors=boot.errors;
  if(w.addEventListener)w.addEventListener('error',function(e){if(boot.errors.length<24)boot.errors.push(String((e&&e.message)||'Script error'));});
  w.MorphLegacyBoot=boot;
})(window,document);
