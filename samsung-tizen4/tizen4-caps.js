/* Morph TV Tizen 4 input caps. Ships ONLY in the Tizen 4 package; the modern
   build never loads this file, so modern runtime overhead is zero.
   Coalesces D-pad auto-repeat storms (same arrow <70ms) that queue expensive
   focus sweeps + re-renders on 512MB TVs and read as "frozen remote". */
(function(w,d){'use strict';
  w.MorphTVLowMemory=true;
  // Seed the active viewer before shared Performance migration runs.
  // The marker is per viewer, so a newly selected profile also gets a light first boot.
  try{var profile=localStorage.getItem('cleartv.activeViewer')||'default',prefix='cleartv.'+(profile==='default'?'':'viewer.'+profile+'.');if(!localStorage.getItem(prefix+'tizen-light-default-v2')){localStorage.setItem(prefix+'performanceMode','"performance"');localStorage.setItem(prefix+'visualEffects','{"blur":false,"glow":false,"motion":false}');localStorage.setItem(prefix+'launcher-balanced-navigation-v1','true');localStorage.setItem(prefix+'tizen-light-default-v2','true');}}catch(ignore){}

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
  w.__morphCaps={version:'0.8.243-tizen4',repeatFloorMs:FLOOR_MS};
})(window,document);
