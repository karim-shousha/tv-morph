(function(C) {
  "use strict";
  window.addEventListener("load", function() {
    if (!window.TVNative || !TVNative.maintenance) return;
    var parent = document.getElementById("settings-category-general");
    if (!parent) return;
    var b = C.el("button", "setting");
    b.id = "setting-maintenance";
    function label() {
      b.textContent = window.MorphLocale ? MorphLocale.t("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u062D\u0629", "Apps & storage") : "Apps & storage";
    }
    b.onclick = function() {
      TVNative.maintenance();
    };
    (parent.querySelector(".settings-panel") || parent).appendChild(b);
    label();
    window.addEventListener("morphLanguage", label);
  });
})(window.ClearTV);
