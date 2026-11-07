/* One Bridge trial per device storage; viewer changes never restart its 72 hours. */
(function(w){
  'use strict';
  var duration=72*60*60*1000,key='morph.bridge.trial.v1';
  function status(begin){
    if(w.TVNative&&TVNative.bridgeTrialJson)return JSON.parse(TVNative.bridgeTrialJson());
    var now=Date.now(),state=null;
    try{
      state=JSON.parse(localStorage.getItem(key)||'null');
      if(state&&(typeof state.start!=='number'||typeof state.last!=='number'||!isFinite(state.start)||!isFinite(state.last)||state.start<=0||state.last<state.start))throw Error('invalid_trial');
      if(!state&&begin)state={start:now,last:now};
      if(!state)return {startedAt:0,remainingMs:duration,expired:false};
      if(now+300000<state.last)state.rollback=true;
      state.last=Math.max(now,state.last);localStorage.setItem(key,JSON.stringify(state));
      var remaining=state.rollback?0:Math.max(0,duration-(state.last-state.start));
      return {startedAt:state.start,remainingMs:remaining,expired:remaining===0};
    }catch(error){return {remainingMs:0,expired:true,storageError:true};}
  }
  function check(done){
    var trial=status(true),plus=w.MorphPlus;
    if(plus&&plus.isActive()){done();return;}
    if(!trial.expired){done();return;}
    if(plus&&plus.isPending&&plus.isPending()&&plus.whenReady){plus.whenReady().then(function(){if(plus.isActive())done();else plus.open();});return;}
    if(plus)plus.open();
  }
  w.MorphBridgeAccess={status:status,require:check};
})(window);
