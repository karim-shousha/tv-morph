(function(C) {
  "use strict";
  var scope = document, lastKey = 0;
  function list() {
    var selector = 'button:not([disabled]):not([tabindex="-1"]),input:not([disabled]),select:not([disabled])', roots = [scope], choices = [];
    if (scope === document) {
      var active = document.querySelector("main>.view:not([hidden])"), header = document.querySelector("main>header");
      if (active) {
        roots = header ? [header] : [];
        if (active.id === "view-home" && document.body.classList.contains("dock-home")) {
          Array.prototype.forEach.call(active.querySelectorAll(".home-tools,#favourites,.recent-apps-section,.section-heading,#home-next-prayer,#home-download-pack"), function(root) {
            roots.push(root);
          });
        } else roots.push(active);
      }
    }
    roots.forEach(function(root) {
      if (root.nodeType === 1 && root.matches(selector)) choices.push(root);
      Array.prototype.forEach.call(root.querySelectorAll(selector), function(e) {
        if (choices.indexOf(e) < 0) choices.push(e);
      });
    });
    return choices.filter(function(e) {
      return e.offsetWidth > 0 && e.offsetHeight > 0 && !e.closest("[hidden]");
    });
  }
  function rect(e) {
    var r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }
  function focus(e) {
    if (!e) {
      return;
    }
    try {
      e.focus({ preventScroll: true });
    } catch (error) {
      e.focus();
    }
    var rail = e.closest("[data-scroll]");
    if (rail) {
      var a = e.getBoundingClientRect(), b = rail.getBoundingClientRect();
      if (a.left < b.left + 10) {
        rail.scrollLeft -= b.left + 10 - a.left;
      }
      if (a.right > b.right - 10) {
        rail.scrollLeft += a.right - b.right + 10;
      }
      if (a.top < b.top + 10) {
        rail.scrollTop -= b.top + 10 - a.top;
      }
      if (a.bottom > b.bottom - 10) {
        rail.scrollTop += a.bottom - b.bottom + 10;
      }
    }
    var homeFeed = document.querySelector("#view-home .home-feed");
    if (homeFeed && e.closest("header")) homeFeed.scrollTop = 0;
    var main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
      main.scrollLeft = 0;
    }
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
    window.scrollTo(0, 0);
  }
  function move(code) {
    var current = document.activeElement;
    if (C.DockArrow && C.DockArrow(code, current)) return;
    if (C.SettingsNav && C.SettingsNav.arrow(code, current)) return;
    var choices = list();
    if ((code === 38 || code === 40) && current && current.closest("#view-home") && !current.closest(".home-tools")) choices = choices.filter(function(e) {
      return !e.closest(".home-tools");
    });
    if (C.catalogArrow && C.catalogArrow(code, current)) {
      return;
    }
    if (choices.indexOf(current) < 0) {
      focus(choices[0]);
      return;
    }
    var a = rect(current), best = null, score = Infinity, horizontal = code === 37 || code === 39;
    choices.forEach(function(e) {
      if (e === current) {
        return;
      }
      var b = rect(e), dx = b.x - a.x, dy = b.y - a.y;
      if (code === 37 && dx >= -2 || code === 39 && dx <= 2 || code === 38 && dy >= -2 || code === 40 && dy <= 2) {
        return;
      }
      var primary = horizontal ? Math.abs(dx) : Math.abs(dy), perp = horizontal ? Math.abs(dy) : Math.abs(dx);
      var overlap = horizontal ? Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) : Math.min(a.right, b.right) - Math.max(a.left, b.left);
      var cost = primary + perp * 3 + (overlap > 0 ? 0 : 700);
      if (cost < score) {
        score = cost;
        best = e;
      }
    });
    focus(best);
  }
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
      C.keyboardVisible = false;
    }
  });
  document.addEventListener("input", function(e) {
    if (e.target && e.target.type !== "range") C.keyboardVisible = true;
  });
  C.Focus = { setScope: function(root) {
    scope = root || document;
  }, focus, first: function() {
    focus(list()[0]);
  }, list };
  document.addEventListener("keydown", function(e) {
    var code = e.keyCode;
    if (code === 10009 || code === 27) {
      e.preventDefault();
      C.back();
      return;
    }
    var active = document.activeElement;
    if (active && active.tagName === "INPUT" && active.type === "range" && code >= 37 && code <= 40) {
      e.preventDefault();
      if (code === 38 || code === 40) {
        C.keyboardVisible = false;
        move(code);
      } else {
        var step = Number(active.step) || 1, min = Number(active.min) || 0, max = Number(active.max) || 100;
        active.value = Math.max(min, Math.min(max, Number(active.value) + (code === 39 ? step : -step)));
        active.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return;
    }
    var editing = active && active.tagName === "INPUT";
    if (editing) {
      if ((code === 38 || code === 40) && !C.keyboardVisible) {
        e.preventDefault();
        move(code);
        return;
      }
      if (code === 65376 || code === 65385) {
        e.preventDefault();
        C.keyboardVisible = false;
        focus(document.getElementById(document.activeElement.id === "app-search" ? "search-installed" : "city-search"));
        return;
      }
      if (code === 13) {
        e.preventDefault();
        if (document.activeElement.id === "app-search") {
          document.getElementById("search-installed").click();
        } else if (document.activeElement.id === "city-input") {
          document.getElementById("city-search").click();
        }
      }
      return;
    }
    if (code >= 37 && code <= 40) {
      e.preventDefault();
      var now = Date.now();
      if (e.repeat && now - lastKey < 90) {
        return;
      }
      lastKey = now;
      move(code);
    }
    if (code === 13 && document.activeElement && document.activeElement.tagName === "BUTTON") {
      e.preventDefault();
      document.activeElement.click();
    }
  });
  document.addEventListener("focusin", function(e) {
    if (e.target && e.target.tagName === "BUTTON") {
      var label = e.target.getAttribute("aria-label");
      if (label) {
        document.getElementById("focus-hint").textContent = label;
      }
    }
  });
})(window.ClearTV);
