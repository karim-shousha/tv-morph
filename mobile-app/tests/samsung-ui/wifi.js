(function(C) {
  "use strict";
  var rows = { ar: ["\u0648\u0627\u064A \u0641\u0627\u064A", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A Wi-Fi", "\u0644\u0648 \u062C\u0647\u0627\u0632\u0643 \u0644\u0627 \u064A\u062F\u0639\u0645 \u0627\u0644\u0641\u062A\u062D \u0627\u0644\u0645\u0628\u0627\u0634\u0631: \u0645\u0646 \u0631\u064A\u0645\u0648\u062A \u0633\u0627\u0645\u0633\u0648\u0646\u062C \u0627\u0641\u062A\u062D Home \u2190 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u2190 \u0643\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u2190 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 (\u0623\u0648 \u0639\u0627\u0645) \u2190 \u0627\u0644\u0634\u0628\u0643\u0629 \u2190 \u0641\u062A\u062D \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0634\u0628\u0643\u0629 \u2190 \u0644\u0627\u0633\u0644\u0643\u064A.", "\u0625\u063A\u0644\u0627\u0642", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u2190 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u2190 Wi-Fi."], en: ["Wi-Fi", "Wi-Fi settings", "If direct opening is unavailable: on the Samsung remote go to Home \u2192 Settings \u2192 All Settings \u2192 Connection (or General) \u2192 Network \u2192 Open Network Settings \u2192 Wireless.", "Close", "TV Settings \u2192 Network & Internet \u2192 Wi-Fi."], fr: ["Wi-Fi", "Param\xE8tres Wi-Fi", "Si l\u2019acc\xE8s direct est indisponible : sur la t\xE9l\xE9commande Samsung, Accueil \u2192 Param\xE8tres \u2192 Tous les param\xE8tres \u2192 Connexion (ou G\xE9n\xE9ral) \u2192 R\xE9seau \u2192 Ouvrir les param\xE8tres r\xE9seau \u2192 Sans fil.", "Fermer", "Param\xE8tres du t\xE9l\xE9viseur \u2192 R\xE9seau et Internet \u2192 Wi-Fi."], zh: ["Wi-Fi", "Wi-Fi \u8BBE\u7F6E", "\u82E5\u65E0\u6CD5\u76F4\u63A5\u6253\u5F00\uFF1A\u4F7F\u7528\u4E09\u661F\u9065\u63A7\u5668\u8FDB\u5165\u4E3B\u9875 \u2192 \u8BBE\u7F6E \u2192 \u6240\u6709\u8BBE\u7F6E \u2192 \u8FDE\u63A5\uFF08\u6216\u5E38\u89C4\uFF09\u2192 \u7F51\u7EDC \u2192 \u6253\u5F00\u7F51\u7EDC\u8BBE\u7F6E \u2192 \u65E0\u7EBF\u3002", "\u5173\u95ED", "\u7535\u89C6\u8BBE\u7F6E \u2192 \u7F51\u7EDC\u548C\u4E92\u8054\u7F51 \u2192 Wi-Fi\u3002"], ja: ["Wi-Fi", "Wi-Fi \u8A2D\u5B9A", "\u76F4\u63A5\u958B\u3051\u306A\u3044\u5834\u5408\uFF1ASamsung \u30EA\u30E2\u30B3\u30F3\u3067\u30DB\u30FC\u30E0 \u2192 \u8A2D\u5B9A \u2192 \u3059\u3079\u3066\u306E\u8A2D\u5B9A \u2192 \u63A5\u7D9A\uFF08\u307E\u305F\u306F\u4E00\u822C\uFF09\u2192 \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF \u2192 \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u8A2D\u5B9A\u3092\u958B\u304F \u2192 \u30EF\u30A4\u30E4\u30EC\u30B9\u3002", "\u9589\u3058\u308B", "\u30C6\u30EC\u30D3\u306E\u8A2D\u5B9A \u2192 \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u3068\u30A4\u30F3\u30BF\u30FC\u30CD\u30C3\u30C8 \u2192 Wi-Fi\u3002"] };
  function words() {
    return rows[window.MorphLocale ? MorphLocale.get() : "en"] || rows.en;
  }
  function guide() {
    if (document.getElementById("wifi-guide")) return;
    var old = document.activeElement, w = words(), box = C.el("div", "overlay"), panel = C.el("section", "modal"), close = C.el("button", "primary", w[3]);
    box.id = "wifi-guide";
    panel.setAttribute("data-no-translate", "");
    panel.dir = window.MorphLocale && MorphLocale.get() === "ar" ? "rtl" : "ltr";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.appendChild(C.el("h2", "", w[1]));
    panel.appendChild(C.el("p", "", w[window.TVNative ? 4 : 2]));
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
  function initialise() {
    var button = C.el("button", "nav nav-wifi");
    button.id = "nav-wifi";
    button.setAttribute("data-no-translate", "");
    button.innerHTML = '<span class="wifi-symbol"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 10a17 17 0 0 1 22 0M7 15a11 11 0 0 1 14 0M11 20a5 5 0 0 1 6 0"/><circle cx="14" cy="24" r="1" fill="currentColor"/></svg></span><span class="wifi-label"></span>';
    var settings = document.getElementById("nav-settings");
    settings.parentNode.insertBefore(button, settings.nextSibling);
    function paint() {
      var w = words();
      button.querySelector(".wifi-label").textContent = w[0];
      button.setAttribute("aria-label", w[1]);
      button.title = w[1];
    }
    paint();
    window.addEventListener("morphLanguage", paint);
    var busy = false;
    button.onclick = function() {
      if (busy) return;
      if (window.TVNative && typeof TVNative.wifiSettings === "function") {
        TVNative.wifiSettings();
        return;
      }
      if (typeof tizen === "undefined" || !tizen.application || !tizen.ApplicationControl) {
        guide();
        return;
      }
      busy = true;
      var done = false, timer = setTimeout(function() {
        finish(false);
      }, 4500);
      function finish(ok) {
        if (done) return;
        done = true;
        busy = false;
        clearTimeout(timer);
        if (!ok) guide();
      }
      function settingsFallback() {
        if (done) return;
        try {
          tizen.application.getAppsInfo(function(apps) {
            if (done) return;
            var app = apps.filter(function(a) {
              return /^(settings|tv settings|network settings|الإعدادات|إعدادات|paramètres|設定|设置)(\s|$)/i.test(a.name || "");
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
      }
      try {
        var control = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/setting/wifi");
        tizen.application.launchAppControl(control, null, function() {
          finish(true);
        }, settingsFallback);
      } catch (e) {
        settingsFallback();
      }
    };
  }
  if (document.readyState === "complete") initialise();
  else window.addEventListener("load", initialise);
})(window.ClearTV);
