(function(C) {
  "use strict";
  var rows = { en: ["Performance mode", "Automatic", "Light", "Full", "Light: fewer effects and a static background."], ar: ["\u0648\u0636\u0639 \u0627\u0644\u0623\u062F\u0627\u0621", "\u062A\u0644\u0642\u0627\u0626\u064A", "\u062E\u0641\u064A\u0641", "\u0643\u0627\u0645\u0644", "\u062E\u0641\u064A\u0641: \u0645\u0624\u062B\u0631\u0627\u062A \u0623\u0642\u0644 \u0648\u062E\u0644\u0641\u064A\u0629 \u062B\u0627\u0628\u062A\u0629."], fr: ["Mode de performance", "Automatique", "L\xE9ger", "Complet", "L\xE9ger : moins d\u2019effets et un fond fixe."], zh: ["\u6027\u80FD\u6A21\u5F0F", "\u81EA\u52A8", "\u8F7B\u91CF", "\u5B8C\u6574", "\u8F7B\u91CF\uFF1A\u51CF\u5C11\u6548\u679C\u5E76\u4F7F\u7528\u9759\u6001\u80CC\u666F\u3002"], ja: ["\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9", "\u81EA\u52D5", "\u8EFD\u91CF", "\u901A\u5E38", "\u8EFD\u91CF\uFF1A\u52B9\u679C\u3092\u6E1B\u3089\u3057\u3001\u80CC\u666F\u3092\u56FA\u5B9A\u3057\u307E\u3059\u3002"] }, modes = ["auto", "light", "full"];
  var mode = C.read("performanceMode", "auto"), device = {};
  if (modes.indexOf(mode) < 0) mode = "auto";
  try {
    if (window.TVNative && TVNative.deviceInfo) device = JSON.parse(TVNative.deviceInfo());
  } catch (e) {
  }
  function words() {
    return rows[window.MorphLocale ? MorphLocale.get() : "en"] || rows.en;
  }
  function apply() {
    var light = mode === "light" || mode === "auto" && device.lowMemory === true;
    document.body.classList.toggle("light-mode", light);
    if (button) {
      var w = words();
      button.textContent = w[0] + " \xB7 " + w[modes.indexOf(mode) + 1];
      button.title = w[4];
    }
    if (C.applyRemoteConfig) C.applyRemoteConfig({});
    window.dispatchEvent(new Event("morphPerformance"));
  }
  C.Performance = { isLight: function() {
    return document.body.classList.contains("light-mode");
  }, get: function() {
    return mode;
  }, set: function(value) {
    if (modes.indexOf(value) < 0) return;
    mode = value;
    C.write("performanceMode", mode);
    apply();
  } };
  var button;
  window.addEventListener("load", function() {
    button = document.createElement("button");
    button.id = "setting-performance";
    button.className = "setting";
    button.setAttribute("data-no-translate", "");
    button.onclick = function() {
      C.Performance.set(modes[(modes.indexOf(mode) + 1) % modes.length]);
    };
    var panel = document.querySelector("#view-settings .settings-panel:last-child");
    if (panel) panel.insertBefore(button, panel.firstChild);
    apply();
  });
  window.addEventListener("morphLanguage", function() {
    if (button) {
      var w = words();
      button.textContent = w[0] + " \xB7 " + w[modes.indexOf(mode) + 1];
      button.title = w[4];
    }
  });
  document.body.classList.toggle("light-mode", mode === "light" || mode === "auto" && device.lowMemory === true);
  function icons(root) {
    root.querySelectorAll(".shelf-card img,.app-card img").forEach(function(img) {
      img.loading = "lazy";
      img.decoding = "async";
    });
  }
  new MutationObserver(function(records) {
    records.forEach(function(r) {
      Array.prototype.forEach.call(r.addedNodes, function(n) {
        if (n.nodeType === 1) icons(n);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})(window.ClearTV);
