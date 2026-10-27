(function(w) {
  "use strict";
  var html = document.documentElement;
  html.classList.add("theme-starting");
  function reveal() {
    html.classList.remove("theme-starting");
    html.setAttribute("data-theme-ready", "true");
  }
  function prepare() {
    var C = w.ClearTV;
    if (!C || !C.applyRemoteConfig) {
      reveal();
      return;
    }
    var finished = false, timer;
    function done() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reveal();
    }
    function apply() {
      if (finished) return;
      C.applyRemoteConfig({});
      var image = document.querySelector("#cinema-background>img"), backdrop = document.getElementById("cinema-background");
      if (image && backdrop && C.settings.theme !== "blue" && /twilight-entertainment-v4/.test(image.getAttribute("src") || "")) backdrop.hidden = true;
      if (!image || !backdrop || backdrop.hidden || image.complete) {
        done();
        return;
      }
      image.addEventListener("load", done);
      image.addEventListener("error", done);
    }
    timer = setTimeout(function() {
      var image = document.querySelector("#cinema-background>img");
      if (image && !image.complete) image.style.visibility = "hidden";
      done();
    }, 5e3);
    Promise.resolve(w.ThemePacks ? w.ThemePacks.displayReady || w.ThemePacks.ready : null).then(function() {
      setTimeout(apply, 0);
    }, function() {
      setTimeout(apply, 0);
    });
  }
  window.addEventListener("DOMContentLoaded", prepare);
  setTimeout(function() {
    if (html.classList.contains("theme-starting")) reveal();
  }, 7e3);
})(window);
