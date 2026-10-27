(function(C) {
  "use strict";
  var frame = null, frameKind = "", radioViewer = "", lastFocus = null, player = null, playingItem = null, position = 0, playToken = 0, cache = {}, cacheAt = 0, metadata = {}, metadataRequests = {}, metadataEpoch = 0;
  function t(a, b) {
    return MorphLocale.t(a, b);
  }
  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem("morph.samsung." + key)) || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem("morph.samsung." + key, JSON.stringify(value));
  }
  function settings() {
    return Object.assign({ scale: "fit", resume: true }, read("settings", {}), { language: MorphLocale.get() });
  }
  function profile() {
    var p = read("iptv", null);
    if (!p) throw Error(t("\u0623\u0636\u0641 \u0627\u0634\u062A\u0631\u0627\u0643\u0643 \u0645\u0646 \u0635\u0641\u062D\u0629 Play \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644.", "Add your subscription from Play on your phone."));
    return p;
  }
  function summary() {
    var p = profile();
    return { configured: true, connected: true, name: p.name, profileId: p.profileId, viewerId: C.Profiles.active(), viewerName: C.Profiles.list().filter(function(v) {
      return v.id === C.Profiles.active();
    })[0].name, live: p.live !== false, vod: p.vod !== false, series: p.series !== false };
  }
  function resetMetadata() {
    metadataEpoch++;
    metadata = {};
    metadataRequests = {};
  }
  function request(p, action2, key, id) {
    if (action2 !== "get_series_info" && action2 !== "get_vod_info") return networkRequest(p, action2, key, id);
    var k = p.server + "|" + p.username + "|" + action2 + "|" + id, entry = metadata[k], epoch = metadataEpoch;
    if (entry && Date.now() - entry.at < 3e5) return Promise.resolve(entry.value);
    if (metadataRequests[k]) return metadataRequests[k];
    var task = networkRequest(p, action2, key, id).then(function(value) {
      if (epoch === metadataEpoch) {
        if (JSON.stringify(value).length < 1048576) {
          metadata[k] = { at: Date.now(), value };
          while (Object.keys(metadata).length > 4) delete metadata[Object.keys(metadata)[0]];
        }
        delete metadataRequests[k];
      }
      return value;
    }, function(e) {
      if (epoch === metadataEpoch) delete metadataRequests[k];
      throw e;
    });
    metadataRequests[k] = task;
    return task;
  }
  function networkRequest(p, action2, key, id) {
    return new Promise(function(resolve, reject) {
      var url = p.server + "/player_api.php?username=" + encodeURIComponent(p.username) + "&password=" + encodeURIComponent(p.password);
      if (action2) url += "&action=" + action2;
      if (key) url += "&" + key + "=" + encodeURIComponent(id);
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.timeout = 12e3;
      xhr.onload = function() {
        try {
          if (xhr.status !== 200) throw Error();
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(Error(t("\u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0644\u0645 \u064A\u0631\u062C\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0635\u0627\u0644\u062D\u0629.", "The provider returned invalid data.")));
        }
      };
      xhr.onerror = xhr.ontimeout = function() {
        reject(Error(t("\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0645\u0646 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646. \u0631\u0627\u062C\u0639 \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643.", "The TV could not reach your provider. Check its address and your subscription.")));
      };
      xhr.send();
    });
  }
  function connect(value) {
    var p = Object.assign({}, value), u = new URL(p.server);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.search || u.hash || !p.username || !p.password) throw Error(t("\u0631\u0627\u062C\u0639 \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643.", "Check the provider address and credentials."));
    p.server = u.href.replace(/\/+$/, "");
    return request(p).then(function(r) {
      if (!r.user_info || Number(r.user_info.auth) !== 1 || String(r.user_info.status || "Active").toLowerCase() !== "active") throw Error(t("\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u063A\u064A\u0631 \u0646\u0634\u0637 \u0623\u0648 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.", "The subscription is inactive or credentials are incorrect."));
      var old = read("iptv", {});
      p.profileId = old.server === p.server && old.username === p.username ? old.profileId : String(Date.now());
      write("iptv", p);
      cache = {};
      resetMetadata();
      return summary();
    });
  }
  function historyKey() {
    return "history." + profile().profileId + (C.Profiles.active() === "default" ? "" : "@" + C.Profiles.active());
  }
  function rememberEntry(item) {
    if (["live", "vod", "episode"].indexOf(item.kind) < 0) return;
    var rows = read(historyKey(), []).filter(function(row) {
      return row.id !== item.id || row.kind !== item.kind;
    }), clean = { watchedAt: Date.now() };
    ["id", "kind", "name", "icon", "ext", "category", "seriesName"].forEach(function(k) {
      if (typeof item[k] === "string") clean[k] = item[k].slice(0, k === "icon" ? 2e3 : 250);
    });
    rows.unshift(clean);
    var counts = {};
    write(historyKey(), rows.filter(function(row) {
      counts[row.kind] = (counts[row.kind] || 0) + 1;
      return counts[row.kind] <= 66;
    }));
  }
  function memoryKey(item) {
    return profile().profileId + (C.Profiles.active() === "default" ? "" : "@" + C.Profiles.active()) + ":" + item.kind + ":" + item.id;
  }
  function decorate(item) {
    return Object.assign({}, item, { resumeMs: settings().resume ? read("progress", {})[memoryKey(item)] || 0 : 0 });
  }
  function list(payload) {
    var kind = payload.kind || "live", category = payload.category || "", p = profile();
    if (["live", "vod", "series", "episode"].indexOf(kind) < 0) throw Error("Invalid content type");
    if (kind !== "episode" && p[kind] === false) throw Error(t("\u0627\u0644\u0642\u0633\u0645 \u063A\u064A\u0631 \u0645\u0641\u0639\u0651\u0644.", "This section is disabled."));
    if (Date.now() - cacheAt > 3e5) {
      cache = {};
      cacheAt = Date.now();
    }
    if (payload.search && kind !== "episode") category = "";
    var key = kind + ":" + category;
    var source = cache[key] ? Promise.resolve(cache[key]) : request(p, kind === "episode" ? "get_series_info" : kind === "live" ? "get_live_streams" : kind === "vod" ? "get_vod_streams" : "get_series", category ? kind === "episode" ? "series_id" : "category_id" : null, category).then(function(raw) {
      var rows = [];
      if (kind === "episode") {
        Object.keys(raw.episodes || {}).sort(function(a, b) {
          return Number(a) - Number(b);
        }).forEach(function(season) {
          raw.episodes[season].forEach(function(e) {
            rows.push({ id: String(e.id), name: "S" + season + " \xB7 " + (e.title || "Episode"), kind: "episode", ext: e.container_extension || "mp4", icon: (e.info || {}).movie_image || "", duration: (e.info || {}).duration || "", plot: (e.info || {}).plot || "", rating: (e.info || {}).rating || "" });
          });
        });
      } else {
        if (!Array.isArray(raw)) throw Error("Invalid provider list");
        rows = raw.map(function(e) {
          return { id: String(kind === "series" ? e.series_id : e.stream_id), name: e.name || "Untitled", icon: kind === "series" ? e.cover : e.stream_icon, category: e.category_id, added: Number(e.added || e.last_modified) || 0, kind, rating: e.rating || e.rating_5based || "", ext: e.container_extension || "mp4" };
        });
      }
      cache[key] = rows.filter(function(e) {
        return /^\d{1,14}$/.test(e.id);
      });
      if (Object.keys(cache).length > 4) delete cache[Object.keys(cache)[0]];
      return cache[key];
    });
    return source.then(function(rows) {
      var search = String(payload.search || "").toLowerCase(), filtered = rows.filter(function(e) {
        return e.name.toLowerCase().indexOf(search) >= 0;
      }), page = Math.max(0, Number(payload.page) || 0);
      if (payload.order === "recent") filtered = filtered.slice().sort(function(a, b) {
        return (b.added || 0) - (a.added || 0);
      });
      return { items: filtered.slice(page * 60, page * 60 + 60).map(decorate), total: filtered.length, page, hasMore: (page + 1) * 60 < filtered.length };
    });
  }
  function epgText(value) {
    value = String(value || "");
    try {
      var decoded = decodeURIComponent(escape(atob(value)));
      if (decoded.trim()) return decoded;
    } catch (e) {
    }
    return value;
  }
  function epg(payload) {
    if (!/^\d{1,14}$/.test(String(payload.id))) throw Error("Invalid channel");
    return request(profile(), "get_short_epg", "stream_id", payload.id).then(function(raw) {
      return { items: (Array.isArray(raw.epg_listings) ? raw.epg_listings : []).slice(0, 32).map(function(row) {
        var start = Number(row.start_timestamp), end = Number(row.stop_timestamp || row.end_timestamp);
        if (start > 1e11) start /= 1e3;
        if (end > 1e11) end /= 1e3;
        return { title: epgText(row.title).slice(0, 500), description: epgText(row.description).slice(0, 4e3), start, end };
      }).filter(function(row) {
        return row.start > 0 && row.end > row.start;
      }) };
    });
  }
  function details(item) {
    if (["vod", "series"].indexOf(item.kind) < 0) return Promise.resolve(decorate(item));
    return request(profile(), item.kind === "vod" ? "get_vod_info" : "get_series_info", item.kind === "vod" ? "vod_id" : "series_id", item.id).then(function(raw) {
      var info = raw.info || {};
      return decorate(Object.assign({}, item, { seasons: item.kind === "series" ? Object.keys(raw.episodes || {}).sort(function(a, b) {
        return Number(a) - Number(b);
      }) : [], plot: info.plot || info.description || "", genre: info.genre || "", cast: info.cast || "", director: info.director || "", released: info.releaseDate || info.releasedate || info.release_date || "", duration: info.duration || "", rating: info.rating || "", icon: info.movie_image || info.cover || item.icon }));
    });
  }
  function exit(force) {
    if (frame && frameKind === "radio" && !force && frame.contentWindow.RadioUI && frame.contentWindow.RadioUI.snapshot().id) {
      frame.style.display = "none";
      if (lastFocus) lastFocus.focus();
      return;
    }
    if (C.ParentControls) C.ParentControls.mediaStopped();
    stop();
    if (frame) {
      frame.remove();
      frame = null;
    }
    frameKind = "";
    if (lastFocus) lastFocus.focus();
  }
  function radioStatus() {
    if (frameKind !== "radio" || !frame) return { active: false };
    if (radioViewer !== C.Profiles.active()) {
      exit(true);
      return { active: false };
    }
    var ui = frame.contentWindow.RadioUI, info = ui ? ui.snapshot() : {};
    info.active = !!info.id && ["connecting", "playing", "paused"].indexOf(info.state) >= 0;
    return info;
  }
  document.addEventListener("visibilitychange", function() {
    if (document.hidden && frameKind === "radio") exit(true);
  });
  window.addEventListener("morphAudioExclusive", function() {
    if (frameKind === "radio") exit(true);
  });
  function open(kind, station, showSettings) {
    var familyId = kind === "radio" ? "local.tvmorph.tv.radio" : "local.tvmorph.tv.play";
    if (C.ParentControls && !C.ParentControls.mediaGuard(familyId, function() {
      open(kind, station, showSettings);
    })) return { sent: false, parental: true };
    if (C.Prayer && !C.Prayer.allowLaunch()) return { sent: false, prayerBreak: true };
    if (kind === "radio" && frame && frameKind === "radio" && radioViewer === C.Profiles.active()) {
      lastFocus = document.activeElement;
      frame.style.display = "block";
      frame.style.visibility = "visible";
      frame.focus();
      if (station && frame.contentWindow.RadioUI) frame.contentWindow.RadioUI.selectStation(station);
      return { sent: true };
    }
    exit(true);
    lastFocus = document.activeElement;
    frameKind = kind;
    radioViewer = C.Profiles.active();
    frame = document.createElement("iframe");
    frame.id = "morph-media-frame";
    frame.style.cssText = "position:fixed;left:0;top:0;width:1920px;height:1080px;border:0;z-index:50;background:#0a101b";
    frame.src = kind + "/index.html";
    frame.onload = function() {
      var w = frame.contentWindow;
      if (showSettings && w.IptvUI) w.IptvUI.settings();
      if (kind === "radio" && station && w.RadioUI) w.RadioUI.selectStation(station);
      w.focus();
    };
    document.body.appendChild(frame);
    if (C.ParentControls) C.ParentControls.mediaStarted(familyId);
    frame.focus();
    return { sent: true };
  }
  function savePosition() {
    if (!playingItem || playingItem.kind === "live") return;
    var all = read("progress", {});
    var duration = 0;
    try {
      duration = player ? player.getDuration() : 0;
    } catch (e) {
    }
    var value = Math.max(0, position);
    if (value < 3e3 || duration > 0 && (duration - value < 3e4 || value > duration * 0.97)) value = 0;
    all[memoryKey(playingItem)] = value;
    write("progress", all);
  }
  function stop() {
    playToken++;
    savePosition();
    if (frame && frame.contentWindow.RadioUI) frame.contentWindow.RadioUI.stop();
    if (player) {
      try {
        player.stop();
      } catch (e) {
      }
      try {
        player.close();
      } catch (e) {
      }
      player = null;
    }
    playingItem = null;
    var overlay = document.getElementById("morph-player");
    if (overlay) {
      if (overlay._stopSeek) overlay._stopSeek();
      overlay.remove();
    }
    document.body.classList.remove("morph-playing");
    document.documentElement.classList.remove("morph-playing");
    if (frame) {
      frame.style.visibility = "visible";
      frame.contentWindow.focus();
      if (frame.contentWindow.IptvUI) frame.contentWindow.IptvUI.resume();
    }
  }
  function play(item) {
    var p = profile();
    if (!/^\d{1,14}$/.test(String(item.id)) || ["live", "vod", "episode"].indexOf(item.kind) < 0) throw Error("Invalid content");
    var ext = /^[a-z0-9]{1,8}$/i.test(item.ext || "") ? item.ext : "mp4";
    var url = p.server + "/" + (item.kind === "live" ? "live" : item.kind === "vod" ? "movie" : "series") + "/" + encodeURIComponent(p.username) + "/" + encodeURIComponent(p.password) + "/" + item.id + "." + (item.kind === "live" ? p.format === "ts" ? "ts" : "m3u8" : ext);
    if (!window.webapis || !webapis.avplay) throw Error("Samsung AVPlay unavailable");
    stop();
    try {
      rememberEntry(item);
    } catch (e) {
    }
    playingItem = item;
    position = item.startOver ? 0 : decorate(item).resumeMs;
    player = webapis.avplay;
    var overlay = document.createElement("div");
    overlay.id = "morph-player";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:1920px;height:1080px;z-index:70;background:transparent";
    var object = document.createElement("object");
    object.type = "application/avplayer";
    object.style.cssText = "position:absolute;left:0;top:0;width:1920px;height:1080px";
    overlay.appendChild(object);
    var controls = document.createElement("div");
    controls.style.cssText = "position:absolute;bottom:24px;left:50px;right:50px;background:linear-gradient(135deg,var(--cinema-glass,#10223dee),#101820e8);border:1px solid var(--cinema-border,#ffffff44);box-shadow:inset 0 1px 0 #ffffff55;border-radius:18px;padding:16px;color:white";
    var label = document.createElement("strong");
    label.textContent = item.name;
    label.style.marginRight = "28px";
    var timeline = document.createElement("div");
    timeline.style.cssText = "height:6px;background:#ffffff30;border-radius:9px;margin:6px 0 10px;position:relative";
    var played = document.createElement("div");
    played.style.cssText = "height:100%;width:0;border-radius:inherit;background:var(--cinema-glow,#9bd8f3)";
    timeline.tabIndex = item.kind === "live" ? -1 : 0;
    timeline.setAttribute("role", "slider");
    timeline.setAttribute("aria-label", { ar: "\u0645\u0648\u0636\u0639 \u0627\u0644\u062A\u0634\u063A\u064A\u0644", en: "Playback position", fr: "Position de lecture", zh: "\u64AD\u653E\u4F4D\u7F6E", ja: "\u518D\u751F\u4F4D\u7F6E" }[MorphLocale.get()] || "Playback position");
    timeline.setAttribute("aria-valuemin", "0");
    timeline.onfocus = function() {
      timeline.style.outline = "2px solid white";
    };
    timeline.onblur = function() {
      timeline.style.outline = "";
      resetSeekHold();
    };
    timeline.appendChild(played);
    controls.appendChild(timeline);
    var stamps = document.createElement("small");
    stamps.style.cssText = "display:block;margin-bottom:8px;font-variant-numeric:tabular-nums";
    controls.appendChild(stamps);
    var info = document.createElement("div");
    info.style.cssText = "display:flex;align-items:center;margin:6px 0 10px";
    if (item.icon && /^https?:/.test(item.icon)) {
      var poster = document.createElement("img");
      poster.src = item.icon;
      poster.style.cssText = "width:42px;height:60px;object-fit:contain;margin-right:22px;border-radius:10px";
      info.appendChild(poster);
    }
    label.style.cssText = "font-size:24px;display:block;max-width:1450px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis";
    info.appendChild(label);
    controls.appendChild(info);
    function clock(ms) {
      var sec = Math.max(0, Math.floor(ms / 1e3));
      return [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map(function(n) {
        return String(n).padStart(2, "0");
      }).join(":");
    }
    function button(text, fn) {
      var b = document.createElement("button");
      b.textContent = text;
      b.style.cssText = "margin:4px 8px;padding:8px 20px;border-radius:12px;background:#ffffff18;border:1px solid #ffffff55;color:white;font-size:18px";
      b.onclick = fn;
      controls.appendChild(b);
      return b;
    }
    var heldSeek = 0, seekStarted = 0, seekLast = 0, seekEvent = 0, seekPreview = 0, seekFrame = 0, scrubPaused = false, scrubPlaying = false, seekPending = false, seekVersion = 0;
    function paintPosition(ms) {
      var total = 0;
      try {
        total = player ? player.getDuration() : 0;
      } catch (e) {
      }
      timeline.setAttribute("aria-valuenow", String(Math.round(ms)));
      timeline.setAttribute("aria-valuemax", String(total));
      played.style.width = (total > 0 ? Math.max(0, Math.min(100, ms / total * 100)) : 0) + "%";
      stamps.textContent = clock(ms) + " / " + (item.kind === "live" ? "LIVE" : clock(total));
    }
    function commitPosition(target, resume) {
      if (!player || item.kind === "live") return;
      var currentPlayer = player, version = ++seekVersion, epoch = playToken;
      position = Math.round(target);
      seekPending = true;
      paintPosition(position);
      function done() {
        if (player !== currentPlayer || playToken !== epoch || version !== seekVersion) return;
        seekPending = false;
        if (resume) {
          if (heldSeek) {
            scrubPlaying = true;
            scrubPaused = true;
          } else try {
            player.play();
          } catch (e) {
          }
        }
        armControls();
      }
      try {
        player.seekTo(position, done, function() {
          done();
        });
      } catch (e) {
        seekPending = false;
        if (resume) try {
          player.play();
        } catch (ignore) {
        }
      }
    }
    function resetSeekHold(commit, resume) {
      if (seekFrame) cancelAnimationFrame(seekFrame);
      seekFrame = 0;
      if (!heldSeek) return;
      var target = seekPreview, shouldResume = scrubPaused && scrubPlaying;
      heldSeek = 0;
      seekStarted = seekLast = seekEvent = 0;
      scrubPaused = false;
      if (commit) commitPosition(target, shouldResume && resume !== false);
      else {
        if (shouldResume && resume !== false && player) try {
          player.play();
        } catch (e) {
        }
        paintPosition(position);
      }
    }
    function seekAmount(forward, amount) {
      if (!player || item.kind === "live") return;
      resetSeekHold();
      if (forward) player.jumpForward(amount);
      else player.jumpBackward(amount);
    }
    function seekStep(forward) {
      seekAmount(forward, 1e4);
    }
    function animateSeek(now) {
      seekFrame = 0;
      if (!heldSeek || !player || token !== playToken) return;
      if (now - seekEvent > 1200) {
        resetSeekHold(true, true);
        return;
      }
      var from = Math.max(seekLast, seekStarted + 350), dt = Math.max(0, Math.min(64, now - from)), speed = Math.min(240, 30 + Math.max(0, now - seekStarted - 350) * 0.02), total = player.getDuration();
      seekPreview = Math.max(0, Math.min(Math.max(0, total - 1e3), seekPreview + (heldSeek === 39 ? 1 : -1) * dt * speed));
      seekLast = now;
      if (now - seekStarted >= 350 && !scrubPaused) {
        if (scrubPlaying) try {
          player.pause();
        } catch (e) {
        }
        scrubPaused = true;
      }
      paintPosition(seekPreview);
      seekFrame = requestAnimationFrame(animateSeek);
    }
    function heldStep(e) {
      if (!player || item.kind === "live") return;
      var now = performance.now();
      if (heldSeek === e.keyCode) {
        seekEvent = now;
        return;
      }
      if (!heldSeek && e.repeat) return;
      var base = heldSeek ? seekPreview : position;
      if (!heldSeek) {
        scrubPlaying = player.getState() === "PLAYING";
        scrubPaused = false;
      }
      heldSeek = e.keyCode;
      seekStarted = seekLast = seekEvent = now;
      seekPreview = Math.max(0, Math.min(Math.max(0, player.getDuration() - 1e3), base + (e.keyCode === 39 ? 1e4 : -1e4)));
      paintPosition(seekPreview);
      if (!seekFrame) seekFrame = requestAnimationFrame(animateSeek);
    }
    button(t("\u0631\u062C\u0648\u0639", "Back"), stop);
    button("\u221210s", function() {
      seekStep(false);
    });
    button("\u25B6 / \u2161", function() {
      if (player.getState() === "PLAYING") player.pause();
      else player.play();
    });
    button("+10s", function() {
      seekStep(true);
    });
    var scale = button("", function() {
      var modes = ["fit", "fill", "stretch"], s = settings();
      s.scale = modes[(modes.indexOf(s.scale) + 1) % 3];
      write("settings", s);
      sizing();
    });
    function sizing() {
      var mode = settings().scale;
      player.setDisplayMethod(mode === "fill" ? "PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO" : mode === "stretch" ? "PLAYER_DISPLAY_MODE_FULL_SCREEN" : "PLAYER_DISPLAY_MODE_LETTER_BOX");
      scale.textContent = t("\u0627\u0644\u0645\u0642\u0627\u0633: ", "Size: ") + mode;
    }
    var controlTimer;
    function armControls() {
      clearTimeout(controlTimer);
      controlTimer = setTimeout(function() {
        if (token === playToken && player && player.getState() === "PLAYING" && !heldSeek) controls.hidden = true;
      }, 4e3);
    }
    overlay.appendChild(controls);
    overlay.tabIndex = -1;
    overlay.onkeydown = function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.keyCode === 10009 || e.keyCode === 27) {
        clearTimeout(controlTimer);
        stop();
        return;
      }
      if (item.kind !== "live" && (e.keyCode === 37 || e.keyCode === 39) && (controls.hidden || document.activeElement === timeline)) {
        controls.hidden = false;
        timeline.focus();
        heldStep(e);
        armControls();
        return;
      }
      if (e.keyCode === 38 && item.kind !== "live") {
        resetSeekHold();
        timeline.focus();
        armControls();
        return;
      }
      if (e.keyCode === 40 && document.activeElement === timeline) {
        resetSeekHold();
        controls.querySelectorAll("button")[2].focus();
        armControls();
        return;
      }
      if (controls.hidden) {
        controls.hidden = false;
        var first = controls.querySelectorAll("button")[2];
        if (first) first.focus();
        armControls();
        return;
      }
      armControls();
      var buttons = Array.prototype.slice.call(controls.querySelectorAll("button")), index = buttons.indexOf(document.activeElement);
      if (e.keyCode === 37 || e.keyCode === 39) buttons[(index + (e.keyCode === 39 ? 1 : buttons.length - 1)) % buttons.length].focus();
      if (e.keyCode === 13 && !e.repeat && document.activeElement.click) document.activeElement.click();
    };
    overlay.onkeyup = function(e) {
      if (e.keyCode === heldSeek) resetSeekHold(true, true);
    };
    var blurSeek = function() {
      resetSeekHold();
    };
    window.addEventListener("blur", blurSeek);
    overlay._stopSeek = function() {
      resetSeekHold(false, false);
      window.removeEventListener("blur", blurSeek);
    };
    overlay.addEventListener("focusout", function(e) {
      if (!overlay.contains(e.relatedTarget)) resetSeekHold();
    });
    document.body.appendChild(overlay);
    document.body.classList.add("morph-playing");
    document.documentElement.classList.add("morph-playing");
    if (frame) frame.style.visibility = "hidden";
    controls.querySelector("button").focus();
    var token = playToken;
    try {
      player.open(url);
      if (item.kind !== "live" && typeof player.setBufferingParam === "function") {
        try {
          player.setBufferingParam("PLAYER_BUFFER_FOR_PLAY", "PLAYER_BUFFER_SIZE_IN_SECOND", 5);
        } catch (unsupported) {
        }
      }
      player.setDisplayRect(0, 0, 1920, 1080);
      player.setListener({ oncurrentplaytime: function(ms) {
        if (heldSeek || seekPending) return;
        position = ms;
        paintPosition(ms);
        if (ms % 5e3 < 1e3) savePosition();
      }, onstreamcompleted: function() {
        position = 0;
        stop();
      }, onerror: function() {
        label.textContent = t("\u062A\u0639\u0630\u0651\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0628\u062B. \u062C\u0631\u0651\u0628 \u0642\u0646\u0627\u0629 \u0623\u062E\u0631\u0649.", "Playback failed. Try another stream.");
      } });
      player.prepareAsync(function() {
        if (token !== playToken || !player) return;
        sizing();
        if (position && item.kind !== "live") player.seekTo(position);
        player.play();
        armControls();
      }, function() {
        label.textContent = t("\u062A\u0639\u0630\u0651\u0631 \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0641\u064A\u062F\u064A\u0648. \u0631\u0627\u062C\u0639 \u0627\u0644\u0628\u062B.", "Video could not be prepared. Check the stream.");
      });
    } catch (e) {
      stop();
      throw Error(t("\u062A\u0639\u0630\u0651\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0639\u0644\u0649 Samsung.", "Could not start video on Samsung."));
    }
    return { sent: true };
  }
  function action(name, payload) {
    payload = payload || {};
    if (name === "history") return { items: read(historyKey(), []).map(decorate) };
    if (name === "epg") return epg(payload);
    if (name === "connect") return connect(payload);
    if (name === "summary") return summary();
    if (name === "clear") {
      localStorage.removeItem("morph.samsung.iptv");
      cache = {};
      resetMetadata();
      return { cleared: true };
    }
    if (name === "open") return open("iptv");
    if (name === "list") return list(payload);
    if (name === "categories") return request(profile(), payload.kind === "live" ? "get_live_categories" : payload.kind === "vod" ? "get_vod_categories" : "get_series_categories").then(function(rows) {
      return { items: rows };
    });
    if (name === "details") return details(payload);
    if (name === "settings") return settings();
    if (name === "saveSettings") {
      var s = Object.assign(settings(), payload);
      write("settings", s);
      MorphLocale.set(s.language);
      return s;
    }
    if (name === "refresh") {
      cache = {};
      resetMetadata();
      return { refreshed: true };
    }
    if (name === "clearProgress") {
      var all = read("progress", {}), viewer = C.Profiles.active();
      Object.keys(all).forEach(function(k) {
        var account = k.split(":")[0];
        if (viewer === "default" ? account.indexOf("@") < 0 : account.slice(-(viewer.length + 1)) === "@" + viewer) delete all[k];
      });
      write("progress", all);
      return { cleared: true };
    }
    if (name === "progress") return { items: (payload.items || []).map(decorate) };
    if (name === "play") return play(payload);
    throw Error("Unknown media action");
  }
  function radio(id, url) {
    stop();
    var token = playToken, w = frame.contentWindow;
    function fallback() {
      if (token !== playToken) return;
      if (player) {
        try {
          player.close();
        } catch (e) {
        }
        player = null;
      }
      w.RadioUI.fallback(id, "");
    }
    if (!window.webapis || !webapis.avplay) {
      fallback();
      return;
    }
    try {
      player = webapis.avplay;
      player.open(url);
      player.setListener({ onerror: fallback, onstreamcompleted: function() {
        w.RadioUI.state(id, "stopped", t("\u0627\u0644\u0628\u062B \u062A\u0648\u0642\u0641. \u0627\u0636\u063A\u0637 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.", "Stream ended. Retry to reconnect."));
      } });
      player.prepareAsync(function() {
        if (token !== playToken || !player) return;
        player.play();
        w.RadioUI.state(id, "playing", t("\u0639\u0644\u0649 \u0627\u0644\u0647\u0648\u0627\u0621 \xB7 \u0627\u062A\u0635\u0627\u0644 \u0645\u0628\u0627\u0634\u0631", "On air \xB7 direct stream"));
      }, fallback);
    } catch (e) {
      fallback();
    }
  }
  window.SamsungMedia = { action: function(name, payload) {
    return Promise.resolve().then(function() {
      return action(name, payload);
    });
  }, exit, radioStatus, radioStop: function() {
    if (frameKind === "radio") exit(true);
  }, radioControl: function() {
    if (frameKind === "radio" && frame && frame.contentWindow.RadioUI) frame.contentWindow.RadioUI.remote("PLAY");
  }, open, settings, radio, radioToggle: function(id) {
    if (!player) return;
    if (player.getState() === "PLAYING") {
      player.pause();
      frame.contentWindow.RadioUI.state(id, "paused", t("\u0645\u062A\u0648\u0642\u0641 \u0645\u0624\u0642\u062A\u064B\u0627", "Paused"));
    } else {
      player.play();
      frame.contentWindow.RadioUI.state(id, "playing", t("\u0639\u0644\u0649 \u0627\u0644\u0647\u0648\u0627\u0621", "On air"));
    }
  } };
  var style = document.createElement("style");
  style.textContent = "html.morph-playing,body.morph-playing{background:transparent!important}body.morph-playing>main,body.morph-playing>.landscape,body.morph-playing>.club-watermark{visibility:hidden}";
  document.head.appendChild(style);
  var remote = C.Remote;
  C.Remote = { key: function(key) {
    if (playingItem) {
      var overlay = document.getElementById("morph-player"), e = new Event("keydown", { bubbles: true, cancelable: true });
      Object.defineProperty(e, "keyCode", { value: { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, RETURN: 27, HOME: 27 }[key] || 0 });
      overlay.dispatchEvent(e);
      if (key === "LEFT" || key === "RIGHT") {
        var up = new Event("keyup", { bubbles: true, cancelable: true });
        Object.defineProperty(up, "keyCode", { value: key === "LEFT" ? 37 : 39 });
        overlay.dispatchEvent(up);
      }
      return { sent: true };
    }
    if (frame) {
      var w = frame.contentWindow;
      if (w.IptvUI) return w.IptvUI.remote("key", key);
      if (w.RadioUI) {
        w.RadioUI.remote(key);
        return { sent: true };
      }
    }
    return remote.key(key);
  }, text: function(text) {
    if (playingItem) return { sent: false, error: "Close the player to enter text." };
    if (frame && frame.contentWindow.IptvUI) return frame.contentWindow.IptvUI.remote("text", text);
    return remote.text(text);
  } };
})(window.ClearTV);
