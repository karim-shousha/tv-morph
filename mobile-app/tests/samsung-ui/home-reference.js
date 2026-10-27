(function(C) {
  "use strict";
  function reflect() {
    var dock = document.getElementById("favourites");
    if (!dock) return;
    Array.prototype.forEach.call(dock.children, function(button) {
      if (button.querySelector(".dock-reflection")) return;
      var icon = button.querySelector(".app-icon,.plus-icon");
      if (!icon) return;
      var reflection = document.createElement("span");
      reflection.className = "dock-reflection";
      reflection.setAttribute("aria-hidden", "true");
      reflection.appendChild(icon.cloneNode(true));
      button.appendChild(reflection);
    });
  }
  function title() {
    var root = document.documentElement;
    function scale(key) {
      return Math.max(70, Math.min(120, Number(C.settings[key]) || 100)) / 100;
    }
    root.style.setProperty("--reference-title-size", 64 * scale("heroTitleSize") + "px");
    root.style.setProperty("--reference-subtitle-size", 30 * scale("heroSubtitleSize") + "px");
    var heading = document.querySelector(".club-hero h1");
    if (!heading || heading.querySelector(".home-title-accent") || C.settings.customTitle || C.settings.theme !== "blue") return;
    var value = heading.textContent, part = value.indexOf(".");
    if (part < 0) return;
    heading.textContent = "";
    heading.appendChild(document.createTextNode(value.slice(0, part + 1) + " "));
    var accent = document.createElement("span");
    accent.className = "home-title-accent";
    accent.textContent = value.slice(part + 1).trim();
    heading.appendChild(accent);
  }
  window.addEventListener("load", function() {
    reflect();
    title();
    new MutationObserver(reflect).observe(document.getElementById("favourites"), { childList: true });
    new MutationObserver(title).observe(document.querySelector(".club-hero h1"), { childList: true });
  });
})(window.ClearTV);
