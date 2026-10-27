(function(C) {
  "use strict";
  C.Remote = { key: function(key) {
    if (key === "FAVORITE" && C.AppReorder) {
      C.AppReorder.start();
      return { sent: true };
    }
    var codes = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, RETURN: 27 };
    if (key === "HOME") {
      document.getElementById("nav-home").click();
      return { sent: true };
    }
    if (!codes[key]) return { sent: false, error: "This key is not supported inside Morph TV." };
    var event = new Event("keydown", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "keyCode", { value: codes[key] });
    (document.activeElement || document).dispatchEvent(event);
    if (key === "ENTER") {
      var up = new Event("keyup", { bubbles: true, cancelable: true });
      Object.defineProperty(up, "keyCode", { value: 13 });
      (document.activeElement || document).dispatchEvent(up);
    }
    return { sent: true };
  }, text: function(text) {
    var target = document.activeElement;
    if (!target || !["INPUT", "TEXTAREA"].includes(target.tagName) || ["password", "checkbox", "radio", "range", "color"].includes(target.type)) return { sent: false, error: "\u0627\u0641\u062A\u062D \u062E\u0627\u0646\u0629 \u0643\u062A\u0627\u0628\u0629 \u062F\u0627\u062E\u0644 Morph TV \u0639\u0644\u0649 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0627\u0644\u0623\u0648\u0644." };
    var max = Math.min(target.maxLength > 0 ? target.maxLength : 500, 500);
    target.value = String(text).slice(0, max);
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return { sent: true };
  } };
})(window.ClearTV);
