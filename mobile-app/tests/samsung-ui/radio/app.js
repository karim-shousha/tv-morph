(function() {
  "use strict";
  var bridge = window.RadioNative, stations = bridge ? JSON.parse(bridge.catalogJson()) : [], favorites = bridge ? JSON.parse(bridge.favoritesJson()) : [], filter = "all", query = "", selected = "", playing = false, currentState = "stopped", engine = "native", hold = null, held = null, heldLong = false, suppress = 0;
  var audio = document.getElementById("audio"), wait = null;
  function t(ar, en) {
    return MorphLocale.t(ar, en);
  }
  function name(s) {
    return t(s.name, s.nameEn || s.name);
  }
  function art(s) {
    var palette = { quran_cairo: ["#0ba786", "#08776d"], quran_mishary_alafasy: ["#46b5a0", "#236d83"], quran_tafsir: ["#c29440", "#785f35"], nagham_fm_1053: ["#ff8a51", "#e14f71"], nogoum_fm: ["#ad73f8", "#664ec3"], elradio_9090: ["#4dacf5", "#285dc8"], groove_salad: ["#58b873", "#25817c"], secret_agent: ["#d770ab", "#824f91"] };
    var colors = palette[s.id] || (s.category === "FM" ? ["#578dde", "#6152aa"] : ["#28ac9f", "#28748e"]);
    var q = s.category !== "FM" && s.category !== "Sports", path = q ? '<path d="M5 10c5-2 9-1 11 1 3-2 7-3 12-1v18c-5-2-9-1-12 1-3-2-7-3-12-1zM16 11v18M9 15h3M9 20h3M21 15h3M21 20h3"/>' : '<rect x="4" y="12" width="25" height="18" rx="4"/><path d="m9 12 17-8M8 17h17M21 22h4M21 26h4"/><circle cx="12" cy="24" r="4"/>';
    return { background: "linear-gradient(140deg," + colors[0] + "," + colors[1] + ")", html: '<svg viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + path + "</svg>" };
  }
  function fitCards() {
    var root = document.getElementById("stations");
    if (!root || !root.clientHeight) return;
    var groups = root.querySelectorAll(".station-group"), rows = 0;
    Array.prototype.forEach.call(groups, function(g) {
      rows += Math.ceil(g.querySelectorAll(".station").length / (g.dataset.group === "fm" ? 5 : g.dataset.group === "sports" ? 4 : 3));
    });
    var overhead = 24 + groups.length * 32 + Math.max(0, groups.length - 1) * 14 + Math.max(0, rows - groups.length) * 20;
    root.style.setProperty("--radio-card-height", Math.max(120, Math.min(218, Math.floor((root.clientHeight - overhead) / Math.max(1, rows)))) + "px");
  }
  window.addEventListener("resize", fitCards);
  window.addEventListener("load", fitCards);
  function syncControls() {
    var toggle2 = document.getElementById("toggle");
    toggle2.disabled = !selected;
    document.getElementById("retry").disabled = !selected;
    toggle2.textContent = playing ? t("\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A", "Pause") : t("\u062A\u0634\u063A\u064A\u0644", "Play");
    document.getElementById("retry").textContent = t("\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644", "Reconnect");
    document.querySelector(".hero-orbit span").textContent = playing ? "ON AIR" : "RADIO";
  }
  function status(text) {
    document.getElementById("status").textContent = text;
  }
  function render() {
    var root = document.getElementById("stations"), scroll = root.scrollTop;
    root.textContent = "";
    var shown = stations.filter(function(s) {
      var matches = filter === "all" || filter === "quran" && s.category === "\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645" || filter === "fm" && s.category === "FM" || filter === "sports" && s.category === "Sports" || filter === "favorites" && favorites.indexOf(s.id) >= 0;
      return matches && (!query || (s.name + " " + (s.nameEn || "")).toLowerCase().indexOf(query) >= 0);
    });
    document.getElementById("count").textContent = shown.length + " " + t("\u0645\u062D\u0637\u0629", "stations");
    root.dataset.empty = query ? t("\u0645\u0641\u064A\u0634 \u0645\u062D\u0637\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0628\u062D\u062B.", "No stations match your search.") : t("\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0641\u0627\u0636\u064A\u0629. \u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0651\u0644\u064B\u0627 \u0639\u0644\u0649 \u0645\u062D\u0637\u0629 \u0644\u0625\u0636\u0627\u0641\u062A\u0647\u0627.", "No favorites yet. Hold OK on a station to add it.");
    ["quran", "fm", "sports"].forEach(function(group) {
      var rows = shown.filter(function(s) {
        return group === "sports" ? s.category === "Sports" : group === "fm" ? s.category === "FM" : s.category === "\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645";
      });
      if (!rows.length) return;
      var section = document.createElement("section");
      section.className = "station-group";
      section.dataset.group = group;
      var heading = document.createElement("h3");
      heading.textContent = group === "sports" ? t("\u0645\u062D\u0637\u0627\u062A \u0631\u064A\u0627\u0636\u064A\u0629", "Sports radio") : group === "fm" ? t("\u0642\u0646\u0648\u0627\u062A FM", "FM stations") : t("\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645", "Quran stations");
      section.appendChild(heading);
      var grid = document.createElement("div");
      grid.className = "station-grid";
      section.appendChild(grid);
      root.appendChild(section);
      rows.forEach(function(s) {
        var b = document.createElement("button");
        b.className = "station" + (selected === s.id ? " selected" : "");
        b.dataset.id = s.id;
        var icon = document.createElement("span");
        icon.className = "icon";
        var design = art(s);
        icon.innerHTML = design.html;
        icon.style.background = design.background;
        var title = document.createElement("strong");
        title.textContent = name(s);
        var small = document.createElement("small");
        small.textContent = s.available === false ? t("\u0627\u0644\u0628\u062B \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627", "Stream currently unavailable") : s.category === "Sports" ? t("\u0631\u064A\u0627\u0636\u0629 \xB7 \u0645\u0628\u0627\u0634\u0631", "SPORTS \xB7 LIVE") : s.category === "FM" ? "FM \xB7 LIVE" : t("\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \xB7 \u0645\u0628\u0627\u0634\u0631", "QURAN \xB7 LIVE");
        var star = document.createElement("span");
        star.className = "star";
        star.textContent = favorites.indexOf(s.id) >= 0 ? "\u2605" : "\u2606";
        b.append(icon, title, small, star);
        b.onclick = function() {
          if (Date.now() < suppress) return;
          play(s.id);
        };
        b.oncontextmenu = function(e) {
          e.preventDefault();
          favorite(s.id);
        };
        b.onpointerdown = function() {
          hold = setTimeout(function() {
            suppress = Date.now() + 900;
            favorite(s.id);
          }, 650);
        };
        b.onpointerup = b.onpointercancel = function() {
          clearTimeout(hold);
        };
        grid.appendChild(b);
      });
    });
    root.scrollTop = scroll;
    fitCards();
    syncControls();
  }
  function favorite(id) {
    var index = favorites.indexOf(id);
    if (index < 0) favorites.push(id);
    else favorites.splice(index, 1);
    if (bridge) bridge.favorite(id, index < 0);
    render();
    focusId(id);
    status(index < 0 ? t("\u0627\u062A\u0636\u0627\u0641\u062A \u0644\u0644\u0645\u0641\u0636\u0644\u0629", "Added to favorites") : t("\u0627\u062A\u0634\u0627\u0644\u062A \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Removed from favorites"));
  }
  function focusId(id) {
    var target = document.querySelector('[data-id="' + id + '"]');
    if (target) target.focus();
  }
  function play(id) {
    var s = stations.filter(function(s2) {
      return s2.id === id;
    })[0];
    if (!s) return;
    if (s.available === false) {
      status(t("\u0628\u062B \u0623\u0648\u0646 \u0633\u0628\u0648\u0631\u062A \u0627\u0644\u0635\u0648\u062A\u064A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u064B\u0627. \u0627\u062E\u062A\u0631 \u0645\u062D\u0637\u0629 \u0623\u062E\u0631\u0649.", "ON Sport audio stream is currently unavailable. Choose another station."));
      return;
    }
    clearTimeout(wait);
    audio.pause();
    audio.removeAttribute("src");
    selected = id;
    playing = false;
    currentState = "connecting";
    engine = "native";
    document.body.classList.remove("playing");
    var design = art(s), cover = document.querySelector(".station-art");
    cover.innerHTML = design.html;
    cover.style.background = design.background;
    document.getElementById("now-title").textContent = name(s);
    status(t("\u062C\u0627\u0631\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644\u2026", "Connecting\u2026"));
    render();
    focusId(id);
    if (bridge) bridge.play(id);
    else fallback(id, "");
  }
  function fallback(id, reason) {
    if (id !== selected) return;
    var s = stations.filter(function(s2) {
      return s2.id === id;
    })[0];
    engine = "web";
    status(t("\u062C\u0627\u0631\u064A \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0634\u063A\u0651\u0644 \u0627\u0644\u0628\u062F\u064A\u0644\u2026", "Trying alternate player\u2026"));
    audio.removeAttribute("crossorigin");
    audio.src = s.streamUrl;
    audio.load();
    var promise = audio.play();
    if (promise) promise.catch(function() {
      failed(reason);
    });
    clearTimeout(wait);
    wait = setTimeout(function() {
      if (!playing) failed(reason);
    }, 15e3);
  }
  function failed(reason) {
    clearTimeout(wait);
    playing = false;
    currentState = "error";
    document.body.classList.remove("playing");
    syncControls();
    status(t("\u0627\u0644\u0628\u062B \u0645\u0634 \u0645\u062A\u0627\u062D. \u0627\u0641\u062D\u0635 \u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0648\u0627\u0636\u063A\u0637 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.", "Stream unavailable. Check TV Internet and retry.") + (reason ? " \xB7 " + reason : ""));
  }
  audio.onplaying = function() {
    clearTimeout(wait);
    playing = true;
    currentState = "playing";
    document.body.classList.add("playing");
    syncControls();
    document.getElementById("now-label").textContent = t("\u0628\u062B \u0645\u0628\u0627\u0634\u0631", "LIVE RADIO");
    status(t("\u0639\u0644\u0649 \u0627\u0644\u0647\u0648\u0627\u0621 \xB7 \u0627\u062A\u0635\u0627\u0644 \u0645\u0628\u0627\u0634\u0631", "On air \xB7 direct stream"));
  };
  audio.onerror = function() {
    failed("AUDIO " + (audio.error ? audio.error.code : ""));
  };
  function toggle() {
    if (!selected) return;
    if (["stopped", "error", "connecting"].indexOf(currentState) >= 0) {
      status(t("\u0627\u0636\u063A\u0637 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0627\u062F\u064A\u0648 \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629.", "Select Reconnect on the radio page to try playback."));
      return;
    }
    if (engine === "web") {
      if (audio.paused) audio.play().catch(function() {
        failed("");
      });
      else {
        audio.pause();
        playing = false;
        currentState = "paused";
        document.body.classList.remove("playing");
        syncControls();
        status(t("\u0645\u062A\u0648\u0642\u0641 \u0645\u0624\u0642\u062A\u064B\u0627", "Paused"));
      }
    } else if (bridge) bridge.toggle();
  }
  function move(code) {
    var choices = Array.prototype.slice.call(document.querySelectorAll("button:not([disabled]),input:not([disabled])")).filter(function(e) {
      return e.offsetWidth && e.offsetHeight;
    }), current = document.activeElement;
    if (choices.indexOf(current) < 0) {
      choices[0].focus();
      return;
    }
    var a = current.getBoundingClientRect(), best = null, cost = Infinity;
    choices.forEach(function(e) {
      if (e === current) return;
      var b = e.getBoundingClientRect(), dx = b.left + b.width / 2 - a.left - a.width / 2, dy = b.top + b.height / 2 - a.top - a.height / 2;
      if (code === 37 && dx >= 0 || code === 39 && dx <= 0 || code === 38 && dy >= 0 || code === 40 && dy <= 0) return;
      var score = code === 37 || code === 39 ? Math.abs(dx) + Math.abs(dy) * 4 : Math.abs(dy) + Math.abs(dx) * 4;
      if (score < cost) {
        cost = score;
        best = e;
      }
    });
    if (best) {
      best.focus();
      best.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
  document.addEventListener("keydown", function(e) {
    if (e.target.id === "station-search") {
      if (e.keyCode === 40 || e.keyCode === 13) {
        e.preventDefault();
        var first2 = document.querySelector(".station");
        if (first2) first2.focus();
      } else if (e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        if (e.target.value) {
          e.target.value = "";
          query = "";
          render();
        } else document.getElementById("back").focus();
      }
      return;
    }
    if (e.keyCode >= 37 && e.keyCode <= 40) {
      e.preventDefault();
      move(e.keyCode);
    }
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.repeat || held) return;
      held = document.activeElement;
      heldLong = false;
      if (held.dataset.id) hold = setTimeout(function() {
        heldLong = true;
        favorite(held.dataset.id);
      }, 650);
    }
    if (e.keyCode === 27 || e.keyCode === 10009) {
      e.preventDefault();
      if (bridge) bridge.exit();
    }
  });
  document.addEventListener("keyup", function(e) {
    if (e.keyCode === 13 && held) {
      e.preventDefault();
      clearTimeout(hold);
      var b = held;
      held = null;
      if (!heldLong) b.click();
    }
  });
  document.getElementById("back").onclick = function() {
    if (bridge) bridge.exit();
  };
  document.getElementById("toggle").onclick = toggle;
  document.getElementById("stop-radio").onclick = function() {
    if (bridge && bridge.stop) bridge.stop();
    audio.pause();
    audio.removeAttribute("src");
    playing = false;
    selected = "";
    currentState = "stopped";
    document.body.classList.remove("playing");
    render();
    status(t("\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0631\u0627\u062F\u064A\u0648", "Radio stopped"));
  };
  document.getElementById("stop-radio").textContent = t("\u0625\u064A\u0642\u0627\u0641", "Stop");
  document.getElementById("retry").onclick = function() {
    if (selected) play(selected);
  };
  ["all", "quran", "fm", "favorites", "sports"].forEach(function(key, i) {
    var b = document.createElement("button");
    var shapes = ['<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="17" y="4" width="7" height="7" rx="2"/><rect x="4" y="17" width="7" height="7" rx="2"/><rect x="17" y="17" width="7" height="7" rx="2"/>', '<path d="M3 7c4-2 8-1 11 1 4-2 8-3 12-1v17c-5-2-9-1-12 1-4-2-8-3-11-1zM14 8v17"/>', '<rect x="3" y="10" width="23" height="16" rx="4"/><path d="m8 10 16-7M7 16h15"/><circle cx="10" cy="21" r="3"/>', '<path d="m14 2 4 8 9 2-7 6 2 9-8-4-8 4 1-9-6-6 9-2z"/>'];
    b.innerHTML = '<svg viewBox="0 0 29 29" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' + shapes[i % shapes.length] + "</svg><span></span>";
    b.querySelector("span").textContent = [t("\u0643\u0644 \u0627\u0644\u0645\u062D\u0637\u0627\u062A", "All stations"), t("\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645", "Quran"), "FM", t("\u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Favorites"), t("\u0631\u064A\u0627\u0636\u0629", "Sports")][i];
    b.onclick = function() {
      filter = key;
      document.querySelectorAll("#filters button").forEach(function(x) {
        x.classList.remove("active");
      });
      b.classList.add("active");
      render();
    };
    if (i === 0) b.className = "active";
    document.getElementById("filters").appendChild(b);
  });
  document.getElementById("headline").textContent = t("\u0635\u0648\u062A \u064A\u0631\u0627\u0641\u0642 \u064A\u0648\u0645\u0643.", "A soundtrack to your day.");
  document.getElementById("intro").textContent = t("\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645 \u0648\u0631\u064A\u0627\u0636\u0629 \u0648\u0645\u062D\u0637\u0627\u062A FM\u060C \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.", "Quran, sports and FM stations. All in one place.");
  document.getElementById("list-title").textContent = t("\u0627\u062E\u062A\u0627\u0631 \u0645\u062D\u0637\u062A\u0643", "Find your frequency");
  document.getElementById("station-search").placeholder = t("\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u062D\u0637\u0629\u2026", "Search stations\u2026");
  document.getElementById("station-search").setAttribute("aria-label", t("\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0645\u062D\u0637\u0629", "Search stations"));
  document.getElementById("station-search").oninput = function() {
    query = this.value.trim().toLowerCase();
    document.getElementById("stations").scrollTop = 0;
    render();
  };
  document.getElementById("browse-label").textContent = t("\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0631\u0627\u062F\u064A\u0648", "RADIO LIBRARY");
  document.getElementById("favorite-hint").textContent = t("\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0651\u0644\u064B\u0627 \u0639\u0644\u0649 OK \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u0637\u0629 \u0644\u0644\u0645\u0641\u0636\u0644\u0629.", "Hold OK on a station to add it to your favourites.");
  window.RadioUI = { selectStation: play, snapshot: function() {
    return { id: selected, state: currentState, name: document.getElementById("now-title").textContent };
  }, restore: function(value) {
    if (!value || !value.id) return;
    selected = value.id;
    engine = "native";
    var row = stations.filter(function(s) {
      return s.id === selected;
    })[0];
    if (row) {
      var design = art(row), cover = document.querySelector(".station-art");
      cover.innerHTML = design.html;
      cover.style.background = design.background;
      document.getElementById("now-title").textContent = name(row);
    }
    currentState = value.state || "stopped";
    playing = value.state === "playing";
    document.body.classList.toggle("playing", playing);
    render();
    status(value.message || "");
  }, fallback, state: function(id, state, message) {
    if (id !== selected) return;
    currentState = state;
    playing = state === "playing";
    document.body.classList.toggle("playing", playing);
    syncControls();
    document.getElementById("now-label").textContent = playing ? t("\u0628\u062B \u0645\u0628\u0627\u0634\u0631", "LIVE RADIO") : t("\u0627\u0644\u0631\u0627\u062F\u064A\u0648", "RADIO");
    status(message);
  }, stop: function() {
    audio.pause();
  }, remote: function(key) {
    if (key === "RETURN" || key === "HOME") {
      if (bridge) bridge.exit();
      return;
    }
    if (key === "FAVORITE") {
      var id = document.activeElement.dataset.id;
      if (id) favorite(id);
      return;
    }
    if (key === "PLAY" || key === "PAUSE") {
      toggle();
      return;
    }
    if (key === "ENTER") {
      document.activeElement.click();
      return;
    }
    move({ UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 }[key] || 0);
  } };
  render();
  if (bridge) {
    if (bridge.playbackJson) {
      try {
        RadioUI.restore(JSON.parse(bridge.playbackJson()));
      } catch (e) {
      }
    }
    var first = bridge.initialStation();
    if (first) play(first);
    else {
      var initial = document.querySelector(".station");
      if (initial) initial.focus();
    }
  }
})();
