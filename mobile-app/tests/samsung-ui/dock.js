(function(C) {
  "use strict";
  var dock, section, rail, sourceCard, queued = false, startFocused = false, userNavigated = false, pointerActive = false, lastDockKey = "";
  function centerDock(button) {
    if (pointerActive || !dock || !button || !dock.contains(button)) return;
    var left = button.offsetLeft, right = left + button.offsetWidth, margin = 40, visibleLeft = dock.scrollLeft, visibleRight = visibleLeft + dock.clientWidth;
    if (left - margin < visibleLeft) dock.scrollLeft = Math.max(0, left - margin);
    else if (right + margin > visibleRight) dock.scrollLeft = right + margin - dock.clientWidth;
  }
  document.addEventListener("pointerdown", function(e) {
    if (dock && e.target.closest("#favourites>button")) {
      pointerActive = true;
      userNavigated = true;
    }
  }, true);
  ["pointerup", "pointercancel"].forEach(function(name) {
    document.addEventListener(name, function() {
      if (!pointerActive) return;
      pointerActive = false;
      setTimeout(function() {
        centerDock(document.activeElement);
      }, 0);
    }, true);
  });
  C.DockArrow = function(code, current) {
    if (code !== 37 && code !== 39 || !dock || !current || current.parentNode !== dock) return false;
    var buttons = Array.prototype.filter.call(dock.children, function(e) {
      return e.tagName === "BUTTON" && !e.hidden && !e.disabled && e.offsetWidth;
    });
    var index = buttons.indexOf(current);
    if (index < 0) return false;
    var next = index + (code === 39 ? 1 : -1);
    if (next >= 0 && next < buttons.length) C.Focus.focus(buttons[next]);
    return true;
  };
  function initialDock() {
    if (startFocused || userNavigated || !dock || document.documentElement.classList.contains("theme-starting") || document.getElementById("view-home").hidden) return;
    var overlay = document.getElementById("overlay");
    if (overlay && !overlay.hidden) return;
    var choices = Array.prototype.slice.call(dock.querySelectorAll(".favourite:not(.add-favourite)"));
    var first = choices.filter(function(b) {
      var app = C.Catalog.get(b.getAttribute("data-favourite-id"));
      return app && (/local\.tvmorph\.tv\.play/.test(app.id) || /^TVM[- ]IPTV$/i.test(app.name));
    })[0] || choices[0];
    if (!first) return;
    startFocused = true;
    C.Focus.focus(first);
    centerDock(first);
  }
  document.addEventListener("keydown", function(e) {
    if ([13, 27, 37, 38, 39, 40, 10009].indexOf(e.keyCode) >= 0) userNavigated = true;
  }, true);
  document.addEventListener("focusin", function(e) {
    var button = dock && e.target.closest("#favourites>button");
    if (button) {
      lastDockKey = button.getAttribute("data-favourite-id") || button.id;
      centerDock(button);
    }
  });
  C.restoreHomeDock = function() {
    if (!dock) return;
    refresh();
    var buttons = Array.prototype.slice.call(dock.querySelectorAll("button"));
    var target = buttons.filter(function(b) {
      return (b.getAttribute("data-favourite-id") || b.id) === lastDockKey && !b.hidden;
    })[0] || buttons.filter(function(b) {
      return !b.hidden;
    })[0];
    if (target) C.Focus.focus(target);
  };
  window.addEventListener("resize", function() {
    centerDock(document.activeElement);
  });
  new MutationObserver(function() {
    if (!document.documentElement.classList.contains("theme-starting")) setTimeout(initialDock, 0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  var words = { ar: ["\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0645\u0624\u062E\u0631\u064B\u0627", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0644\u064A \u062A\u0641\u062A\u062D\u0647\u0627 \u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627", "\u0627\u0641\u062A\u064F\u062A\u062D \u0645\u0624\u062E\u0631\u064B\u0627"], en: ["Recently used", "Apps you open will appear here", "Opened recently"], fr: ["Applications r\xE9centes", "Vos applications ouvertes appara\xEEtront ici", "Ouverte r\xE9cemment"], zh: ["\u6700\u8FD1\u4F7F\u7528", "\u6253\u5F00\u7684\u5E94\u7528\u5C06\u663E\u793A\u5728\u8FD9\u91CC", "\u6700\u8FD1\u6253\u5F00"], ja: ["\u6700\u8FD1\u4F7F\u3063\u305F\u30A2\u30D7\u30EA", "\u958B\u3044\u305F\u30A2\u30D7\u30EA\u304C\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059", "\u6700\u8FD1\u4F7F\u7528"] };
  var hdmiWords = { ar: ["\u0622\u062E\u0631 \u0645\u0635\u062F\u0631 HDMI", "\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0635\u062F\u0631 HDMI", "\u0627\u0641\u062A\u062D \u0645\u062F\u062E\u0644\u064B\u0627 \u0645\u0646 Morph TV \u0623\u0648\u0644\u064B\u0627", "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0635\u062F\u0631"], en: ["Last HDMI source", "Choose HDMI input", "Open an input from Morph TV first", "Return to input"], fr: ["Derni\xE8re source HDMI", "Choisir une entr\xE9e HDMI", "Ouvrez une entr\xE9e depuis Morph TV", "Revenir \xE0 la source"], zh: ["\u4E0A\u6B21 HDMI \u6765\u6E90", "\u9009\u62E9 HDMI \u8F93\u5165", "\u8BF7\u5148\u4ECE Morph TV \u6253\u5F00\u8F93\u5165", "\u8FD4\u56DE\u8F93\u5165"], ja: ["\u6700\u5F8C\u306E HDMI \u5165\u529B", "HDMI \u5165\u529B\u3092\u9078\u629E", "Morph TV \u304B\u3089\u5165\u529B\u3092\u958B\u3044\u3066\u304F\u3060\u3055\u3044", "\u5165\u529B\u306B\u623B\u308B"] };
  C.rememberHdmi = function(source) {
    if (!source || source.type !== "HDMI" || !(Number(source.number) > 0)) return;
    var value = { type: "HDMI", number: Number(source.number), id: typeof source.id === "string" ? source.id.slice(0, 400) : "", title: typeof source.title === "string" ? source.title.slice(0, 80) : "" };
    C.write("lastHdmi", value);
    schedule();
  };
  function lastSource() {
    try {
      if (window.TVNative && TVNative.lastInputJson) {
        var value = JSON.parse(TVNative.lastInputJson());
        if (value && value.type === "HDMI") return value;
      }
    } catch (e) {
    }
    return C.read("lastHdmi", null);
  }
  function paintSource() {
    if (!sourceCard) return;
    var w = hdmiWords[window.MorphLocale ? MorphLocale.get() : "en"] || hdmiWords.en, last = lastSource();
    sourceCard.querySelector("small").textContent = w[0];
    sourceCard.querySelector("strong").textContent = last ? "HDMI " + last.number : w[1];
    sourceCard.querySelector("em").textContent = last ? last.title || w[3] : w[2];
    sourceCard.setAttribute("aria-label", w[0] + ": " + (last ? "HDMI " + last.number : w[1]));
  }
  var inputsChanged = C.inputsChanged;
  C.inputsChanged = function(state) {
    if (inputsChanged) inputsChanged(state);
    if (state && state.current && state.current.type === "HDMI") C.rememberHdmi(state.current);
    paintSource();
  };
  function labels() {
    return words[window.MorphLocale ? MorphLocale.get() : "en"] || words.en;
  }
  function refresh() {
    queued = false;
    if (!section) return;
    paintSource();
    if (dock && !document.getElementById("dock-hdmi")) {
      var input = C.el("button", "app-card dock-hdmi");
      input.id = "dock-hdmi";
      input.setAttribute("aria-label", "HDMI / Live TV");
      input.innerHTML = '<img class="app-icon" src="assets/tvm-hdmi.svg" alt=""><span class="app-name">HDMI / Live TV</span>';
      input.onclick = function() {
        C.showView("inputs");
      };
      dock.insertBefore(input, dock.firstChild);
    }
    var w = labels();
    section.dir = window.MorphLocale && MorphLocale.get() === "ar" ? "rtl" : "ltr";
    section.querySelector("h2").textContent = w[0];
    rail.textContent = "";
    var apps = C.read("recent", []).map(function(id) {
      return C.Catalog.get(id);
    }).filter(function(app) {
      return app && (C.settings.showPrayer !== false || app.id !== "local.tvmorph.tv.prayer");
    }).slice(0, 5);
    section.querySelector("p").hidden = apps.length > 0;
    section.querySelector("p").textContent = w[1];
    apps.forEach(function(app) {
      var card = C.el("button", "recent-app-card");
      card.dataset.appId = app.id;
      card.appendChild(C.Catalog.icon(app));
      var copy = C.el("span", "recent-app-copy");
      copy.appendChild(C.el("strong", "", app.name));
      copy.appendChild(C.el("small", "", w[2]));
      card.appendChild(copy);
      card.onclick = function() {
        C.Catalog.launch(app);
      };
      rail.appendChild(card);
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(function() {
      refresh();
      initialDock();
      if (dock && dock.contains(document.activeElement)) centerDock(document.activeElement);
    }, 0);
  }
  var write = C.write;
  C.write = function(key, value) {
    var result = write.apply(this, arguments);
    if (key === "recent") schedule();
    return result;
  };
  function magnify(button) {
    if (!dock) return;
    var buttons = Array.prototype.filter.call(dock.children, function(n) {
      return n.tagName === "BUTTON" && !n.hidden;
    }), i = buttons.indexOf(button);
    buttons.forEach(function(b, index) {
      b.classList.toggle("dock-neighbor", i >= 0 && Math.abs(index - i) === 1);
    });
  }
  window.addEventListener("load", function() {
    var home = document.getElementById("view-home");
    dock = document.getElementById("favourites");
    dock.classList.add("app-dock");
    home.appendChild(dock);
    document.body.classList.add("dock-home");
    section = C.el("section", "recent-apps-section");
    section.setAttribute("data-no-translate", "");
    section.appendChild(C.el("h2"));
    section.appendChild(C.el("p"));
    rail = C.el("div", "recent-apps-rail");
    rail.setAttribute("data-scroll", "horizontal");
    rail.dir = "ltr";
    section.appendChild(rail);
    sourceCard = C.el("button", "last-hdmi-card");
    sourceCard.id = "home-last-hdmi";
    sourceCard.innerHTML = C.icon("tv") + '<span><small></small><strong dir="ltr"></strong><em></em></span>';
    sourceCard.onclick = function() {
      var last = lastSource();
      if (!last) {
        C.showView("inputs");
        return;
      }
      if (C.Prayer && !C.Prayer.allowLaunch()) return;
      var source = C.Inputs.state.sources.filter(function(s) {
        return last.id ? s.id === last.id : s.type === "HDMI" && s.number === last.number;
      })[0];
      if (!source) {
        C.Inputs.load();
        C.showView("inputs");
        return;
      }
      C.Inputs.watch(source);
    };
    section.appendChild(sourceCard);
    home.appendChild(section);
    dock.addEventListener("focusin", function(e) {
      magnify(e.target.closest("button"));
    });
    dock.addEventListener("focusout", function() {
      setTimeout(function() {
        magnify(document.activeElement.closest("#favourites>button"));
      }, 0);
    });
    dock.addEventListener("mouseover", function(e) {
      magnify(e.target.closest("button"));
    });
    dock.addEventListener("mouseleave", function() {
      magnify(document.activeElement.closest("#favourites>button"));
    });
    new MutationObserver(schedule).observe(dock, { childList: true });
    refresh();
  });
  window.addEventListener("morphLanguage", schedule);
  window.addEventListener("morphViewer", schedule);
  window.addEventListener("morphAppOrder", schedule);
  window.addEventListener("focus", schedule);
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) schedule();
  });
  C.refreshRecentApps = schedule;
})(window.ClearTV);
