(function(C) {
  "use strict";
  var moving = "", scope = "", timer = null, held = null, long = false, suppress = false;
  function card(node) {
    return node && node.closest && node.closest("#favourites [data-favourite-id],.home-shelf-rail [data-app-id],#catalog .launch-tile[data-app-id],.recent-app-card[data-app-id]");
  }
  function id(tile) {
    return tile.getAttribute(scope === "pins" ? "data-favourite-id" : "data-app-id");
  }
  function tiles() {
    return Array.prototype.slice.call(document.querySelectorAll(scope === "pins" ? "#favourites [data-favourite-id]" : ".home-shelf-rail [data-app-id]"));
  }
  function find() {
    return tiles().filter(function(e) {
      return id(e) === moving;
    })[0];
  }
  function orderApps() {
    var order = C.read("app-order", []);
    C.Catalog.apps.sort(function(a, b) {
      var x = order.indexOf(a.id), y = order.indexOf(b.id);
      return (x < 0 ? order.length : x) - (y < 0 ? order.length : y);
    });
  }
  function paint() {
    document.querySelectorAll(".reordering").forEach(function(e) {
      e.classList.remove("reordering");
    });
    var tile = find();
    if (tile) {
      tile.classList.add("reordering");
      C.Focus.focus(tile);
    }
  }
  function start(tile) {
    if (!tile) return;
    scope = tile.hasAttribute("data-favourite-id") ? "pins" : "apps";
    moving = id(tile);
    var hint = document.getElementById("reorder-hint");
    if (!hint) {
      hint = C.el("div", "", "");
      hint.id = "reorder-hint";
      document.body.appendChild(hint);
    }
    hint.hidden = false;
    hint.textContent = document.documentElement.lang === "ar" ? "Move \xB7 \u062A\u062D\u0631\u064A\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u2190 \u2192 \xB7 OK \u0644\u0644\u062D\u0641\u0638 \xB7 \u0631\u062C\u0648\u0639 \u0644\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062A\u0631\u062A\u064A\u0628" : "Move \xB7 \u2190 \u2192 Move app \xB7 OK to save \xB7 Back to finish";
    paint();
  }
  function finish() {
    moving = "";
    scope = "";
    document.querySelectorAll(".reordering").forEach(function(e) {
      e.classList.remove("reordering");
    });
    var hint = document.getElementById("reorder-hint");
    if (hint) hint.hidden = true;
  }
  function move(code) {
    var tile = find();
    if (!tile) {
      finish();
      return;
    }
    var r = tile.getBoundingClientRect(), target = null;
    tiles().forEach(function(e) {
      var x = e.getBoundingClientRect().left - r.left;
      if ((code === 37 && x < 0 || code === 39 && x > 0) && (!target || Math.abs(x) < Math.abs(target.getBoundingClientRect().left - r.left))) target = e;
    });
    if (!target) return;
    var ids = scope === "pins" ? C.getRemoteState().pins : C.Catalog.apps.map(function(a2) {
      return a2.id;
    }), a = ids.indexOf(moving), b = ids.indexOf(id(target));
    if (a < 0 || b < 0) return;
    ids.splice(a, 1);
    ids.splice(b, 0, moving);
    if (scope === "pins") C.setRemotePins(ids);
    else {
      C.write("app-order", ids);
      orderApps();
      window.dispatchEvent(new Event("morphAppOrder"));
    }
    paint();
  }
  function stop(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  document.addEventListener("keydown", function(e) {
    var code = e.keyCode, tile = card(document.activeElement);
    if (moving) {
      stop(e);
      if (code === 13 && (held || e.repeat)) return;
      suppress = false;
      if (code === 37 || code === 39) move(code);
      else if (code === 13 || code === 27 || code === 10009) finish();
      return;
    }
    if (code === 13 && tile) {
      stop(e);
      if (e.repeat || held) return;
      suppress = false;
      held = tile;
      long = false;
      timer = setTimeout(function() {
        long = true;
        if (C.AppActions) C.AppActions.open(held, true);
        else start(held);
      }, 650);
    }
  }, true);
  document.addEventListener("keyup", function(e) {
    if (e.keyCode !== 13 || !held) return;
    if (long) {
      e.preventDefault();
      e.stopPropagation();
    } else stop(e);
    clearTimeout(timer);
    var tile = held;
    held = null;
    if (long) suppress = true;
    else if (!moving) tile.click();
  }, true);
  document.addEventListener("pointerdown", function(e) {
    var tile = card(e.target);
    if (!tile || e.button !== 0) return;
    if (moving) {
      suppress = false;
      return;
    }
    suppress = false;
    clearTimeout(timer);
    timer = setTimeout(function() {
      suppress = true;
      if (C.AppActions) C.AppActions.open(tile);
      else start(tile);
    }, 650);
  });
  ["pointerup", "pointercancel"].forEach(function(name) {
    document.addEventListener(name, function() {
      clearTimeout(timer);
    });
  });
  document.addEventListener("click", function(e) {
    if (card(e.target) && (suppress || moving)) {
      stop(e);
      if (suppress) {
        suppress = false;
        return;
      }
      finish();
    }
  }, true);
  window.addEventListener("blur", function() {
    clearTimeout(timer);
    held = null;
  });
  var back = C.back;
  C.back = function() {
    if (moving) {
      finish();
      return;
    }
    return back.apply(C, arguments);
  };
  C.AppReorder = { start: function() {
    start(card(document.activeElement));
  }, finish, orderApps };
})(window.ClearTV);
