(function() {
  "use strict";
  function fit() {
    if (document.body.getAttribute("data-fixed-layout") !== "true") return;
    var w = document.documentElement.clientWidth, h = document.documentElement.clientHeight, s = Math.min(w / 1920, h / 1080);
    if (!s) return;
    document.body.style.width = "1920px";
    document.body.style.height = "1080px";
    document.body.style.position = "absolute";
    document.body.style.transformOrigin = "0 0";
    document.body.style.transform = "scale(" + s + ")";
    document.body.style.left = Math.max(0, (w - 1920 * s) / 2) + "px";
    document.body.style.top = Math.max(0, (h - 1080 * s) / 2) + "px";
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
})();
