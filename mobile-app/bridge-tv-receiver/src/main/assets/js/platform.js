/* Platform boundary. The launcher, media timing and controls stay identical. */
(function () {
  'use strict';
  var ip = '', request = null, readingNetwork = false;
  function valid(value) {
    if (typeof value !== 'string' || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return false;
    var parts = value.split('.');
    for (var n = 0; n < parts.length; n++) if (+parts[n] > 255) return false;
    return +parts[0] !== 0 && +parts[0] !== 127 && +parts[0] < 224;
  }
  function ready(value) {
    if (!valid(value) || value === ip) return;
    ip = value;
    var event = document.createEvent('Event');
    event.initEvent('morph-network-ready', false, false);
    document.dispatchEvent(event);
  }
  // SystemInfo is also available when Samsung's product SDK has not loaded in
  // this iframe. Query both adapters: an Ethernet TV need not use Wi-Fi.
  function readNetwork(hosts) {
    if (readingNetwork) return;
    for (var h = 0; h < hosts.length; h++) {
      var system;
      try { system = hosts[h].tizen && hosts[h].tizen.systeminfo; } catch (e) {}
      if (!system || !system.getPropertyValue) continue;
      readingNetwork = true;
      var pending = 2;
      function done() { pending--; if (!pending) readingNetwork = false; }
      ['WIFI_NETWORK', 'ETHERNET_NETWORK'].forEach(function (kind) {
        try { system.getPropertyValue(kind, function (network) {
          if (network && network.status !== 'DISCONNECTED' && network.status !== 'DEACTIVATED') ready(network.ipAddress);
          done();
        }, done); } catch (e) { done(); }
      });
      return;
    }
  }
  window.MorphPlatform = {
    getIp: function () {
      var value, hosts = [window];
      try { if (window.parent !== window) hosts.push(window.parent); } catch (e) {}
      for (var i = 0; i < hosts.length; i++) {
        try { value = hosts[i].MorphDevice && hosts[i].MorphDevice.localIp(); if (valid(value)) return value; } catch (e) {}
        try { value = hosts[i].webapis && hosts[i].webapis.network && hosts[i].webapis.network.getIp(); if (valid(value)) return value; } catch (e) {}
      }
      readNetwork(hosts);
      return ip;
    },
    exit: function () {
      try { if (window.MorphDevice) { window.MorphDevice.exit(); return; } } catch (e) {}
      try { if (window.parent !== window && window.parent.ClearTV && window.parent.ClearTV.BridgeReceiver) { window.parent.ClearTV.BridgeReceiver.close(); return; } } catch (e) {}
      try { if (window.tizen) { tizen.application.getCurrentApplication().exit(); return; } } catch (e) {}
      try { if (window.webOS && webOS.platformBack) { webOS.platformBack(); return; } } catch (e) {}
      window.close();
    }
  };
  function accept(raw) {
    try {
      var s = typeof raw === 'string' ? JSON.parse(raw) : raw;
      var wired = s.wired || {}, wifi = s.wifi || {};
      ready(wired.state === 'connected' && wired.ipAddress ? wired.ipAddress : wifi.ipAddress || wired.ipAddress || '');
    } catch (e) {}
  }
  try {
    if (window.PalmServiceBridge) {
      request = new PalmServiceBridge();
      request.onservicecallback = accept;
      request.call('luna://com.palm.connectionmanager/getStatus', '{}');
      // Keep the native bridge alive until the response arrives.
      window.MorphPlatform.networkRequest = request;
    }
  } catch (e) {}
})();
