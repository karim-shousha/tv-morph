(function(C) {
  "use strict";
  var labels = { en: ["App locks \xB7 PIN \u2192", "Create a PIN (4\u20136 digits)", "Enter your PIN", "Continue", "Close", "Incorrect PIN", "Choose apps to lock", "Change PIN", "Locked", "Unlocked"], ar: ["\u0642\u0641\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0628\u0631\u0642\u0645 \u0633\u0631\u064A \u2192", "\u0623\u0646\u0634\u0626 \u0631\u0642\u0645\u064B\u0627 \u0633\u0631\u064A\u064B\u0627 \u0645\u0646 \u0664 \u0625\u0644\u0649 \u0666 \u0623\u0631\u0642\u0627\u0645", "\u0627\u0643\u062A\u0628 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064A", "\u0645\u062A\u0627\u0628\u0639\u0629", "\u0625\u063A\u0644\u0627\u0642", "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D", "\u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0644\u064A \u0647\u062A\u0642\u0641\u0644\u0647\u0627", "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064A", "\u0645\u0642\u0641\u0648\u0644", "\u0645\u0641\u062A\u0648\u062D"], fr: ["Verrouillage des applications \xB7 PIN \u2192", "Cr\xE9er un PIN (4\u20136 chiffres)", "Saisir le PIN", "Continuer", "Fermer", "PIN incorrect", "Choisir les applications \xE0 verrouiller", "Modifier le PIN", "Verrouill\xE9e", "D\xE9verrouill\xE9e"], zh: ["\u5E94\u7528\u9501 \xB7 PIN \u2192", "\u8BBE\u7F6E PIN\uFF084\u20136 \u4F4D\u6570\u5B57\uFF09", "\u8F93\u5165 PIN", "\u7EE7\u7EED", "\u5173\u95ED", "PIN \u9519\u8BEF", "\u9009\u62E9\u8981\u9501\u5B9A\u7684\u5E94\u7528", "\u66F4\u6539 PIN", "\u5DF2\u9501\u5B9A", "\u672A\u9501\u5B9A"], ja: ["\u30A2\u30D7\u30EA\u30ED\u30C3\u30AF \xB7 PIN \u2192", "PIN \u3092\u4F5C\u6210\uFF084\uFF5E6 \u6841\uFF09", "PIN \u3092\u5165\u529B", "\u7D9A\u884C", "\u9589\u3058\u308B", "PIN \u304C\u9055\u3044\u307E\u3059", "\u30ED\u30C3\u30AF\u3059\u308B\u30A2\u30D7\u30EA\u3092\u9078\u629E", "PIN \u3092\u5909\u66F4", "\u30ED\u30C3\u30AF\u4E2D", "\u89E3\u9664\u6E08\u307F"] };
  function t(i) {
    return (labels[MorphLocale.get()] || labels.en)[i];
  }
  function read() {
    var d = C.read("samsungAppLocks", { salt: "", hash: "", ids: [] });
    d.ids = d.ids || [];
    d.pins = d.pins || {};
    return d;
  }
  function hash(pin, salt) {
    var text = salt + ":" + pin, bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return C.ThemePacks.hash(bytes.buffer);
  }
  function dialog(title, fill) {
    var old = document.activeElement, overlay = C.el("div", "overlay"), panel = C.el("section", "modal pack-dialog");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("data-no-translate", "");
    panel.appendChild(C.el("h2", "", title));
    overlay.appendChild(panel);
    function close() {
      overlay.remove();
      C.Focus.setScope(old && old.closest && old.closest(".overlay") || document);
      C.Focus.focus(old);
      document.removeEventListener("keydown", back, true);
    }
    function back(e) {
      if (e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    }
    fill(panel, close);
    var cancel = C.el("button", "secondary", t(4));
    cancel.onclick = close;
    panel.appendChild(cancel);
    document.body.appendChild(overlay);
    C.Focus.setScope(overlay);
    C.Focus.focus(panel.querySelector("input,button"));
    document.addEventListener("keydown", back, true);
  }
  function authenticate(done, change, appId) {
    var stored = read(), entry = appId ? stored.pins[appId] || {} : stored, creating = !entry.hash || change;
    dialog(t(creating ? 1 : 2), function(panel, close) {
      var input = C.el("input"), confirm = creating ? C.el("input") : null, error = C.el("p"), busy = false;
      [input, confirm].filter(Boolean).forEach(function(field) {
        field.type = "password";
        field.inputMode = "numeric";
        field.maxLength = 6;
        field.autocomplete = "off";
        field.setAttribute("aria-label", t(creating ? 1 : 2));
        field.style.cssText = "display:block;font-size:32px;padding:15px;margin:12px 0;width:300px;color:#fff;background:#162238;border:1px solid #ffffff70;border-radius:12px";
        panel.appendChild(field);
      });
      if (confirm) confirm.setAttribute("aria-label", extra(1));
      panel.appendChild(error);
      var go = C.el("button", "primary", t(3));
      go.onclick = function() {
        if (busy) return;
        var pin = input.value;
        if (!/^\d{4,6}$/.test(pin)) {
          error.textContent = t(1);
          return;
        }
        var latest = read();
        if (latest.retryAt > Date.now()) {
          error.textContent = extra(2);
          return;
        }
        if (creating) {
          if (confirm.value !== pin) {
            error.textContent = extra(1);
            return;
          }
          var random = new Uint32Array(4);
          if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(random);
          else for (var i = 0; i < 4; i++) random[i] = Math.random() * 4294967295;
          entry = { salt: Array.prototype.join.call(random, "-") };
          entry.hash = hash(pin, entry.salt);
          if (appId) {
            latest.pins[appId] = entry;
            if (latest.ids.indexOf(appId) < 0) latest.ids.push(appId);
          } else {
            latest.salt = entry.salt;
            latest.hash = entry.hash;
          }
          latest.failures = 0;
          latest.retryAt = 0;
          if (!C.write("samsungAppLocks", latest)) {
            error.textContent = extra(3);
            return;
          }
        } else if (hash(pin, entry.salt) !== entry.hash) {
          latest.failures = (latest.failures || 0) + 1;
          if (latest.failures >= 5) {
            latest.failures = 0;
            latest.retryAt = Date.now() + 3e4;
          }
          C.write("samsungAppLocks", latest);
          error.textContent = t(5);
          input.value = "";
          return;
        } else {
          latest.failures = 0;
          latest.retryAt = 0;
          C.write("samsungAppLocks", latest);
        }
        busy = true;
        input.value = "";
        if (confirm) confirm.value = "";
        close();
        done();
      };
      panel.appendChild(go);
    });
  }
  function manage() {
    dialog(extra(0), function(panel, close) {
      C.Catalog.apps.forEach(function(app) {
        var b = C.el("button", "setting", app.name + " \xB7 " + t(read().ids.indexOf(app.id) >= 0 ? 8 : 9));
        b.onclick = function() {
          close();
          dialog(app.name, function(p, end) {
            var w = FamilyScreens.words(MorphLocale.get());
            [[5, "appPin"], [6, "appUnlock"], [7, "appTime"]].forEach(function(row) {
              var action = C.el("button", "setting", w[row[0]]);
              action.onclick = function() {
                end();
                C.ParentControls[row[1]](app.id);
              };
              p.appendChild(action);
            });
          });
        };
        panel.appendChild(b);
      });
      var change = C.el("button", "secondary", t(7));
      change.onclick = function() {
        close();
        authenticate(manage, true);
      };
      panel.appendChild(change);
    });
  }
  var extraLabels = { en: ["Parental controls \u2192", "Confirm the same PIN", "Too many attempts. Wait 30 seconds.", "Could not save. Try again.", "Samsung can time Morph IPTV and Morph Radio inside Morph TV. It cannot interrupt external apps such as YouTube.", "Saved allowance; it does not renew daily.", "No time limit", "Custom minutes (1\u20131440)"], ar: ["\u0627\u0644\u0631\u0642\u0627\u0628\u0629 \u0627\u0644\u0623\u0628\u0648\u064A\u0629 \u2192", "\u0623\u0639\u062F \u0643\u062A\u0627\u0628\u0629 \u0646\u0641\u0633 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064A", "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629. \u0627\u0646\u062A\u0638\u0631 \u0663\u0660 \u062B\u0627\u0646\u064A\u0629.", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062D\u0641\u0638. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u064B\u0627.", "\u0633\u0627\u0645\u0633\u0648\u0646\u062C \u064A\u0642\u062F\u0631 \u064A\u062D\u062F\u062F \u0648\u0642\u062A Morph IPTV \u0648Morph Radio \u062F\u0627\u062E\u0644 Morph TV\u060C \u0644\u0643\u0646\u0647 \u0644\u0627 \u064A\u0642\u062F\u0631 \u064A\u0648\u0642\u0641 \u062A\u0637\u0628\u064A\u0642\u064B\u0627 \u062E\u0627\u0631\u062C\u064A\u064B\u0627 \u0645\u062B\u0644 \u064A\u0648\u062A\u064A\u0648\u0628.", "\u0631\u0635\u064A\u062F \u0648\u0642\u062A \u0645\u062D\u0641\u0648\u0638 \u0644\u0627 \u064A\u062A\u062C\u062F\u062F \u064A\u0648\u0645\u064A\u064B\u0627.", "\u0628\u062F\u0648\u0646 \u062D\u062F \u0632\u0645\u0646\u064A", "\u062F\u0642\u0627\u0626\u0642 \u0645\u062E\u0635\u0651\u0635\u0629 (\u0661\u2013\u0661\u0664\u0664\u0660)"], fr: ["Contr\xF4le parental \u2192", "Confirmez le m\xEAme PIN", "Trop de tentatives. Attendez 30 secondes.", "\xC9chec de sauvegarde. R\xE9essayez.", "Samsung peut limiter Morph IPTV et Morph Radio dans Morph TV, mais ne peut pas interrompre les applications externes comme YouTube.", "Temps conserv\xE9, sans renouvellement quotidien.", "Aucune limite", "Minutes personnalis\xE9es (1\u20131440)"], zh: ["\u5BB6\u957F\u63A7\u5236 \u2192", "\u518D\u6B21\u8F93\u5165\u76F8\u540C PIN", "\u5C1D\u8BD5\u8FC7\u591A\uFF0C\u8BF7\u7B49\u5F85 30 \u79D2\u3002", "\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002", "\u4E09\u661F\u53EF\u9650\u5236 Morph TV \u5185\u7684 Morph IPTV \u548C Morph Radio\uFF0C\u65E0\u6CD5\u4E2D\u65AD YouTube \u7B49\u5916\u90E8\u5E94\u7528\u3002", "\u65F6\u957F\u4F1A\u4FDD\u5B58\uFF0C\u4E0D\u4F1A\u6BCF\u5929\u81EA\u52A8\u91CD\u7F6E\u3002", "\u4E0D\u9650\u5236\u65F6\u957F", "\u81EA\u5B9A\u4E49\u5206\u949F\u6570\uFF081\u20131440\uFF09"], ja: ["\u4FDD\u8B77\u8005\u306B\u3088\u308B\u7BA1\u7406 \u2192", "\u540C\u3058 PIN \u3092\u518D\u5165\u529B", "\u8A66\u884C\u56DE\u6570\u304C\u591A\u3059\u304E\u307E\u3059\u300230 \u79D2\u5F85\u3063\u3066\u304F\u3060\u3055\u3044\u3002", "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "Samsung \u306F Morph TV \u5185\u306E Morph IPTV \u3068 Morph Radio \u3092\u5236\u9650\u3067\u304D\u307E\u3059\u304C\u3001YouTube \u306A\u3069\u306E\u5916\u90E8\u30A2\u30D7\u30EA\u3092\u4E2D\u65AD\u3067\u304D\u307E\u305B\u3093\u3002", "\u6B8B\u308A\u6642\u9593\u306F\u4FDD\u5B58\u3055\u308C\u3001\u6BCE\u65E5\u66F4\u65B0\u3055\u308C\u307E\u305B\u3093\u3002", "\u6642\u9593\u5236\u9650\u306A\u3057", "\u5206\u6570\u3092\u6307\u5B9A\uFF081\uFF5E1440\uFF09"] };
  function extra(i) {
    return (extraLabels[MorphLocale.get()] || extraLabels.en)[i];
  }
  function valid(id) {
    return !!C.Catalog.get(id);
  }
  function internal(id) {
    return id === "local.tvmorph.tv.play" || id === "local.tvmorph.tv.radio";
  }
  function budgets() {
    return C.read("samsungTimeAllowances", {});
  }
  var active = "", last = 0, timeScreen = null, mediaGrant = "";
  function elapsed() {
    var now = performance.now();
    if (active && last) {
      var all = budgets();
      if (typeof all[active] === "number" && all[active] > 0) {
        all[active] = Math.max(0, all[active] - (now - last));
        C.write("samsungTimeAllowances", all);
      }
    }
    last = now;
  }
  function timeUp(id) {
    if (timeScreen) return;
    SamsungMedia.exit(true);
    active = "";
    var app = C.Catalog.get(id);
    function home() {
      if (timeScreen) timeScreen.remove();
      timeScreen = null;
      C.Focus.setScope(document);
      C.Focus.first();
    }
    timeScreen = FamilyScreens.timeUp({ language: MorphLocale.get(), name: app ? app.name : "Morph TV", home, parents: function() {
      authenticate(function() {
        configure(id, function() {
          home();
        });
      });
    } });
  }
  function allowed(id) {
    if (budgets()[id] === 0) {
      timeUp(id);
      return false;
    }
    return true;
  }
  function configure(id, done) {
    dialog(FamilyScreens.words(MorphLocale.get())[7], function(panel, close) {
      if (!internal(id)) {
        panel.appendChild(C.el("p", "", extra(4)));
        return;
      }
      panel.appendChild(C.el("p", "", extra(5)));
      function save(minutes) {
        elapsed();
        var all = budgets();
        if (minutes === 0) delete all[id];
        else all[id] = minutes * 6e4;
        if (!C.write("samsungTimeAllowances", all)) return;
        close();
        if (done) done();
      }
      var none = C.el("button", "setting", extra(6));
      none.onclick = function() {
        save(0);
      };
      panel.appendChild(none);
      [15, 30, 60].forEach(function(n) {
        var b = C.el("button", "setting", n + " min");
        b.onclick = function() {
          save(n);
        };
        panel.appendChild(b);
      });
      var input = C.el("input");
      input.type = "number";
      input.min = 1;
      input.max = 1440;
      input.setAttribute("aria-label", extra(7));
      input.placeholder = extra(7);
      panel.appendChild(input);
      var custom = C.el("button", "setting", extra(7));
      custom.onclick = function() {
        var n = Number(input.value);
        if (n >= 1 && n <= 1440 && Math.floor(n) === n) save(n);
      };
      panel.appendChild(custom);
    });
  }
  C.ParentControls = { state: function(id) {
    return { locked: read().ids.indexOf(id) >= 0, remainingMs: typeof budgets()[id] === "number" ? budgets()[id] : -1 };
  }, appPin: function(id) {
    if (valid(id)) authenticate(function() {
      authenticate(function() {
      }, true, id);
    });
  }, appUnlock: function(id) {
    if (valid(id)) authenticate(function() {
      var d = read();
      d.ids = d.ids.filter(function(x) {
        return x !== id;
      });
      delete d.pins[id];
      C.write("samsungAppLocks", d);
    });
  }, appTime: function(id) {
    if (valid(id)) authenticate(function() {
      configure(id);
    });
  }, mediaStarted: function(id) {
    elapsed();
    active = id;
    last = performance.now();
  }, mediaStopped: function() {
    elapsed();
    active = "";
  }, mediaGuard: function(id, retry) {
    if (!allowed(id)) return false;
    if (mediaGrant === id) {
      mediaGrant = "";
      return true;
    }
    var d = read();
    if (d.ids.indexOf(id) >= 0) {
      authenticate(function() {
        mediaGrant = id;
        retry();
      }, false, d.pins[id] ? id : null);
      return false;
    }
    return true;
  } };
  var launch = C.Catalog.launch;
  C.Catalog.launch = function(app) {
    var self = this;
    if (!app) return;
    function go() {
      if (allowed(app.id)) launch.call(self, app);
    }
    if (!internal(app.id) && read().ids.indexOf(app.id) >= 0) {
      authenticate(go, false, read().pins[app.id] ? app.id : null);
      return;
    }
    return go();
  };
  setInterval(function() {
    if (!active) return;
    if (document.hidden) {
      last = performance.now();
      return;
    }
    elapsed();
    if (budgets()[active] === 0) timeUp(active);
  }, 1e3);
  document.addEventListener("visibilitychange", function() {
    if (document.hidden) elapsed();
    else last = performance.now();
  });
  window.addEventListener("load", function() {
    var panel = document.querySelector("#view-settings .settings-panel:last-child"), button = C.el("button", "setting");
    button.id = "setting-app-locks";
    button.setAttribute("data-no-translate", "");
    function paint() {
      button.textContent = extra(0);
    }
    paint();
    button.onclick = function() {
      authenticate(manage);
    };
    panel.appendChild(button);
    window.addEventListener("morphLanguage", paint);
  });
})(window.ClearTV);
