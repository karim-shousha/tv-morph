(function(C) {
  "use strict";
  function initialise() {
    var language = document.getElementById("samsung-language") || document.createElement("button");
    language.id = "samsung-language";
    language.className = "nav";
    language.textContent = "Language / \u0627\u0644\u0644\u063A\u0629";
    language.onclick = function() {
      MorphLocale.choose();
    };
    document.querySelector("header nav").appendChild(language);
    if (window.MorphLocale) MorphLocale.set(MorphLocale.get());
    var startup = document.createElement("button");
    startup.className = "setting";
    startup.id = "setting-startup";
    function startupLabel() {
      startup.textContent = MorphLocale.t("\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u2192", "TV home & startup \u2192");
    }
    startupLabel();
    startup.onclick = function() {
      var rows = { ar: ["\u062A\u0634\u063A\u064A\u0644 Morph TV \u0639\u0646\u062F \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646", "2017\u20132021: \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u2190 \u0639\u0627\u0645 \u2190 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629 \u2190 \u062A\u0634\u063A\u064A\u0644 \u0622\u062E\u0631 \u062A\u0637\u0628\u064A\u0642 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627.", "2022\u20132024: \u0643\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u2190 \u0639\u0627\u0645 \u0648\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u2190 \u062E\u064A\u0627\u0631\u0627\u062A \u0634\u0627\u0634\u0629 \u0627\u0644\u0628\u062F\u0621 \u2190 \u062A\u0634\u063A\u064A\u0644 \u0622\u062E\u0631 \u062A\u0637\u0628\u064A\u0642 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627.", "2025 \u0648\u0645\u0627 \u0628\u0639\u062F\u0647: \u0643\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u2190 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629 \u2190 \u062E\u064A\u0627\u0631\u0627\u062A \u0634\u0627\u0634\u0629 \u0627\u0644\u0628\u062F\u0621. \u0627\u0628\u062D\u062B \u0639\u0646 \u062A\u0634\u063A\u064A\u0644 \u0622\u062E\u0631 \u062A\u0637\u0628\u064A\u0642 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0625\u0646 \u0643\u0627\u0646 \u0645\u0648\u062C\u0648\u062F\u064B\u0627.", "\u0641\u0639\u0651\u0644 \u0627\u0644\u062E\u064A\u0627\u0631 \u0645\u0646 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646\u060C \u062B\u0645 \u0627\u0641\u062A\u062D Morph TV \u0648\u0627\u062A\u0631\u0643\u0647 \u0622\u062E\u0631 \u062A\u0637\u0628\u064A\u0642 \u0642\u0628\u0644 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0634\u0627\u0634\u0629. \u0625\u0646 \u0638\u0647\u0631\u062A \u0648\u0627\u062C\u0647\u0629 Smart Hub \u0623\u0648\u0644\u064B\u0627\u060C \u0631\u0627\u062C\u0639 \u062E\u064A\u0627\u0631 \u0628\u062F\u0621 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0639 Smart Hub.", "\u0647\u0630\u0647 \u062E\u0637\u0648\u0627\u062A \u0625\u0639\u062F\u0627\u062F \u0648\u0644\u064A\u0633\u062A \u062A\u0623\u0643\u064A\u062F \u062A\u0641\u0639\u064A\u0644. Samsung \u062A\u062D\u062F\u062F \u062A\u0648\u0641\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u062D\u0633\u0628 \u0627\u0644\u0645\u0648\u062F\u064A\u0644 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642. \u0644\u0627 \u064A\u0633\u062A\u0628\u062F\u0644 Morph TV \u0632\u0631 Home \u0623\u0648 Smart Hub.", "\u0625\u063A\u0644\u0627\u0642"], en: ["Start Morph TV with your Samsung TV", "2017\u20132021: Settings > General > Smart Features > Autorun Last App.", "2022\u20132024: All Settings > General & Privacy > Start Screen Options > Autorun Last App.", "2025+: All Settings > Advanced Features > Start Screen Options. Look for Autorun Last App if available.", "Enable the option on the TV, then leave Morph TV as the last app before powering off. If Smart Hub appears first, review Start with Smart Hub Home.", "This guide does not confirm activation. Samsung controls availability by model and app. Morph TV does not replace Home or Smart Hub.", "Close"], fr: ["D\xE9marrer Morph TV avec le t\xE9l\xE9viseur", "2017\u20132021 : Param\xE8tres > G\xE9n\xE9ral > Fonctions intelligentes > Ex\xE9cution automatique de la derni\xE8re application.", "2022\u20132024 : Tous les param\xE8tres > G\xE9n\xE9ral et confidentialit\xE9 > Options de d\xE9marrage > Derni\xE8re application.", "2025+ : Tous les param\xE8tres > Fonctions avanc\xE9es > Options de d\xE9marrage. Cherchez la derni\xE8re application si disponible.", "Activez l\u2019option sur le t\xE9l\xE9viseur et laissez Morph TV comme derni\xE8re application avant de l\u2019\xE9teindre. V\xE9rifiez le d\xE9marrage de Smart Hub si n\xE9cessaire.", "Ce guide ne confirme pas l\u2019activation. La disponibilit\xE9 d\xE9pend du mod\xE8le et de l\u2019application. Morph TV ne remplace pas Home ou Smart Hub.", "Fermer"], zh: ["\u968F Samsung \u7535\u89C6\u542F\u52A8 Morph TV", "2017\u20132021\uFF1A\u8BBE\u7F6E > \u5E38\u89C4 > \u667A\u80FD\u529F\u80FD > \u81EA\u52A8\u8FD0\u884C\u4E0A\u6B21\u5E94\u7528\u3002", "2022\u20132024\uFF1A\u6240\u6709\u8BBE\u7F6E > \u5E38\u89C4\u4E0E\u9690\u79C1 > \u542F\u52A8\u5C4F\u5E55\u9009\u9879 > \u81EA\u52A8\u8FD0\u884C\u4E0A\u6B21\u5E94\u7528\u3002", "2025 \u5E74\u8D77\uFF1A\u6240\u6709\u8BBE\u7F6E > \u9AD8\u7EA7\u529F\u80FD > \u542F\u52A8\u5C4F\u5E55\u9009\u9879\u3002\u67E5\u627E\u81EA\u52A8\u8FD0\u884C\u4E0A\u6B21\u5E94\u7528\uFF08\u5982\u6709\uFF09\u3002", "\u5728\u7535\u89C6\u4E2D\u5F00\u542F\u9009\u9879\uFF0C\u5173\u673A\u524D\u6700\u540E\u6253\u5F00 Morph TV\u3002\u82E5\u9996\u5148\u663E\u793A Smart Hub\uFF0C\u8BF7\u68C0\u67E5\u5176\u542F\u52A8\u9009\u9879\u3002", "\u672C\u6307\u5357\u4E0D\u8868\u793A\u5DF2\u542F\u7528\u3002\u53EF\u7528\u6027\u7531 Samsung \u6309\u578B\u53F7\u548C\u5E94\u7528\u51B3\u5B9A\u3002Morph TV \u4E0D\u4F1A\u66FF\u4EE3 Home \u6216 Smart Hub\u3002", "\u5173\u95ED"], ja: ["\u30C6\u30EC\u30D3\u8D77\u52D5\u6642\u306B Morph TV \u3092\u958B\u304F", "2017\uFF5E2021\uFF1A\u8A2D\u5B9A > \u4E00\u822C > \u30B9\u30DE\u30FC\u30C8\u6A5F\u80FD > \u6700\u5F8C\u306E\u30A2\u30D7\u30EA\u3092\u81EA\u52D5\u8D77\u52D5\u3002", "2022\uFF5E2024\uFF1A\u3059\u3079\u3066\u306E\u8A2D\u5B9A > \u4E00\u822C\u3068\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC > \u8D77\u52D5\u753B\u9762\u306E\u8A2D\u5B9A > \u6700\u5F8C\u306E\u30A2\u30D7\u30EA\u3092\u81EA\u52D5\u8D77\u52D5\u3002", "2025 \u5E74\u4EE5\u964D\uFF1A\u3059\u3079\u3066\u306E\u8A2D\u5B9A > \u9AD8\u5EA6\u306A\u6A5F\u80FD > \u8D77\u52D5\u753B\u9762\u306E\u8A2D\u5B9A\u3002\u5BFE\u5FDC\u3057\u3066\u3044\u308C\u3070\u6700\u5F8C\u306E\u30A2\u30D7\u30EA\u3092\u81EA\u52D5\u8D77\u52D5\u3092\u9078\u3073\u307E\u3059\u3002", "\u30C6\u30EC\u30D3\u5074\u3067\u8A2D\u5B9A\u3057\u3001\u96FB\u6E90\u3092\u5207\u308B\u524D\u306B Morph TV \u3092\u6700\u5F8C\u306B\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002\u5FC5\u8981\u306A\u3089 Smart Hub \u306E\u8D77\u52D5\u8A2D\u5B9A\u3082\u78BA\u8A8D\u3057\u307E\u3059\u3002", "\u3053\u306E\u30AC\u30A4\u30C9\u306F\u6709\u52B9\u5316\u306E\u78BA\u8A8D\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u5BFE\u5FDC\u72B6\u6CC1\u306F Samsung \u306E\u6A5F\u7A2E\u3068\u30A2\u30D7\u30EA\u306B\u3088\u308A\u307E\u3059\u3002Home \u3084 Smart Hub \u306F\u7F6E\u304D\u63DB\u3048\u307E\u305B\u3093\u3002", "\u9589\u3058\u308B"] }, w = rows[MorphLocale.get()] || rows.en, box = C.el("div", "overlay"), panel = C.el("section", "modal samsung-startup-guide"), previous = document.activeElement;
      box.id = "samsung-startup-guide";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("data-no-translate", "");
      panel.dir = MorphLocale.get() === "ar" ? "rtl" : "ltr";
      panel.appendChild(C.el("h2", "", w[0]));
      for (var i = 1; i < 6; i++) panel.appendChild(C.el("p", "", w[i]));
      var close = C.el("button", "primary", w[6]);
      function done() {
        box.remove();
        C.Focus.setScope(document);
        C.Focus.focus(previous);
        document.removeEventListener("keydown", back, true);
      }
      function back(e) {
        if (e.keyCode === 27 || e.keyCode === 10009) {
          e.preventDefault();
          e.stopImmediatePropagation();
          done();
        }
      }
      close.onclick = done;
      panel.appendChild(close);
      box.appendChild(panel);
      document.body.appendChild(box);
      C.Focus.setScope(box);
      C.Focus.focus(close);
      document.addEventListener("keydown", back, true);
    };
    document.querySelector("#view-settings .settings-panel:last-child").appendChild(startup);
    window.addEventListener("morphLanguage", startupLabel);
    document.getElementById("version-note").textContent = "MORPH TV \xB7 SAMSUNG " + (document.body.getAttribute("data-build-version") || "Preview");
    if (document.querySelector("#view-home>.home-feed")) return;
    var subscription = document.createElement("button");
    subscription.className = "setting";
    subscription.id = "setting-iptv";
    subscription.textContent = MorphLocale.t("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0634\u062A\u0631\u0627\u0643 IPTV \u2192", "IPTV account \u2192");
    subscription.onclick = function() {
      SamsungMedia.open("iptv", null, true);
    };
    document.querySelector("#view-settings .settings-panel:last-child").appendChild(subscription);
    window.addEventListener("morphLanguage", function() {
      subscription.textContent = MorphLocale.t("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0634\u062A\u0631\u0627\u0643 IPTV \u2192", "IPTV account \u2192");
    });
    function sizeRails() {
      var rail2 = document.querySelector(".home-shelf-rail");
      if (!rail2) return;
      var width = rail2.clientWidth - 20, count = Math.max(1, Math.floor((width + 22) / 257)), card = (width - 22 * (count - 1)) / count;
      document.body.style.setProperty("--shelf-card-width", card + "px");
    }
    window.addEventListener("resize", sizeRails);
    requestAnimationFrame(sizeRails);
    var home = document.getElementById("view-home"), feed = document.createElement("div");
    feed.className = "home-feed";
    feed.setAttribute("data-scroll", "vertical");
    while (home.firstChild) feed.appendChild(home.firstChild);
    home.appendChild(feed);
    var tools = feed.querySelector(".home-tools");
    if (tools) {
      home.appendChild(tools);
      var footer = document.querySelector("main>footer");
      if (footer) {
        footer.classList.add("cinema-credit");
        home.appendChild(footer);
      }
    }
    var section = document.createElement("section");
    section.className = "home-shelf";
    var title = document.createElement("h2");
    section.appendChild(title);
    var rail = document.createElement("div");
    rail.className = "home-shelf-rail";
    rail.id = "samsung-apps-shelf";
    rail.setAttribute("data-scroll", "horizontal");
    section.appendChild(rail);
    feed.appendChild(section);
    function render() {
      title.textContent = MorphLocale.t("\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646", "TV apps");
      rail.textContent = "";
      if (C.AppReorder) C.AppReorder.orderApps();
      C.Catalog.apps.forEach(function(app) {
        var card = document.createElement("button");
        card.className = "shelf-card";
        card.setAttribute("data-app-id", app.id);
        card.appendChild(C.Catalog.icon(app));
        var label = document.createElement("span");
        label.textContent = app.name;
        card.appendChild(label);
        card.onclick = function() {
          C.Catalog.launch(app);
        };
        rail.appendChild(card);
      });
    }
    render();
    if (C.applyRemoteConfig) C.applyRemoteConfig({});
    requestAnimationFrame(function() {
      if (C.syncBarTheme) C.syncBarTheme();
    });
    window.addEventListener("morphAppOrder", render);
    window.addEventListener("morphLanguage", render);
    new MutationObserver(render).observe(document.getElementById("favourites"), { childList: true });
    document.addEventListener("focusin", function(e) {
      if (e.target.closest("header")) {
        feed.scrollTop = 0;
        return;
      }
      if (!feed.contains(e.target)) return;
      var a = e.target.getBoundingClientRect(), b = feed.getBoundingClientRect();
      if (a.bottom > b.bottom - 20) feed.scrollTop += a.bottom - b.bottom + 20;
      if (a.top < b.top + 20) feed.scrollTop -= b.top - a.top + 20;
    });
  }
  if (document.readyState === "complete") initialise();
  else window.addEventListener("load", initialise);
})(window.ClearTV);
