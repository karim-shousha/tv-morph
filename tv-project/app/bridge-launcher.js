/* Shared built-in receiver entry. Native Android owns its own guarded Activity. */
(function (C) {
  'use strict';
  var frame = null, previous = null, trialTimer = null;
  C.BridgeReceiver = {
    isOpen: function () { return !!frame; },
    back: function () {
      if (!frame) return false;
      var receiver = frame.contentWindow;
      if (receiver && receiver.MorphReceiverBack) receiver.MorphReceiverBack();
      else C.BridgeReceiver.close();
      return true;
    },
    open: function () {if(window.MorphBridgeAccess){MorphBridgeAccess.require(C.BridgeReceiver.openGranted);return;}C.BridgeReceiver.openGranted();},
    openGranted: function () {
      if (frame) return;
      if (C.Prayer && !C.Prayer.allowLaunch()) return;
      if (C.ParentControls && C.ParentControls.mediaGuard && !C.ParentControls.mediaGuard('local.tvmorph.tv.bridge', C.BridgeReceiver.open)) return;
      var media = window.SamsungMedia || window.MorphMedia;
      if (media && media.exit) media.exit(true);
      previous = document.activeElement;
      frame = document.createElement('iframe');
      frame.id = 'morph-bridge-receiver';
      frame.title = 'Morph Bridge';
      frame.allow = 'autoplay; fullscreen';
      frame.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;border:0;z-index:10000;background:#07101e;animation:none;transition:none;opacity:1';
      frame.src = 'bridge-receiver/index.html';
      document.body.appendChild(frame);
      if (C.ParentControls && C.ParentControls.mediaStarted) C.ParentControls.mediaStarted('local.tvmorph.tv.bridge');
      if(window.MorphBridgeAccess){trialTimer=setTimeout(checkTrial,Math.min(2147483647,MorphBridgeAccess.status(false).remainingMs));}
      frame.onload = function () { if (frame) frame.contentWindow.focus(); };
    },
    close: function () {
      if (!frame) return;
      clearTimeout(trialTimer);trialTimer=null;
      frame.remove();
      frame = null;
      if (C.ParentControls && C.ParentControls.mediaStopped) C.ParentControls.mediaStopped();
      if (previous && previous.isConnected) C.Focus.focus(previous);
      previous = null;
    }
  };
  function checkTrial(){
    clearTimeout(trialTimer);trialTimer=null;
    if(!frame||!window.MorphBridgeAccess)return;
    var trial=MorphBridgeAccess.status(false);if(!trial.expired){trialTimer=setTimeout(checkTrial,Math.min(2147483647,trial.remainingMs));return;}
    var plus=window.MorphPlus;
    if(plus&&plus.isPending&&plus.isPending()&&plus.whenReady){plus.whenReady().then(checkTrial);return;}
    if(!plus||!plus.isActive()){C.BridgeReceiver.close();if(plus)plus.open();}
  }
  window.addEventListener('morphPlus',checkTrial);
  function pin() {
    var id = 'local.tvmorph.tv.bridge';
    if (!C.Catalog.get(id)) C.Catalog.apps.push({id:id,name:'Morph Bridge',installed:true,launchable:true,platform:'builtin'});
    var viewer=C.Profiles&&C.Profiles.active?C.Profiles.active():'default',key='bridge-home-pin-v1.'+viewer;
    if(!C.read(key,false)){
      var pins=C.getRemoteState().pins.slice();
      if(pins.indexOf(id)<0)pins.push(id);
      C.setRemotePins(pins);C.write(key,true);
    }
  }
  window.addEventListener('load', function () {pin();window.addEventListener('morphViewer',pin);});
})(window.ClearTV);
