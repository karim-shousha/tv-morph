(function(C) {
  "use strict";
  var opened = null;
  var labels = { ar: ["\u0645\u0642\u0641\u0648\u0644", "\u0645\u0641\u062A\u0648\u062D", "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638", "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064A", "\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ", "\u0628\u062F\u0648\u0646 \u062D\u062F \u0632\u0645\u0646\u064A", " \u062F\u0642\u064A\u0642\u0629", "\u0627\u062E\u062A\u0631 \u0627\u0644\u0642\u0641\u0644 \u0623\u0648 \u0627\u0644\u0648\u0642\u062A \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0641\u0642\u0637."], en: ["Locked", "Unlocked", "Saved", "Change app PIN", "Time remaining: ", "No time limit", " min", "Manage the lock and time for this app only."], fr: ["Verrouill\xE9e", "D\xE9verrouill\xE9e", "Enregistr\xE9", "Modifier le PIN", "Temps restant : ", "Aucune limite", " min", "G\xE9rez le verrou et le temps de cette application."], zh: ["\u5DF2\u9501\u5B9A", "\u672A\u9501\u5B9A", "\u5DF2\u4FDD\u5B58", "\u66F4\u6539\u5E94\u7528 PIN", "\u5269\u4F59\u65F6\u957F\uFF1A", "\u4E0D\u9650\u5236\u65F6\u957F", " \u5206\u949F", "\u4EC5\u7BA1\u7406\u6B64\u5E94\u7528\u7684\u9501\u548C\u65F6\u957F\u3002"], ja: ["\u30ED\u30C3\u30AF\u4E2D", "\u89E3\u9664\u6E08\u307F", "\u4FDD\u5B58\u3057\u307E\u3057\u305F", "\u30A2\u30D7\u30EA PIN \u3092\u5909\u66F4", "\u6B8B\u308A\u6642\u9593: ", "\u6642\u9593\u5236\u9650\u306A\u3057", " \u5206", "\u3053\u306E\u30A2\u30D7\u30EA\u306E\u30ED\u30C3\u30AF\u3068\u6642\u9593\u3092\u7BA1\u7406\u3057\u307E\u3059\u3002"] };
  C.AppActions = { open: function(tile, waitForRelease) {
    if (opened) return;
    var id = tile && (tile.getAttribute("data-favourite-id") || tile.getAttribute("data-app-id"));
    if (!id) return;
    var app = C.Catalog.get(id);
    if (!app) return;
    var old = document.activeElement, overlay = C.el("div", "overlay app-actions-overlay"), panel = C.el("section", "modal app-actions-panel"), language = window.MorphLocale ? MorphLocale.get() : "en", words = labels[language] || labels.en, w = FamilyScreens.words(language), held = !!waitForRelease, last = "", first = true;
    opened = overlay;
    panel.setAttribute("data-no-translate", "");
    panel.dir = language === "ar" ? "rtl" : "ltr";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.appendChild(C.el("h2", "", app.name));
    var status = C.el("p", "app-actions-status"), time = C.el("p", "app-actions-time"), saved = C.el("p", "app-actions-saved");
    saved.setAttribute("role", "status");
    panel.appendChild(status);
    panel.appendChild(time);
    panel.appendChild(C.el("p", "muted", words[7]));
    panel.appendChild(saved);
    overlay.appendChild(panel);
    function close() {
      if (!opened) return;
      opened = null;
      clearInterval(poll);
      overlay.remove();
      C.Focus.setScope(document);
      C.Focus.focus(old);
      document.removeEventListener("keydown", keys, true);
      document.removeEventListener("keyup", release, true);
    }
    function keys(e) {
      if (e.keyCode === 13 && (held || e.repeat)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      } else if ((e.keyCode === 27 || e.keyCode === 10009) && document.activeElement.closest(".app-actions-overlay")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    }
    function release(e) {
      if (e.keyCode === 13) held = false;
    }
    function action(label, key) {
      var b = C.el("button", "setting", label);
      b.onclick = function() {
        if (held) return;
        if (window.TVNative && typeof TVNative[key] === "function") TVNative[key](id);
        else if (C.ParentControls && C.ParentControls[key]) C.ParentControls[key](id);
      };
      panel.appendChild(b);
      return b;
    }
    var lock = action(w[5], "appPin"), unlock = action(w[6], "appUnlock");
    action(w[7], "appTime");
    if (tile.hasAttribute("data-favourite-id") || tile.closest(".home-shelf-rail")) {
      var move = C.el("button", "setting", w[8]);
      move.onclick = function() {
        close();
        C.AppReorder.start();
      };
      panel.appendChild(move);
    }
    var cancel = C.el("button", "secondary", w[9]);
    cancel.onclick = close;
    panel.appendChild(cancel);
    function paint() {
      var data = null;
      try {
        if (window.TVNative && typeof TVNative.appParentalState === "function") data = JSON.parse(TVNative.appParentalState(id));
        else if (C.ParentControls && C.ParentControls.state) data = C.ParentControls.state(id);
      } catch (e) {
      }
      if (!data) return;
      var signature = JSON.stringify(data);
      if (signature === last) return;
      status.textContent = (data.locked ? "\u{1F512} " : "") + words[data.locked ? 0 : 1];
      status.classList.toggle("is-locked", !!data.locked);
      time.textContent = data.remainingMs < 0 ? words[5] : words[4] + Math.ceil(data.remainingMs / 6e4) + words[6];
      lock.textContent = data.locked ? words[3] : w[5];
      var unlockFocused = document.activeElement === unlock;
      unlock.hidden = !data.locked;
      if (unlock.hidden && unlockFocused) C.Focus.focus(lock);
      if (!first) saved.textContent = words[2] + " \xB7 " + words[data.locked ? 0 : 1];
      first = false;
      last = signature;
    }
    document.body.appendChild(overlay);
    C.Focus.setScope(overlay);
    paint();
    C.Focus.first();
    document.addEventListener("keydown", keys, true);
    document.addEventListener("keyup", release, true);
    var poll = setInterval(paint, 400);
  } };
})(window.ClearTV);
