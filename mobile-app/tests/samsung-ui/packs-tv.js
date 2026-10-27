(function(C) {
  "use strict";
  var P = window.ThemePacks, overlay, previous;
  var words = { en: ["Theme packs", "Download", "Downloaded", "Remove", "Close", "Download failed. Check internet and retry.", "Packs are free during preview. Download once on each TV; available offline afterwards.", "Download theme pack", "Storage unavailable or full. Remove a pack and retry."], ar: ["\u062D\u0632\u0645 \u0627\u0644\u062B\u064A\u0645\u0627\u062A", "\u062A\u0646\u0632\u064A\u0644", "\u062A\u0645 \u0627\u0644\u062A\u0646\u0632\u064A\u0644", "\u0625\u0632\u0627\u0644\u0629", "\u0625\u063A\u0644\u0627\u0642", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u0646\u0632\u064A\u0644. \u0631\u0627\u062C\u0639 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0648\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.", "\u0627\u0644\u062D\u0632\u0645 \u0645\u062C\u0627\u0646\u064A\u0629 \u0641\u064A \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629. \u0646\u0632\u0651\u0644\u0647\u0627 \u0645\u0631\u0629 \u0639\u0644\u0649 \u0643\u0644 \u062A\u0644\u0641\u0632\u064A\u0648\u0646\u061B \u0648\u062A\u0634\u062A\u063A\u0644 \u0628\u0639\u062F\u0647\u0627 \u0628\u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A.", "\u062A\u0646\u0632\u064A\u0644 \u062D\u0632\u0645\u0629 \u0627\u0644\u062B\u064A\u0645", "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0623\u0648 \u0645\u0645\u062A\u0644\u0626\u0629. \u0623\u0632\u0644 \u062D\u0632\u0645\u0629 \u0648\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649."], fr: ["Packs de th\xE8mes", "T\xE9l\xE9charger", "T\xE9l\xE9charg\xE9", "Supprimer", "Fermer", "\xC9chec du t\xE9l\xE9chargement. V\xE9rifiez Internet et r\xE9essayez.", "Packs gratuits en aper\xE7u. T\xE9l\xE9chargez une fois par TV, puis utilisez-les hors ligne.", "T\xE9l\xE9charger le pack", "Stockage indisponible ou plein. Supprimez un pack."], zh: ["\u4E3B\u9898\u5305", "\u4E0B\u8F7D", "\u5DF2\u4E0B\u8F7D", "\u79FB\u9664", "\u5173\u95ED", "\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u5E76\u91CD\u8BD5\u3002", "\u9884\u89C8\u671F\u95F4\u514D\u8D39\u3002\u6BCF\u53F0\u7535\u89C6\u4E0B\u8F7D\u4E00\u6B21\uFF0C\u4E4B\u540E\u53EF\u79BB\u7EBF\u4F7F\u7528\u3002", "\u4E0B\u8F7D\u4E3B\u9898\u5305", "\u5B58\u50A8\u4E0D\u53EF\u7528\u6216\u5DF2\u6EE1\uFF0C\u8BF7\u79FB\u9664\u4E00\u4E2A\u4E3B\u9898\u5305\u3002"], ja: ["\u30C6\u30FC\u30DE\u30D1\u30C3\u30AF", "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9", "\u53D6\u5F97\u6E08\u307F", "\u524A\u9664", "\u9589\u3058\u308B", "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3067\u304D\u307E\u305B\u3093\u3002\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\u30D7\u30EC\u30D3\u30E5\u30FC\u4E2D\u306F\u7121\u6599\u3067\u3059\u3002\u30C6\u30EC\u30D3\u3054\u3068\u306B\u4E00\u5EA6\u53D6\u5F97\u3059\u308C\u3070\u30AA\u30D5\u30E9\u30A4\u30F3\u3067\u4F7F\u3048\u307E\u3059\u3002", "\u30C6\u30FC\u30DE\u30D1\u30C3\u30AF\u3092\u53D6\u5F97", "\u4FDD\u5B58\u9818\u57DF\u3092\u5229\u7528\u3067\u304D\u306A\u3044\u304B\u7A7A\u304D\u5BB9\u91CF\u304C\u3042\u308A\u307E\u305B\u3093\u3002"] };
  function t(i) {
    return (words[window.MorphLocale ? MorphLocale.get() : "en"] || words.en)[i];
  }
  C.downloadThemePack = function(id, done) {
    P.download(id).then(function() {
      if (done) done();
      else C.toast(t(2));
    }).catch(function(e) {
      C.toast(/storage/i.test(e.message) ? t(8) : t(5));
    });
  };
  function draw() {
    if (!overlay) return;
    var active = document.activeElement && document.activeElement.getAttribute("data-pack-action"), id = document.activeElement && document.activeElement.getAttribute("data-pack-id");
    overlay.querySelector("h2").textContent = t(0);
    overlay.querySelector("p").textContent = t(6);
    var list = overlay.querySelector(".pack-list");
    list.textContent = "";
    P.list.forEach(function(pack) {
      var state = P.status(pack.id), row = C.el("article", "pack-row"), label = C.el("div");
      label.appendChild(C.el("strong", "", P.title(pack.id)));
      label.appendChild(C.el("small", "", Math.round(pack.bytes / 1024) + " KB \xB7 " + pack.themes.length + " themes"));
      row.appendChild(label);
      var b = C.el("button", "primary", state.state === "downloading" ? state.percent + "%" : state.installed ? t(2) : t(1));
      if (state.state === "downloading" && window.MorphProgress) b.innerHTML = MorphProgress.svg(state.percent) + "<span>" + state.percent + "%</span>";
      b.disabled = state.installed || state.state === "downloading";
      b.setAttribute("data-pack-id", pack.id);
      b.setAttribute("data-pack-action", "download");
      b.onclick = function() {
        C.downloadThemePack(pack.id);
      };
      row.appendChild(b);
      if (state.installed) {
        var remove = C.el("button", "", t(3));
        remove.setAttribute("data-pack-id", pack.id);
        remove.setAttribute("data-pack-action", "remove");
        remove.onclick = function() {
          P.remove(pack.id).then(function() {
            if (pack.themes.indexOf(C.settings.theme) >= 0) C.applyRemoteConfig({ theme: "blue" });
          }).catch(function() {
            C.toast(t(8));
          });
        };
        row.appendChild(remove);
      }
      list.appendChild(row);
    });
    overlay.querySelector(".pack-close").textContent = t(4);
    if (active && id) {
      var target = overlay.querySelector('[data-pack-id="' + id + '"][data-pack-action="' + active + '"]');
      if (target && !target.disabled) C.Focus.focus(target);
    }
  }
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    C.Focus.setScope(document);
    C.Focus.focus(previous);
    document.removeEventListener("keydown", back, true);
  }
  function back(e) {
    if (e.keyCode === 27 || e.keyCode === 10009) {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    }
  }
  function open() {
    if (overlay) return;
    previous = document.activeElement;
    overlay = C.el("div", "overlay");
    overlay.id = "theme-packs-overlay";
    overlay.setAttribute("data-no-translate", "");
    overlay.innerHTML = '<section class="modal pack-dialog" role="dialog" aria-modal="true"><h2></h2><p></p><div class="pack-list"></div><button class="pack-close primary"></button></section>';
    document.body.appendChild(overlay);
    overlay.querySelector(".pack-close").onclick = close;
    draw();
    C.Focus.setScope(overlay);
    C.Focus.first();
    document.addEventListener("keydown", back, true);
  }
  var homeButton;
  var originalApply = C.applyRemoteConfig;
  C.applyRemoteConfig = function(value) {
    var result = originalApply(value);
    if (homeButton) {
      var pack = P.forTheme(C.settings.theme);
      homeButton.hidden = !pack || P.status(pack.id).installed;
    }
    return result;
  };
  function changed() {
    if (C.applyRemoteConfig) C.applyRemoteConfig({});
    document.querySelectorAll(".theme-option.ahly img").forEach(function(img) {
      img.src = P.src("assets/al-ahly.png");
    });
    if (homeButton) {
      var pack = P.forTheme(C.settings.theme);
      homeButton.hidden = !pack || P.status(pack.id).installed;
      homeButton.textContent = pack ? t(7) + " \xB7 " + P.title(pack.id) : t(0);
    }
    draw();
  }
  window.addEventListener("morphPacks", changed);
  window.addEventListener("morphLanguage", function() {
    if (settings) settings.textContent = t(0) + " \u2192";
    changed();
  });
  var settings;
  window.addEventListener("load", function() {
    var panel = document.querySelector("#view-settings .settings-panel:last-child");
    settings = C.el("button", "setting", t(0) + " \u2192");
    settings.setAttribute("data-no-translate", "");
    settings.onclick = open;
    if (panel) panel.insertBefore(settings, panel.firstChild);
    homeButton = C.el("button", "", t(7));
    homeButton.id = "home-download-pack";
    homeButton.setAttribute("data-no-translate", "");
    homeButton.onclick = open;
    document.getElementById("view-home").appendChild(homeButton);
    changed();
  });
  P.ready.then(function() {
    var pack = P.forTheme(C.settings.theme);
    if (pack && !P.status(pack.id).installed && !C.settings.artImage && !(C.settings.slideshowEnabled && C.settings.backgroundImages && C.settings.backgroundImages.length)) {
      P.download(pack.id).catch(function() {
        C.toast(t(5));
      });
    }
    changed();
  });
})(window.ClearTV);
