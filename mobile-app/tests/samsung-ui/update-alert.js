(function() {
  "use strict";
  var tv = !!window.ClearTV, shown = false, box, previous;
  if (tv) return;
  function installedVersion() {
    var value = document.body.getAttribute("data-build-version") || "";
    try {
      if (tv && typeof TVNative === "undefined" && window.tizen && tizen.application) {
        var nativeVersion = tizen.application.getCurrentApplication().appInfo.version;
        if (nativeVersion) value = nativeVersion;
      }
    } catch (e) {
    }
    var match = /^(\d+\.\d+\.\d+)(?:[-+].*)?$/.exec(String(value));
    return match ? match[1] : "";
  }
  function ar() {
    return (window.MorphLocale ? MorphLocale.get() : document.documentElement.lang) === "ar";
  }
  function newer(a, b) {
    var x = String(a).split("."), y = String(b).split(".");
    for (var i = 0; i < 3; i++) {
      var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
      if (d) return d > 0;
    }
    return false;
  }
  function enabled() {
    try {
      return localStorage.getItem("tvmorph.updateAlerts") !== "off";
    } catch (e) {
      return true;
    }
  }
  function close() {
    if (box) {
      box.remove();
      box = null;
    }
    if (previous && document.documentElement.contains(previous)) previous.focus();
  }
  function show(v) {
    if (shown || !enabled()) return;
    var overlay = document.getElementById("overlay");
    if (tv && (document.documentElement.classList.contains("theme-starting") || overlay && !overlay.hidden || document.body.classList.contains("watching"))) return setTimeout(function() {
      show(v);
    }, 3e3);
    shown = true;
    previous = document.activeElement;
    box = document.createElement("div");
    box.id = "release-alert";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.style.cssText = "position:fixed;z-index:2000;inset:0;background:#070e20dc;display:flex;align-items:center;justify-content:center;padding:24px";
    var card = document.createElement("section");
    card.style.cssText = "width:" + (tv ? "800" : "420") + "px;max-width:100%;padding:32px;border-radius:24px;background:#172a46;color:white;border:1px solid #9cc8ff;font:" + (tv ? "26" : "18") + "px Arial;line-height:1.6";
    card.dir = ar() ? "rtl" : "ltr";
    var title = document.createElement("h2");
    title.textContent = ar() ? "\u062A\u062D\u062F\u064A\u062B \u062C\u062F\u064A\u062F \u0644\u0640 Morph TV" : "Morph TV update available";
    var p = document.createElement("p");
    p.textContent = (ar() ? "\u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u062C\u062F\u064A\u062F: " : "New version: ") + v + ". " + (tv ? ar() ? "\u062D\u062F\u0651\u062B \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644\u060C \u062B\u0645 \u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0648\u0627\u0636\u063A\u0637 \u0627\u0644\u062A\u062B\u0628\u064A\u062A / \u0627\u0644\u062A\u062D\u062F\u064A\u062B." : "Update the phone app, select your TV, then choose Install / Update." : ar() ? "\u0646\u0632\u0651\u0644 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u062B\u0628\u0651\u062A\u0647\u0627 \u0644\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0637\u0628\u064A\u0642." : "Download and install the new version.");
    card.appendChild(title);
    card.appendChild(p);
    if (!tv) {
      var link = document.createElement("a");
      link.href = "https://morphtv.zainbot.com/download/phone";
      link.onclick = function(e) {
        if (typeof ClearNative !== "undefined" && ClearNative.openPhoneUpdate) {
          e.preventDefault();
          ClearNative.openPhoneUpdate();
        }
      };
      link.textContent = ar() ? "\u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u062A\u062D\u062F\u064A\u062B" : "Download update";
      link.style.cssText = "display:block;padding:12px;color:white;background:#315f97;border-radius:12px;text-align:center";
      card.appendChild(link);
    }
    var later = document.createElement("button");
    later.textContent = ar() ? "\u0644\u0627\u062D\u0642\u064B\u0627" : "Later";
    later.style.cssText = "font:inherit;margin-top:18px;padding:12px 28px;background:#304461;color:white;border:1px solid white;border-radius:12px";
    later.onclick = close;
    card.appendChild(later);
    box.appendChild(card);
    document.body.appendChild(box);
    later.focus();
    box.addEventListener("keydown", function(e) {
      if (["Escape", "Backspace", "BrowserBack"].indexOf(e.key) >= 0 || e.keyCode === 10009 || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (tv && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].indexOf(e.key) >= 0) {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          close();
        }
      }
    }, true);
  }
  function check() {
    var current = installedVersion();
    if (!enabled() || shown || !current) return;
    var x = new XMLHttpRequest();
    x.open("GET", "https://morphtv.zainbot.com/catalog.json?t=" + Date.now(), true);
    x.timeout = 8e3;
    x.onload = function() {
      try {
        if (x.status === 200) {
          var data = JSON.parse(x.responseText);
          var id = tv ? typeof TVNative !== "undefined" ? "android" : "samsung" : "phone";
          var row = (data.platforms || []).filter(function(p) {
            return p.id === id;
          })[0];
          var v = row ? row.version : data.latest;
          if (/^\d+\.\d+\.\d+$/.test(v) && newer(v, current)) show(v);
        }
      } catch (e) {
      }
    };
    x.onerror = x.ontimeout = function() {
    };
    x.send();
  }
  function setup() {
    var target = tv ? document.querySelector("#settings-category-general .settings-panel") : document.querySelector("#page-connect");
    if (!target && !tv) target = document.querySelector("main");
    if (target) {
      let paint = function() {
        button.textContent = (ar() ? "\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u062A\u062D\u062F\u064A\u062B: " : "Update alerts: ") + (enabled() ? ar() ? "\u0645\u0641\u0639\u0651\u0644\u0629" : "On" : ar() ? "\u0645\u063A\u0644\u0642\u0629" : "Off");
      };
      var button = document.createElement("button");
      button.id = "setting-update-alerts";
      button.className = tv ? "setting" : "secondary";
      button.onclick = function() {
        try {
          localStorage.setItem("tvmorph.updateAlerts", enabled() ? "off" : "on");
        } catch (e) {
        }
        paint();
      };
      paint();
      target.appendChild(button);
    }
    setTimeout(check, 1800);
  }
  window.MorphUpdates = { newer, check, installedVersion };
  window.addEventListener("load", setup);
})();
