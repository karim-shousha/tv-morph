(function(C) {
  "use strict";
  var rows = { ar: ["\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062C\u0647\u0627\u0632", "\u0627\u0641\u062A\u062D \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0623\u0648 \u0627\u0644\u0628\u0631\u0648\u062C\u064A\u0643\u062A\u0648\u0631 \u0646\u0641\u0633\u0647", "\u0644\u0648 \u0627\u0644\u0641\u062A\u062D \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u060C \u0627\u0633\u062A\u062E\u062F\u0645 \u0632\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0641\u064A \u0627\u0644\u0631\u064A\u0645\u0648\u062A \u0623\u0648 Home \u2190 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A. \u0639\u0644\u0649 \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0627\u0641\u062A\u062D \u0623\u062F\u0648\u0627\u062A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0623\u0646\u062F\u0631\u0648\u064A\u062F \u2190 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0625\u0646 \u0643\u0627\u0646\u062A \u0645\u062A\u0627\u062D\u0629.", "\u0625\u063A\u0644\u0627\u0642"], en: ["Device settings", "Open the TV or projector system settings", "If direct opening is unavailable, use the remote Settings button or Home \u2192 Settings. On Android, try Android settings tools \u2192 System settings if available.", "Close"], fr: ["R\xE9glages de l\u2019appareil", "Ouvrir les r\xE9glages du t\xE9l\xE9viseur ou projecteur", "Si l\u2019acc\xE8s direct est indisponible, utilisez le bouton Param\xE8tres de la t\xE9l\xE9commande ou Accueil \u2192 Param\xE8tres. Sur Android : Outils de r\xE9glages Android \u2192 R\xE9glages syst\xE8me, si disponibles.", "Fermer"], zh: ["\u8BBE\u5907\u8BBE\u7F6E", "\u6253\u5F00\u7535\u89C6\u6216\u6295\u5F71\u4EEA\u7684\u7CFB\u7EDF\u8BBE\u7F6E", "\u82E5\u65E0\u6CD5\u76F4\u63A5\u6253\u5F00\uFF0C\u8BF7\u4F7F\u7528\u9065\u63A7\u5668\u8BBE\u7F6E\u952E\u6216\u4E3B\u9875 \u2192 \u8BBE\u7F6E\u3002Android \u8BBE\u5907\u53EF\u5C1D\u8BD5 Android \u8BBE\u7F6E\u5DE5\u5177 \u2192 \u7CFB\u7EDF\u8BBE\u7F6E\uFF08\u5982\u53EF\u7528\uFF09\u3002", "\u5173\u95ED"], ja: ["\u30C7\u30D0\u30A4\u30B9\u8A2D\u5B9A", "\u30C6\u30EC\u30D3\u307E\u305F\u306F\u30D7\u30ED\u30B8\u30A7\u30AF\u30BF\u30FC\u306E\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A\u3092\u958B\u304F", "\u76F4\u63A5\u958B\u3051\u306A\u3044\u5834\u5408\u306F\u30EA\u30E2\u30B3\u30F3\u306E\u8A2D\u5B9A\u30DC\u30BF\u30F3\u3001\u307E\u305F\u306F\u30DB\u30FC\u30E0 \u2192 \u8A2D\u5B9A\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002Android \u3067\u306F Android \u8A2D\u5B9A\u30C4\u30FC\u30EB \u2192 \u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A\u3082\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002", "\u9589\u3058\u308B"] };
  function words() {
    return rows[window.MorphLocale ? MorphLocale.get() : "en"] || rows.en;
  }
  function guide() {
    if (document.getElementById("device-settings-guide")) return;
    var old = document.activeElement, w = words(), box = C.el("div", "overlay"), panel = C.el("section", "modal"), close = C.el("button", "primary", w[3]);
    box.id = "device-settings-guide";
    panel.dataset.noTranslate = "";
    panel.dir = window.MorphLocale && MorphLocale.get() === "ar" ? "rtl" : "ltr";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.appendChild(C.el("h2", "", w[0]));
    panel.appendChild(C.el("p", "", w[2]));
    panel.appendChild(close);
    box.appendChild(panel);
    function done() {
      box.remove();
      document.removeEventListener("keydown", back, true);
      C.Focus.setScope(document);
      C.Focus.focus(old);
    }
    function back(e) {
      if (e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        e.stopImmediatePropagation();
        done();
      }
    }
    close.onclick = done;
    document.body.appendChild(box);
    C.Focus.setScope(box);
    C.Focus.focus(close);
    document.addEventListener("keydown", back, true);
  }
  function init() {
    var host = document.querySelector("#settings-category-general .settings-panel") || document.querySelector("#view-settings .settings-panel:last-child");
    if (!host) return;
    var button = C.el("button", "setting");
    button.id = "setting-device-settings";
    button.dataset.noTranslate = "";
    function paint() {
      var w = words();
      button.textContent = w[0] + " \u2192";
      button.setAttribute("aria-label", w[1]);
    }
    paint();
    window.addEventListener("morphLanguage", paint);
    var busy = false;
    button.onclick = function() {
      if (busy) return;
      if (window.TVNative && typeof TVNative.deviceSettings === "function") {
        TVNative.deviceSettings();
        return;
      }
      if (typeof tizen === "undefined" || !tizen.application) {
        guide();
        return;
      }
      busy = true;
      var settled = false, timer = setTimeout(function() {
        finish(false);
      }, 4e3);
      function finish(ok) {
        if (settled) return;
        settled = true;
        busy = false;
        clearTimeout(timer);
        if (!ok) guide();
      }
      try {
        tizen.application.getAppsInfo(function(apps) {
          if (settled) return;
          var app = apps.filter(function(a) {
            return /^(settings|tv settings|الإعدادات|إعدادات|paramètres|設定|设置)(\s|$)/i.test(a.name || "");
          })[0];
          if (!app) {
            finish(false);
            return;
          }
          try {
            tizen.application.launch(app.id, function() {
              finish(true);
            }, function() {
              finish(false);
            });
          } catch (e) {
            finish(false);
          }
        }, function() {
          finish(false);
        });
      } catch (e) {
        finish(false);
      }
    };
    host.insertBefore(button, host.firstChild);
  }
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})(window.ClearTV);
