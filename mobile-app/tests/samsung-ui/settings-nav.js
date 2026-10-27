(function(C) {
  "use strict";
  var root, grid, menu, panels = {}, active = "";
  var rows = { ar: ["\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629", "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629", "\u0627\u0644\u0637\u0642\u0633 \u0648\u0627\u0644\u0648\u0642\u062A", "\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A"], en: ["Prayer times", "General settings", "Weather & time", "Back to Settings"], fr: ["Pri\xE8res", "Param\xE8tres g\xE9n\xE9raux", "M\xE9t\xE9o et heure", "Retour aux param\xE8tres"], zh: ["\u793C\u62DC\u65F6\u95F4", "\u5E38\u89C4\u8BBE\u7F6E", "\u5929\u6C14\u4E0E\u65F6\u95F4", "\u8FD4\u56DE\u8BBE\u7F6E"], ja: ["\u793C\u62DD\u6642\u523B", "\u4E00\u822C\u8A2D\u5B9A", "\u5929\u6C17\u3068\u6642\u523B", "\u8A2D\u5B9A\u306B\u623B\u308B"] }, keys = ["prayer", "general", "time"];
  function paint() {
    var w = rows[window.MorphLocale ? MorphLocale.get() : "en"] || rows.en;
    keys.forEach(function(k, i) {
      var b = document.getElementById("settings-category-" + k + "-entry");
      if (b) b.querySelector("strong").textContent = w[i];
      var back = document.querySelector("#settings-category-" + k + ">button");
      if (back) back.textContent = w[3];
    });
  }
  function home() {
    if (!root) return;
    active = "";
    root.classList.remove("prayer-settings-mode");
    menu.hidden = false;
    keys.forEach(function(k) {
      panels[k].hidden = true;
    });
    root.scrollTop = 0;
    if (C.Prayer) C.Prayer.settingsEntered();
  }
  function open(key) {
    active = key;
    menu.hidden = true;
    keys.forEach(function(k) {
      panels[k].hidden = k !== key;
    });
    root.scrollTop = 0;
    if (key === "prayer" && C.Prayer && C.Prayer.showSettings) C.Prayer.showSettings();
    else C.Focus.focus(panels[key].querySelector("button"));
  }
  function arrow(code, current) {
    if (code !== 38 && code !== 40 || active !== "general" && active !== "time" || !root || root.hidden) return false;
    var area = panels[active];
    if (!current || !area.contains(current)) return false;
    var entries = Array.prototype.filter.call(area.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled])"), function(e) {
      return e.tabIndex !== -1 && e.offsetWidth > 0 && e.offsetHeight > 0 && !e.closest("[hidden]");
    });
    var index = entries.indexOf(current);
    if (index < 0) return false;
    var next = index + (code === 40 ? 1 : -1);
    if (next < 0) C.Focus.focus(document.getElementById("nav-settings"));
    else if (next < entries.length) C.Focus.focus(entries[next]);
    return true;
  }
  C.SettingsNav = { arrow, home, open, back: function() {
    if (!root || root.hidden || !active) return false;
    var key = active;
    home();
    C.Focus.focus(document.getElementById("settings-category-" + key + "-entry"));
    return true;
  } };
  window.addEventListener("load", function() {
    root = document.getElementById("view-settings");
    grid = root.querySelector(".settings-grid");
    var existing = Array.prototype.slice.call(grid.children);
    menu = C.el("div", "settings-category-menu");
    menu.id = "settings-categories-menu";
    menu.setAttribute("data-no-translate", "");
    var icons = ["moon", "settings", "clock"];
    keys.forEach(function(key, index) {
      var entry = C.el("button", "settings-category-entry");
      entry.id = "settings-category-" + key + "-entry";
      entry.innerHTML = C.icon(icons[index]) + "<strong></strong>";
      entry.onclick = function() {
        open(key);
      };
      menu.appendChild(entry);
      var area = C.el("section", "settings-category-panel");
      area.id = "settings-category-" + key;
      area.hidden = true;
      var back = C.el("button", "secondary");
      back.setAttribute("data-no-translate", "");
      back.onclick = function() {
        C.SettingsNav.back();
      };
      area.appendChild(back);
      grid.appendChild(area);
      panels[key] = area;
    });
    root.insertBefore(menu, grid);
    existing.forEach(function(panel) {
      if (panel.id === "prayer-settings-section") panels.prayer.appendChild(panel);
      else if (panel.querySelector("#setting-clock")) panels.time.appendChild(panel);
      else panels.general.appendChild(panel);
    });
    paint();
    home();
  });
  window.addEventListener("morphLanguage", paint);
})(window.ClearTV);
