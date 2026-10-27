(function() {
  "use strict";
  window.addEventListener("load", function() {
    var C = window.ClearTV, mini = document.createElement("div");
    mini.id = "radio-mini";
    mini.hidden = true;
    mini.setAttribute("data-no-translate", "");
    mini.innerHTML = '<button class="radio-mini-open"></button><button class="radio-mini-toggle"></button><button class="radio-mini-stop"></button>';
    document.body.appendChild(mini);
    function media() {
      return window.SamsungMedia || window.MorphMedia;
    }
    function stop() {
      if (window.TVNative && TVNative.radioStop) TVNative.radioStop();
      else if (media()) media().radioStop();
      mini.hidden = true;
    }
    function text(ar, en) {
      return window.MorphLocale ? MorphLocale.t(ar, en) : en;
    }
    mini.querySelector(".radio-mini-open").onclick = function() {
      if (window.TVNative && TVNative.radio) TVNative.radio("");
      else if (media()) media().open("radio");
    };
    mini.querySelector(".radio-mini-toggle").onclick = function() {
      if (window.TVNative && TVNative.radioToggle) TVNative.radioToggle();
      else if (media()) media().radioControl();
    };
    mini.querySelector(".radio-mini-stop").onclick = stop;
    window.addEventListener("morphAudioExclusive", stop);
    function paint() {
      try {
        var state = window.TVNative && TVNative.radioStatus ? JSON.parse(TVNative.radioStatus()) : media() ? media().radioStatus() : null;
        mini.hidden = !state || !state.active;
        if (mini.hidden) return;
        mini.querySelector(".radio-mini-open").textContent = "\u266B " + (state.name || text("\u0627\u0644\u0631\u0627\u062F\u064A\u0648 \u0634\u063A\u0627\u0644", "Radio playing"));
        mini.querySelector(".radio-mini-toggle").textContent = state.state === "playing" ? text("\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A", "Pause") : text("\u062A\u0634\u063A\u064A\u0644", "Play");
        mini.querySelector(".radio-mini-stop").textContent = text("\u0625\u064A\u0642\u0627\u0641", "Stop");
      } catch (e) {
        mini.hidden = true;
      }
    }
    setInterval(paint, 1e3);
    paint();
  });
})();
