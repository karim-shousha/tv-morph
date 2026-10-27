(function(w) {
  "use strict";
  function svg(percent) {
    var known = typeof percent === "number", value = known ? Math.max(0, Math.min(100, Math.round(percent))) : 0;
    return '<span class="morph-progress' + (known ? "" : " indeterminate") + '" role="progressbar" aria-valuemin="0" aria-valuemax="100"' + (known ? ' aria-valuenow="' + value + '"' : "") + '><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="progress-track" cx="22" cy="22" r="18"/><circle class="progress-value" cx="22" cy="22" r="18" stroke-dasharray="113.1" stroke-dashoffset="' + (known ? 113.1 * (1 - value / 100) : 82) + '"/></svg><b>' + (known ? value + "%" : "") + "</b></span>";
  }
  var spinner = document.getElementById("spinner"), operation = document.getElementById("operation"), message = document.getElementById("operation-message");
  function update(value) {
    if (!spinner) return;
    spinner.classList.add("ring-host");
    spinner.innerHTML = svg(value);
  }
  w.MorphProgress = { svg, update };
  if (operation) {
    new MutationObserver(function() {
      if (!operation.hidden) update();
    }).observe(operation, { attributes: true, attributeFilter: ["hidden"] });
    new MutationObserver(function() {
      var match = message.textContent.match(/(\d{1,3})\s*[%٪]/);
      update(match ? Number(match[1]) : void 0);
    }).observe(message, { childList: true, subtree: true, characterData: true });
    w.addEventListener("morphPacks", function() {
      if (operation.hidden || !w.ThemePacks) return;
      var active = ThemePacks.list.filter(function(p) {
        return ThemePacks.status(p.id).state === "downloading";
      })[0];
      if (active) update(ThemePacks.status(active.id).percent);
    });
    update();
  }
})(window);
