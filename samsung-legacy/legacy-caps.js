/* Morph TV Lite input caps. Hand-written ES5 only. Lite-only: the modern build
   never loads this file, so modern runtime overhead is zero.
   1) Coalesces D-pad auto-repeat storms (same arrow <70ms) that queue expensive
      focus sweeps + re-renders on 512MB TVs and read as "frozen remote".
   2) Records storage-quota failures without deleting user data. */
(function(w,d){'use strict';
  var boot=w.MorphLegacyBoot||{missing:[],errors:[]};
  var lastCode=0,lastAt=0;var FLOOR_MS=70;
  function stamp(){return (new Date()).getTime();}
  d.addEventListener('keydown',function(e){
    var code=e.keyCode||e.which||0;
    if(code>=37&&code<=40){
      var now=stamp();
      if(code===lastCode&&(now-lastAt)<FLOOR_MS){try{e.stopImmediatePropagation();}catch(x){}try{e.preventDefault();}catch(y){}return;}
      lastCode=code;lastAt=now;
    }else{lastCode=0;lastAt=0;}
  },true);
  /* Quota taxonomy: surface, never evict (user data is never deleted). */
  w.addEventListener('error',function(e){
    var msg=String((e&&e.message)||'');
    if(/quota|QUOTA_EXCEEDED_ERR|NS_ERROR_DOM_QUOTA_REACHED/i.test(msg)){
      if(w.MorphLegacy&&w.MorphLegacy.errors&&w.MorphLegacy.errors.length<12)w.MorphLegacy.errors.push('storage-quota: catalog snapshot too large for this TV');
    }
  });
  w.__morphCaps={version:'0.8.187-tizen3',repeatFloorMs:FLOOR_MS};
})(window,document);
