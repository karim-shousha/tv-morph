(function(C) {
  "use strict";
  var picking = false, slideTimer = null, slideSignature = "", slideGeneration = 0;
  function updateSlides(backdrop) {
    var images = Array.isArray(C.settings.backgroundImages) ? C.settings.backgroundImages.filter(function(v) {
      return typeof v === "string" && v.length <= 9e4 && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
    }).slice(0, 5) : [];
    var enabled = !document.body.classList.contains("light-mode") && C.settings.slideshowEnabled && images.length > 0, seconds = Math.max(8, Math.min(60, Number(C.settings.slideshowSeconds) || 15));
    var signature = JSON.stringify([enabled, images, seconds, C.settings.theme]);
    if (signature === slideSignature) return;
    slideSignature = signature;
    slideGeneration++;
    clearInterval(slideTimer);
    var old = backdrop.querySelector(".slide-layer");
    if (old) old.remove();
    if (!enabled) return;
    backdrop.hidden = false;
    var base = backdrop.firstChild, layer = document.createElement("img"), index = 0, gen = slideGeneration;
    layer.className = "slide-layer";
    layer.alt = "";
    layer.style.transform = base.style.transform;
    backdrop.appendChild(layer);
    base.src = images[0];
    layer.style.opacity = "0";
    if (images.length > 1) slideTimer = setInterval(function() {
      if (document.hidden || document.body.classList.contains("light-mode") || document.getElementById("view-home").hidden) return;
      var next = (index + 1) % images.length;
      layer.onload = function() {
        if (gen !== slideGeneration) return;
        layer.style.opacity = "1";
        setTimeout(function() {
          if (gen !== slideGeneration) return;
          base.src = images[next];
          layer.style.transition = "none";
          layer.style.opacity = "0";
          void layer.offsetWidth;
          layer.style.transition = "";
          index = next;
        }, 1300);
      };
      layer.src = images[next];
    }, seconds * 1e3);
  }
  var view = "home", pins = C.read("pins", null), returnFocus = null, modalType = "", clockTimer = null, cityQuery = 0;
  var views = ["home", "apps", "inputs", "settings"], themes = ["blue", "night", "emerald", "ahly", "amber", "violet", "zamalek", "barcelona", "madrid", "egypt", "basketball", "baseball", "montreal", "toronto", "argentina", "portugal"];
  var themeLabels = { blue: "Twilight blue", night: "Midnight", emerald: "Coastal green", ahly: "Al Ahly SC", amber: "Golden hour", violet: "Aurora violet", zamalek: "Zamalek SC", barcelona: "FC Barcelona", madrid: "Real Madrid", egypt: "Egypt National Team", basketball: "Basketball", baseball: "Baseball", montreal: "Montreal Canadiens", toronto: "Toronto Maple Leafs", argentina: "Argentina", portugal: "Portugal" };
  var originalHeading = document.querySelector(".hero-heading h1").innerHTML, originalSubtitle = document.querySelector(".intro>p").textContent;
  var overlay = document.getElementById("overlay"), modal = document.getElementById("modal"), content = document.getElementById("modal-content");
  function button(text, className, action, id) {
    var b = C.el("button", className, text);
    if (id) {
      b.id = id;
    }
    b.onclick = action;
    return b;
  }
  function labelledIcon(name) {
    var s = C.el("span");
    s.innerHTML = C.icon(name);
    return s;
  }
  function appLabel(app) {
    return /youtube/i.test(app.name) ? "Discover something worth watching." : /iptv/i.test(app.name) ? "Your channels. Your choice." : "Open " + app.name + ".";
  }
  function byName(pattern) {
    return C.Catalog.apps.filter(function(a) {
      return pattern.test(a.name);
    })[0];
  }
  function appByID(id) {
    return C.Catalog.get(id);
  }
  function isPinned(id) {
    return Array.isArray(pins) && pins.indexOf(id) >= 0;
  }
  function applyAppearance() {
    document.body.setAttribute("data-theme", C.settings.theme);
    document.body.classList.toggle("reduce-motion", !C.settings.motion);
    applyCustomisation();
    if (C.Prayer && C.Prayer.syncVisibility) C.Prayer.syncVisibility();
  }
  function applyCustomisation() {
    if (C.applyArtwork) C.applyArtwork();
    try {
      if (window.TVNative && TVNative.saveSettings) TVNative.saveSettings(JSON.stringify({ theme: C.settings.theme, cardColor: C.settings.cardColor || "", accent: C.settings.highlightColor || C.settings.accent || "", glassOpacity: C.settings.glassOpacity || 18, viewerId: C.Profiles.active(), viewerName: C.Profiles.list().filter(function(p) {
        return p.id === C.Profiles.active();
      })[0].name }));
    } catch (e) {
    }
    if (document.querySelector(".home-feed")) {
      var backdrop = document.getElementById("cinema-background");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "cinema-background";
        backdrop.setAttribute("aria-hidden", "true");
        var picture = document.createElement("img");
        picture.alt = "";
        backdrop.appendChild(picture);
        document.body.insertBefore(backdrop, document.querySelector("main"));
      }
      var source = document.querySelector(".club-team-photo img");
      var activeSlides = C.settings.slideshowEnabled && Array.isArray(C.settings.backgroundImages) && C.settings.backgroundImages.length;
      if (!activeSlides) backdrop.firstChild.src = source ? source.src : "";
      backdrop.hidden = !(document.body.dataset.clubTheme === "true" || C.settings.theme === "ahly" || C.settings.theme === "blue" || document.body.classList.contains("has-personal-art"));
      updateSlides(backdrop);
      Array.prototype.forEach.call(backdrop.querySelectorAll("img"), function(img) {
        img.style.transform = "scale(" + Math.max(0.7, Math.min(1.25, (Number(C.settings.heroArtSize) || 100) / 100)) + ")";
      });
      if (C.settings.slideshowEnabled && Array.isArray(C.settings.backgroundImages) && C.settings.backgroundImages.length) backdrop.hidden = false;
      var weather = document.getElementById("weather-card"), clock = document.querySelector(".header-status");
      if (weather && clock && weather.parentNode !== clock) clock.insertBefore(weather, clock.firstChild);
    }
    var names = { zamalek: "Zamalek SC", barcelona: "FC Barcelona", madrid: "Real Madrid" }, captions = { zamalek: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0641\u0646 \u0648\u0627\u0644\u0647\u0646\u062F\u0633\u0629", barcelona: "M\xE9s que un club", madrid: "Hala Madrid" };
    var title = typeof C.settings.customTitle === "string" ? C.settings.customTitle.slice(0, 48) : "", subtitle = typeof C.settings.customSubtitle === "string" ? C.settings.customSubtitle.slice(0, 64) : "";
    var arabic = document.documentElement.lang === "ar", isAhly = C.settings.theme === "ahly", club = (C.ClubThemes || {})[C.settings.theme];
    var defaultTitle = club ? arabic ? club.titleAr : club.titleEn : isAhly ? arabic ? "\u0627\u0644\u0642\u0627\u0636\u064A\u0629 \u0645\u0645\u0643\u0646" : "Al Ahly SC" : arabic ? "\u062A\u0644\u0641\u0632\u064A\u0648\u0646\u0643. \u0639\u0644\u0649 \u0630\u0648\u0642\u0643." : "Your TV. Your way.";
    var defaultSubtitle = club ? arabic ? club.mottoAr : club.mottoEn : isAhly ? arabic ? "\u0627\u0644\u0623\u0647\u0644\u064A \u0641\u0648\u0642 \u0627\u0644\u062C\u0645\u064A\u0639" : "Al Ahly above all" : arabic ? "\u062B\u064A\u0645\u0627\u062A\u0643\u060C \u062A\u0637\u0628\u064A\u0642\u0627\u062A\u0643 \u0648\u0645\u062D\u062A\u0648\u0627\u0643 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F \u0645\u0639 Morph TV." : "Themes, apps and entertainment. Together with Morph TV.";
    document.querySelector(".hero-heading h1").textContent = title || defaultTitle;
    document.querySelector(".intro>p").textContent = subtitle || defaultSubtitle;
    document.querySelector(".club-overline").textContent = club ? club.overline : isAhly ? "AL AHLY SC" : "MORPH TV";
    document.querySelector(".club-century").textContent = club ? arabic ? club.detailAr : club.detailEn : isAhly ? arabic ? "\u0627\u0644\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0647\u0644\u064A \xB7 \u0627\u0644\u0642\u0627\u0647\u0631\u0629" : "AL AHLY \xB7 CAIRO" : arabic ? "\u0634\u0627\u0634\u062A\u0643. \u0639\u0644\u0649 \u0630\u0648\u0642\u0643." : "CUSTOM YOUR TV";
    document.querySelector(".club-hero-year").textContent = club ? club.year : "1907";
    document.querySelector(".club-hero h1").textContent = title || defaultTitle;
    document.querySelector(".club-hero-copy>p").textContent = subtitle || defaultSubtitle;
    document.querySelector(".header-clock").hidden = C.settings.showClock === false;
    document.getElementById("weather-card").hidden = C.settings.showWeather === false;
    var width = Math.max(220, Math.min(380, Number(C.settings.cardWidth) || 300)), accent = typeof C.settings.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(C.settings.accent) ? C.settings.accent : "";
    function size(key, max) {
      var n = Number(C.settings[key]);
      return isFinite(n) && n > 0 ? Math.max(70, Math.min(max, n)) / 100 : 1;
    }
    var titleScale = size("heroTitleSize", 120), subtitleScale = size("heroSubtitleSize", 120), artScale = size("heroArtSize", 125), logoScale = size("heroLogoSize", 125);
    var customCSS = "";
    function color(k) {
      return /^#[0-9a-fA-F]{6}$/.test(C.settings[k] || "") ? C.settings[k] : "";
    }
    var start = color("backgroundStart"), end = color("backgroundEnd"), card = color("cardColor"), text = color("textColor");
    if (start || end) customCSS += ".landscape{background:linear-gradient(125deg," + (start || "#101827") + "," + (end || "#334b78") + ")!important}.ridge{opacity:.25}.club-hero{background:linear-gradient(115deg," + (start || "#101827") + "dd," + (end || "#334b78") + "aa)!important}";
    if (card) customCSS += ".favourite:not(.add-favourite),.shelf-card,.weather-card{background:" + card + "cc!important}";
    if (text) customCSS += "body,button,.intro p,.club-hero-copy p,.club-hero h1,.favourite h3,.favourite p{color:" + text + "!important}";
    var style = document.getElementById("remote-custom-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "remote-custom-style";
      document.head.appendChild(style);
    }
    customCSS += "body[data-theme] .hero .intro .club-hero h1{font-size:" + 60 * titleScale + "px;max-height:140px}body[data-theme] .hero .intro .club-hero-copy>p{font-size:" + 30 * subtitleScale + "px;max-height:86px}.hero-heading h1{font-size:" + 68 * titleScale + "px!important}.intro>p{font-size:" + 23 * subtitleScale + "px!important}body[data-theme] .hero .intro .club-team-photo{overflow:hidden}body[data-theme] .hero .intro .club-team-photo img{transform:scale(" + artScale + ");transform-origin:center}body[data-theme] .hero .intro .club-hero-logo{transform:scale(" + logoScale + ");transform-origin:center}";
    function offset(role, axis) {
      return Math.max(-25, Math.min(25, Number(C.settings[role + "Offset" + axis]) || 0)) * (axis === "X" ? 19.2 : 10.8);
    }
    customCSS += "#cinema-background>img{margin-right:" + -offset("art", "X") + "px;margin-top:" + offset("art", "Y") + "px}body[data-theme] #view-home .hero .intro .club-hero-copy{transform:translate(" + offset("text", "X") + "px," + offset("text", "Y") + "px)}body[data-theme] #view-home .hero .intro .club-hero-logo{transform:translate(" + offset("logo", "X") + "px," + offset("logo", "Y") + "px) scale(" + logoScale + ")}";
    style.textContent = customCSS + ".favourite:not(.add-favourite){width:" + width + "px;}" + (accent ? ".favourite,.catalog-tile{border-color:" + accent + "88!important;} .nav.active{background:" + accent + "55!important;}" : "");
    C.syncBarTheme = function() {
      var palette = { ahly: ["#57162b", "#ff4769"], zamalek: ["#51333e", "#ed6079"], madrid: ["#5c5264", "#eee0b1"], barcelona: ["#492448", "#c47dff"], egypt: ["#521d2a", "#ff596c"], emerald: ["#214b49", "#68e8ba"], amber: ["#59412f", "#ffc680"], violet: ["#493454", "#cda2ff"], night: ["#1d2234", "#8aaeff"], blue: ["#26344e", "#63caff"] }, selected = palette[C.settings.theme] || palette.blue, base = color("cardColor") || club && club.secondary || selected[0], glow = color("highlightColor") || accent || club && club.primary || selected[1], alpha = Math.round(Math.max(10, Math.min(80, Number(C.settings.glassOpacity) || 18)) * 2.55).toString(16);
      if (alpha.length < 2) alpha = "0" + alpha;
      document.body.style.setProperty("--cinema-glass", base + alpha);
      document.body.style.setProperty("--cinema-border", glow + "66");
      document.body.style.setProperty("--cinema-icon", color("iconTint") || "#ffffff");
      document.body.style.setProperty("--cinema-glow", glow);
    };
    C.syncBarTheme();
  }
  C.applyRemoteConfig = function(settings) {
    if (settings.theme && settings.theme !== C.settings.theme) {
      C.settings.backgroundImages = [];
      C.settings.slideshowEnabled = false;
      ["artOffsetX", "artOffsetY", "textOffsetX", "textOffsetY", "logoOffsetX", "logoOffsetY"].forEach(function(k) {
        C.settings[k] = 0;
      });
      C.settings.iconTint = "";
      C.settings.highlightColor = "";
      ["customTitle", "customSubtitle", "logoImage", "artImage", "backgroundStart", "backgroundEnd", "cardColor", "textColor", "accent"].forEach(function(k) {
        C.settings[k] = "";
      });
      ["heroTitleSize", "heroSubtitleSize", "heroArtSize", "heroLogoSize"].forEach(function(k) {
        C.settings[k] = 100;
      });
    }
    var allowed = ["theme", "customTitle", "customSubtitle", "cardWidth", "accent", "showClock", "showWeather", "showPrayer", "logoImage", "artImage", "backgroundStart", "backgroundEnd", "cardColor", "textColor", "heroTitleSize", "heroSubtitleSize", "heroArtSize", "heroLogoSize", "backgroundImages", "slideshowEnabled", "slideshowSeconds", "glassOpacity", "iconTint", "highlightColor", "artOffsetX", "artOffsetY", "textOffsetX", "textOffsetY", "logoOffsetX", "logoOffsetY"];
    allowed.forEach(function(k) {
      if (Object.prototype.hasOwnProperty.call(settings, k)) {
        if (k === "theme" && themes.indexOf(settings[k]) < 0) {
          return;
        }
        if (/^hero(Title|Subtitle|Art|Logo)Size$/.test(k)) {
          var n = Number(settings[k]);
          C.settings[k] = isFinite(n) && n > 0 ? Math.max(70, Math.min(k === "heroTitleSize" || k === "heroSubtitleSize" ? 120 : 125, n)) : 100;
        } else if (k === "backgroundImages") {
          C.settings[k] = Array.isArray(settings[k]) ? settings[k].filter(function(v) {
            return typeof v === "string" && v.length <= 9e4 && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v);
          }).slice(0, 5) : [];
        } else if (/^(art|text|logo)Offset[XY]$/.test(k)) {
          C.settings[k] = Math.max(-25, Math.min(25, Number(settings[k]) || 0));
        } else if (k === "iconTint" || k === "highlightColor") {
          C.settings[k] = /^#[0-9a-fA-F]{6}$/.test(settings[k] || "") ? settings[k] : "";
        } else if (k === "glassOpacity") {
          C.settings[k] = Math.max(10, Math.min(80, Number(settings[k]) || 18));
        } else if (k === "slideshowSeconds") {
          C.settings[k] = Math.max(8, Math.min(60, Number(settings[k]) || 15));
        } else if (k === "slideshowEnabled") C.settings[k] = settings[k] === true;
        else C.settings[k] = settings[k];
      }
    });
    C.saveSettings();
    applyAppearance();
    renderSettings();
    return { applied: true, settings: C.settings };
  };
  C.getRemoteState = function() {
    return { apps: C.Catalog.apps.map(function(a) {
      return { id: a.id, name: a.name };
    }), pins: pins || [], settings: C.settings };
  };
  C.setRemotePins = function(ids) {
    pins = ids.filter(function(id, i) {
      return typeof id === "string" && !!appByID(id) && ids.indexOf(id) === i;
    }).slice(0, 24);
    C.write("pins", pins);
    renderFavourites();
    renderCatalog();
    return { saved: true, pins };
  };
  function updateClock() {
    var d = /* @__PURE__ */ new Date(), h = d.getHours(), m = d.getMinutes(), suffix = "";
    if (!C.settings.clock24) {
      suffix = h >= 12 ? " PM" : " AM";
      h = h % 12 || 12;
    }
    document.getElementById("time").textContent = (C.settings.clock24 && h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + suffix;
    document.getElementById("date").textContent = d.toLocaleDateString(document.documentElement.lang === "ar" ? "ar-EG" : "en-CA", { weekday: "short", month: "short", day: "numeric" });
    document.getElementById("greeting").textContent = d.getHours() < 12 ? "GOOD MORNING. MAKE YOURSELF AT HOME." : d.getHours() < 18 ? "YOUR AFTERNOON, YOUR WAY." : "YOUR EVENING STARTS HERE.";
  }
  window.addEventListener("morphLanguage", function() {
    updateClock();
    applyAppearance();
    renderSettings();
  });
  function scheduleClock() {
    clearTimeout(clockTimer);
    if (document.hidden) {
      return;
    }
    updateClock();
    clockTimer = setTimeout(scheduleClock, 6e4 - Date.now() % 6e4 + 30);
  }
  function updateNetwork() {
    var offline = navigator.onLine === false;
    document.getElementById("network").classList.toggle("offline", offline);
    document.querySelector("#network span").textContent = offline ? "Offline" : "Connected";
  }
  function closeModal(restore) {
    overlay.hidden = true;
    modalType = "";
    cityQuery++;
    C.Focus.setScope(document);
    if (restore !== false) {
      C.Focus.focus(returnFocus && document.contains(returnFocus) && returnFocus.offsetWidth ? returnFocus : document.getElementById("nav-" + view));
    }
  }
  function openModal(title, type, builder) {
    if (overlay.hidden) {
      returnFocus = document.activeElement;
    }
    modalType = type;
    document.getElementById("modal-title").textContent = title;
    content.textContent = "";
    overlay.hidden = false;
    builder();
    C.Focus.setScope(modal);
    C.Focus.focus(document.getElementById("modal-close"));
  }
  C.back = function() {
    if (!overlay.hidden) {
      closeModal();
      return;
    }
    if (C.Prayer && C.Prayer.backSettings && C.Prayer.backSettings()) return;
    if (C.SettingsNav && C.SettingsNav.back()) return;
    if (C.Inputs.state.watching) {
      C.Inputs.stop();
      return;
    }
    if (view !== "home") {
      showView("home");
      if (C.restoreHomeDock) C.restoreHomeDock();
      else C.Focus.focus(document.getElementById("nav-home"));
      return;
    }
    if (typeof tizen !== "undefined") {
      tizen.application.getCurrentApplication().exit();
    } else {
      C.toast("Back exits Morph TV on your television.");
    }
  };
  function showView(name, target) {
    if (views.indexOf(name) < 0) {
      return;
    }
    picking = false;
    if (!overlay.hidden) {
      closeModal(false);
    }
    view = name;
    views.forEach(function(v) {
      document.getElementById("view-" + v).hidden = v !== name;
      document.getElementById("nav-" + v).classList.toggle("active", v === name);
    });
    document.getElementById("focus-hint").textContent = "\u2191 Navigation \xB7 \u2190 \u2192 Browse \xB7 OK Open \xB7 Back Return";
    if (name === "inputs") {
      C.Inputs.load();
    }
    if (name === "apps") {
      renderCatalog();
    }
    if (name === "home") {
      renderFavourites();
      renderRecent();
    }
    if (name === "settings") {
      renderSettings();
      if (C.SettingsNav) C.SettingsNav.home();
      if (C.Prayer && C.Prayer.settingsEntered) C.Prayer.settingsEntered();
    }
    C.Focus.focus(target || document.getElementById("nav-" + name));
  }
  function initialisePins() {
    if (!Array.isArray(pins)) {
      pins = [];
      var youtube = byName(/^youtube$/i), iptv = byName(/iptv/i);
      if (youtube) {
        pins.push(youtube.id);
      }
      if (iptv) {
        pins.push(iptv.id);
      }
      if (!pins.length) {
        pins = C.Catalog.apps.filter(function(a) {
          return a.name !== "Samsung Apps";
        }).slice(0, 2).map(function(a) {
          return a.id;
        });
      }
    }
    if (!C.read("mediaHomePinnedV2", false) && appByID("local.tvmorph.tv.play") && appByID("local.tvmorph.tv.radio")) {
      ["local.tvmorph.tv.radio", "local.tvmorph.tv.play"].forEach(function(id) {
        if (pins.indexOf(id) < 0) pins.unshift(id);
      });
      C.write("mediaHomePinnedV2", true);
    }
    if (!C.read("prayerHomePinnedV1", false) && appByID("local.tvmorph.tv.prayer")) {
      if (pins.indexOf("local.tvmorph.tv.prayer") < 0) pins.push("local.tvmorph.tv.prayer");
      C.write("prayerHomePinnedV1", true);
    }
    if (!C.read("builtin-pins-v2", false)) {
      ["local.tvmorph.tv.radio", "local.tvmorph.tv.play"].forEach(function(id) {
        if (appByID(id) && pins.indexOf(id) < 0) pins.unshift(id);
      });
      C.write("builtin-pins-v2", true);
    }
    pins = pins.filter(function(id, i) {
      return !!appByID(id) && pins.indexOf(id) === i;
    });
    C.write("pins", pins);
  }
  function renderFavourites() {
    var rail = document.getElementById("favourites");
    rail.textContent = "";
    (pins || []).forEach(function(id) {
      var app = appByID(id);
      if (!app) {
        return;
      }
      var card = button("", "favourite" + (/iptv/i.test(app.name) ? " iptv" : ""), function() {
        C.Catalog.launch(app);
      });
      card.setAttribute("data-favourite-id", id);
      card.setAttribute("aria-label", "Open " + app.name);
      var top = C.el("div", "favourite-top");
      top.appendChild(C.Catalog.icon(app));
      top.appendChild(C.el("span", "tag", /iptv/i.test(app.name) ? "LIVE TV" : "FAVOURITE"));
      card.appendChild(top);
      var bottom = C.el("div");
      bottom.appendChild(C.el("h3", "", app.name));
      bottom.appendChild(C.el("p", "", appLabel(app)));
      card.appendChild(bottom);
      card.appendChild(C.el("span", "arrow", "\u2197"));
      rail.appendChild(card);
    });
    var add = button("", "favourite add-favourite", openAppPicker, "add-app");
    add.setAttribute("aria-label", "Add an installed app to Home");
    var plus = C.el("span", "plus-icon");
    plus.innerHTML = C.icon("plus");
    add.appendChild(plus);
    add.appendChild(C.el("h3", "", "Add app"));
    add.appendChild(C.el("p", "", "Choose your favourites"));
    rail.appendChild(add);
    document.getElementById("favourites-subtitle").textContent = pins && pins.length > 2 ? "Use \u2190 \u2192 to browse your favourites." : "Your favourites, one slide away.";
  }
  function openAppPicker() {
    document.getElementById("app-search").value = "";
    showView("apps");
    picking = true;
    renderCatalog();
    C.Focus.focus(document.querySelector("#catalog .launch-tile") || document.getElementById("nav-apps"));
  }
  function renderCatalog() {
    document.body.classList.toggle("picking-apps", picking);
    document.querySelector("#view-apps .page-title h1").textContent = picking ? "Add to Home" : "Your apps";
    document.querySelector("#view-apps .page-title p").textContent = picking ? "Select an app and press OK to add or remove it from Home." : "Open an app, or select + to pin it to Home.";
    var grid = document.getElementById("catalog"), term = document.getElementById("app-search").value.toLowerCase().trim();
    grid.textContent = "";
    var apps = C.Catalog.apps.filter(function(a) {
      return (C.settings.showPrayer !== false || a.id !== "local.tvmorph.tv.prayer") && a.name.toLowerCase().indexOf(term) >= 0;
    });
    apps.forEach(function(app) {
      var tile = C.el("article", "catalog-tile");
      var launch = button("", "launch-tile", function() {
        if (picking) {
          togglePin(app.id);
        } else {
          C.Catalog.launch(app);
        }
      });
      launch.setAttribute("aria-label", "Open " + app.name);
      launch.setAttribute("data-app-id", app.id);
      if (picking) {
        launch.setAttribute("aria-label", (isPinned(app.id) ? "Remove " : "Add ") + app.name + (isPinned(app.id) ? " from Home" : " to Home"));
        launch.setAttribute("aria-pressed", isPinned(app.id) ? "true" : "false");
      }
      launch.appendChild(C.Catalog.icon(app));
      launch.appendChild(C.el("span", "app-name", app.name));
      tile.appendChild(launch);
      var pinned = isPinned(app.id), pin = button("", "pin-button" + (pinned ? " pinned" : ""), function() {
        togglePin(app.id);
      });
      pin.innerHTML = C.icon(pinned ? "check" : "plus");
      pin.setAttribute("data-pin-id", app.id);
      if (picking) {
        pin.tabIndex = -1;
        pin.setAttribute("aria-hidden", "true");
      }
      pin.setAttribute("aria-pressed", pinned ? "true" : "false");
      pin.setAttribute("aria-label", (pinned ? "Remove " : "Add ") + app.name + (pinned ? " from Home" : " to Home"));
      tile.appendChild(pin);
      grid.appendChild(tile);
    });
    document.getElementById("app-count").textContent = apps.length + " installed app" + (apps.length === 1 ? "" : "s");
    document.getElementById("catalog-empty").hidden = apps.length !== 0;
  }
  C.catalogArrow = function(code, current) {
    if (!picking || !current.closest("#catalog")) {
      return false;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll("#catalog .launch-tile")), index = cards.indexOf(current);
    if (index < 0) {
      return false;
    }
    var columns = Math.max(1, Math.round(document.getElementById("catalog").clientWidth / cards[0].closest(".catalog-tile").offsetWidth)), next = index + (code === 37 ? -1 : code === 39 ? 1 : code === 38 ? -columns : columns);
    if (code === 38 && index < columns) {
      C.Focus.focus(document.getElementById("search-installed"));
    } else if (next >= 0 && next < cards.length) {
      C.Focus.focus(cards[next]);
    }
    return true;
  };
  function togglePin(id) {
    var app = appByID(id);
    if (!app) {
      return;
    }
    var pinned = isPinned(id);
    if (pinned) {
      pins = pins.filter(function(x) {
        return x !== id;
      });
    } else {
      if (pins.length >= 24) {
        C.toast("Your Home has 24 apps. Remove one before adding another.");
        return;
      }
      pins.push(id);
    }
    C.write("pins", pins);
    renderFavourites();
    renderCatalog();
    var target = Array.prototype.slice.call(document.querySelectorAll(picking ? "#catalog [data-app-id]" : "[data-pin-id]")).filter(function(e) {
      return e.getAttribute(picking ? "data-app-id" : "data-pin-id") === id;
    })[0];
    C.Focus.focus(target);
    C.toast(app.name + (pinned ? " removed from Home." : " added to Home."));
  }
  function loadApps(refresh) {
    if (refresh) {
      C.toast("Refreshing installed apps\u2026");
    }
    C.Catalog.load(function(error) {
      if (error) {
        C.toast("Could not read installed apps. Please try Refresh apps.");
        return;
      }
      initialisePins();
      renderFavourites();
      renderCatalog();
      renderRecent();
      if (refresh) {
        C.toast("Your app list is up to date.");
      }
    });
  }
  function renderRecent() {
    var root = document.getElementById("recent");
    root.textContent = "";
    var recent = C.read("recent", []).map(appByID).filter(Boolean).slice(0, 2);
    if (!recent.length) {
      return;
    }
    root.appendChild(C.el("span", "recent-label", "Recently opened"));
    recent.forEach(function(app) {
      var b = button(app.name, "", function() {
        C.Catalog.launch(app);
      });
      b.setAttribute("aria-label", "Open recent app " + app.name);
      root.appendChild(b);
    });
  }
  function openStore() {
    var store = appByID("com.samsung.tv.store") || byName(/^Samsung Apps$/i);
    if (!store) {
      C.toast("Open Apps from the Samsung Home screen to install new apps.");
      return;
    }
    C.Catalog.launch(store);
  }
  function renderSettings() {
    document.getElementById("clock-format").textContent = C.settings.clock24 ? "24 hour" : "12 hour";
    document.getElementById("temperature-unit").textContent = C.settings.units === "celsius" ? "Celsius \xB0C" : "Fahrenheit \xB0F";
    document.getElementById("location-mode").textContent = C.settings.locationMode === "off" ? "Off" : C.settings.locationMode === "auto" ? "Automatic \xB7 approximate" : C.settings.manualLocation ? C.settings.manualLocation.name : "Choose a city";
    document.getElementById("theme-name").textContent = themeLabels[C.settings.theme] || themeLabels.blue;
    document.getElementById("motion-state").textContent = C.settings.motion ? "Off" : "On";
  }
  function renderWeather(state) {
    var loc = state.location, data = state.data, condition = data ? C.Weather.condition(data.current.weather_code, data.current.is_day) : null;
    document.getElementById("weather-location").textContent = loc ? loc.name : "Your weather";
    document.getElementById("weather-icon").innerHTML = C.icon(condition ? condition.icon : "location");
    document.getElementById("weather-temp").textContent = data ? Math.round(data.current.temperature_2m) + "\xB0" : "--\xB0";
    document.getElementById("weather-condition").textContent = condition ? condition.text : state.loading ? "Finding your approximate location\u2026" : state.error || "Choose a city";
    var range = data && data.daily ? "H " + Math.round(data.daily.temperature_2m_max[0]) + "\xB0  \xB7  L " + Math.round(data.daily.temperature_2m_min[0]) + "\xB0" : state.error || "Choose a city for local weather";
    if (data && state.cached) {
      range = "Saved weather \xB7 refresh unavailable";
    } else if (loc && loc.approximate) {
      range += " \xB7 Approx. area";
    }
    document.getElementById("weather-range").textContent = range;
    if (modalType === "weather" && !overlay.hidden) {
      var id = document.activeElement.id;
      renderForecast();
      if (id) {
        C.Focus.focus(document.getElementById(id));
      }
    }
  }
  C.weatherChanged = renderWeather;
  function renderForecast() {
    content.textContent = "";
    var state = C.Weather.state, loc = state.location, data = state.data;
    if (loc) {
      content.appendChild(C.el("p", "", loc.name + (loc.country ? ", " + loc.country : "")));
    }
    if (data) {
      var condition = C.Weather.condition(data.current.weather_code, data.current.is_day), current = C.el("div", "forecast-current");
      var text = C.el("div");
      text.appendChild(C.el("div", "big-temp", Math.round(data.current.temperature_2m) + "\xB0"));
      text.appendChild(C.el("p", "", condition.text));
      current.appendChild(text);
      var icon = C.el("span", "big-icon");
      icon.innerHTML = C.icon(condition.icon);
      current.appendChild(icon);
      content.appendChild(current);
      if (data.daily) {
        var days = C.el("div", "forecast-days");
        data.daily.time.slice(0, 3).forEach(function(date, i) {
          var day = C.el("div", "forecast-day"), d = /* @__PURE__ */ new Date(date + "T12:00:00");
          day.appendChild(C.el("span", "", i === 0 ? "Today" : d.toLocaleDateString("en", { weekday: "short" })));
          day.appendChild(labelledIcon(C.Weather.condition(data.daily.weather_code[i], 1).icon));
          day.appendChild(C.el("strong", "", Math.round(data.daily.temperature_2m_max[i]) + "\xB0 / " + Math.round(data.daily.temperature_2m_min[i]) + "\xB0"));
          day.appendChild(C.el("small", "", C.Weather.condition(data.daily.weather_code[i], 1).text));
          days.appendChild(day);
        });
        content.appendChild(days);
      }
      var age = state.updatedAt ? Math.max(0, Math.floor((Date.now() - state.updatedAt) / 6e4)) : 0;
      content.appendChild(C.el("p", "muted", (state.cached ? "Saved forecast" : "Updated " + (age < 1 ? "just now" : age + " min ago")) + (loc && loc.approximate ? " \xB7 Location estimated from your network." : "")));
    } else {
      content.appendChild(C.el("p", "forecast-message", state.loading ? "Loading local weather\u2026" : state.error || "Choose a location to see your forecast."));
    }
    if (state.error && data) {
      content.appendChild(C.el("p", "muted", state.error));
    }
    var actions = C.el("div", "actions");
    actions.appendChild(button("Change location", "primary", openLocation, "forecast-location"));
    actions.appendChild(button("Refresh", "secondary", function() {
      C.Weather.load(true);
    }, "forecast-refresh"));
    content.appendChild(actions);
    content.appendChild(C.el("p", "provider-line", "Weather by Open-Meteo \xB7 CC BY 4.0. Approximate location by ipapi.is / ipwho.is."));
  }
  function openWeather() {
    openModal("Your forecast", "weather", renderForecast);
  }
  function openLocation() {
    openModal("Weather location", "location", function() {
      content.appendChild(C.el("p", "", "Automatic location uses your network\u2019s approximate area. If the city is not quite right, choose it below."));
      var auto = button("Use automatic location", "primary", function() {
        C.Weather.automatic();
        renderSettings();
        closeModal();
      }, "location-auto");
      content.appendChild(auto);
      var row = C.el("div", "city-row"), input = C.el("input");
      input.id = "city-input";
      input.type = "search";
      input.placeholder = "City, region or country";
      input.setAttribute("aria-label", "Search a city");
      row.appendChild(input);
      var search = button("Find city", "primary", searchCity, "city-search");
      row.appendChild(search);
      content.appendChild(row);
      content.appendChild(C.el("p", "muted", "Your selected city is saved only on this TV. Network location is an estimate, not GPS."));
      var status = C.el("p", "muted", "");
      status.id = "city-status";
      content.appendChild(status);
      var results = C.el("div", "city-results");
      results.id = "city-results";
      content.appendChild(results);
      var off = button("Turn weather off", "secondary", function() {
        C.settings.locationMode = "off";
        C.saveSettings();
        C.Weather.load(false);
        renderSettings();
        closeModal();
      }, "weather-off");
      content.appendChild(off);
    });
  }
  function searchCity() {
    var input = document.getElementById("city-input"), status = document.getElementById("city-status"), results = document.getElementById("city-results"), term = input.value;
    var seq = ++cityQuery;
    status.textContent = "Searching\u2026";
    results.textContent = "";
    C.Weather.search(term, function(error, locations) {
      if (seq !== cityQuery || modalType !== "location") {
        return;
      }
      status.textContent = error ? error.message : locations.length ? "Choose your city:" : "No cities found. Try a nearby city or add a country.";
      if (error) {
        return;
      }
      locations.forEach(function(loc) {
        var b = button("", "city-result", function() {
          C.Weather.choose(loc);
          renderSettings();
          closeModal();
        });
        b.appendChild(C.el("span", "", loc.name));
        b.appendChild(C.el("small", "", [loc.region, loc.country].filter(Boolean).join(", ")));
        results.appendChild(b);
      });
      if (locations.length) {
        C.Focus.focus(results.querySelector("button"));
      }
    });
  }
  function openProfiles() {
    var ar = document.documentElement.lang === "ar";
    openModal(ar ? "\u0645\u064A\u0646 \u0628\u064A\u062A\u0641\u0631\u062C\u061F" : "Who is watching?", "profiles", function() {
      var rows = document.createElement("div");
      rows.className = "viewer-grid";
      C.Profiles.list().forEach(function(person) {
        var b = button(person.name + (person.id === C.Profiles.active() ? " \u2713" : ""), "viewer-card", function() {
          closeModal();
          C.Profiles.select(person.id);
        });
        rows.appendChild(b);
      });
      content.appendChild(rows);
      var label = C.el("label", "", ar ? "\u0627\u0633\u0645 \u0628\u0631\u0648\u0641\u0627\u064A\u0644 \u062C\u062F\u064A\u062F" : "New profile name");
      label.htmlFor = "viewer-name";
      content.appendChild(label);
      var input = document.createElement("input");
      input.id = "viewer-name";
      input.maxLength = 24;
      content.appendChild(input);
      content.appendChild(button(ar ? "\u0625\u0636\u0627\u0641\u0629 \u0628\u0631\u0648\u0641\u0627\u064A\u0644" : "Add profile", "primary", function() {
        try {
          var id = C.Profiles.create(input.value);
          closeModal();
          C.Profiles.select(id);
        } catch (e) {
          C.toast(e.message);
        }
      }));
    });
  }
  C.familyAction = function(method, value) {
    value = value || {};
    if (method !== "list" && document.getElementById("morph-media-frame")) throw Error("Return to Morph TV Home to switch profiles");
    if (method === "create") C.Profiles.select(C.Profiles.create(value.name));
    else if (method === "select") C.Profiles.select(value.id);
    return { active: C.Profiles.active(), profiles: C.Profiles.list(), settings: C.settings };
  };
  C.openProfiles = openProfiles;
  window.addEventListener("morphViewer", function() {
    pins = C.read("pins", null);
    initialisePins();
    applyAppearance();
    renderFavourites();
    renderCatalog();
    renderRecent();
    renderSettings();
    window.dispatchEvent(new Event("morphAppOrder"));
    var label = document.getElementById("viewer-button");
    if (label) label.textContent = C.Profiles.list().filter(function(p) {
      return p.id === C.Profiles.active();
    })[0].name;
  });
  var viewerButton = button(C.Profiles.list().filter(function(p) {
    return p.id === C.Profiles.active();
  })[0].name, "nav", openProfiles, "viewer-button");
  document.querySelector("header nav").appendChild(viewerButton);
  function openAppearance() {
    openModal("Make it your own", "appearance", function() {
      content.appendChild(C.el("p", "", "Choose a colour palette. Your favourites stay just where you left them."));
      var choices = C.el("div", "theme-options");
      themes.forEach(function(theme) {
        var option = button(themeLabels[theme], "theme-option " + theme, function() {
          if (C.ThemePacks) {
            var required = C.ThemePacks.forTheme(theme);
            if (required && !C.ThemePacks.status(required.id).installed) {
              C.downloadThemePack(required.id, function() {
                option.click();
              });
              return;
            }
          }
          C.applyRemoteConfig({ theme });
          Array.prototype.slice.call(document.querySelectorAll(".theme-option")).forEach(function(b) {
            b.setAttribute("aria-pressed", b.classList.contains(theme) ? "true" : "false");
          });
          C.toast(themeLabels[theme] + " selected.");
        });
        option.setAttribute("aria-pressed", C.settings.theme === theme ? "true" : "false");
        if (theme === "ahly") {
          var crest = document.createElement("img");
          crest.src = C.ThemePacks ? C.ThemePacks.src("assets/al-ahly.png") : "assets/al-ahly.png";
          crest.alt = "";
          option.insertBefore(crest, option.firstChild);
        }
        choices.appendChild(option);
      });
      content.appendChild(choices);
    });
    setTimeout(function() {
      var selected = document.querySelector('.theme-option[aria-pressed="true"]');
      if (selected) C.Focus.focus(selected);
    }, 0);
  }
  function renderInputs(state) {
    var grid = document.getElementById("input-grid"), focused = document.activeElement.getAttribute("data-source"), wasGrid = !!document.activeElement.closest("#input-grid");
    grid.textContent = "";
    state.sources.forEach(function(source) {
      var active = C.Inputs.same(source, state.current), card = button("", "source-card" + (active ? " selected" : ""), function() {
        C.Inputs.watch(source);
      });
      card.setAttribute("data-source", source.type + source.number);
      card.appendChild(labelledIcon(source.type === "TV" ? "tv" : "apps"));
      card.appendChild(C.el("strong", "", C.Inputs.label(source)));
      card.appendChild(C.el("span", "source-state", active ? "Selected" + (source.connected ? " \xB7 Connected" : " \xB7 Not connected") : source.connected ? "Connected" : "Not connected"));
      grid.appendChild(card);
    });
    if (wasGrid) {
      var next = Array.prototype.slice.call(grid.querySelectorAll("button")).filter(function(b) {
        return b.getAttribute("data-source") === focused;
      })[0];
      C.Focus.focus(next || document.getElementById("refresh-inputs"));
    }
    document.getElementById("input-status").textContent = state.loading ? "Reading TV inputs\u2026" : state.error || "Choose HDMI to watch here. Live TV opens the Samsung TV player.";
    document.getElementById("on-now-source").textContent = state.current ? C.Inputs.label(state.current) : "No source information";
    document.getElementById("watch-current").disabled = !state.current;
    var info = document.getElementById("programme-info");
    info.textContent = "";
    if (state.current && state.current.type === "TV") {
      var channel = state.channel, programme = state.program;
      if (channel) {
        info.appendChild(C.el("p", "channel-name", (channel.major || "") + (channel.channelName ? " \xB7 " + channel.channelName : "")));
      }
      if (programme) {
        info.appendChild(C.el("h3", "programme-title", programme.title || programme.name || "Current programme"));
        if (programme.startTime && programme.endTime) {
          try {
            info.appendChild(C.el("p", "programme-time", programme.startTime.toLocaleTimeString() + " \u2013 " + programme.endTime.toLocaleTimeString()));
          } catch (e) {
          }
        }
        if (programme.description) {
          info.appendChild(C.el("p", "programme-description", programme.description));
        }
      } else {
        info.appendChild(C.el("p", "programme-description", "No programme details supplied by this channel. Open Live TV for its guide."));
      }
    } else {
      info.appendChild(C.el("p", "programme-description", state.current && state.current.type === "HDMI" ? "Your connected device provides its own channels and programme guide. Select Watch source to open it." : "Choose Live TV to see broadcast programme details when available."));
    }
  }
  C.inputsChanged = renderInputs;
  C.watchStarted = function() {
    document.getElementById("watch-controls").hidden = false;
    document.getElementById("watch-title").textContent = C.Inputs.label(C.Inputs.state.current);
    C.Focus.setScope(document.getElementById("watch-controls"));
    C.Focus.focus(document.getElementById("watch-back"));
  };
  C.watchStopped = function() {
    document.getElementById("watch-controls").hidden = true;
    C.Focus.setScope(document);
    showView("inputs");
    C.Focus.focus(document.getElementById("watch-current"));
  };
  document.getElementById("home-inputs").onclick = function() {
    showView("inputs");
  };
  document.getElementById("refresh-inputs").onclick = function() {
    C.Inputs.load();
  };
  document.getElementById("watch-current").onclick = function() {
    if (C.Inputs.state.current) {
      C.Inputs.watch(C.Inputs.state.current);
    }
  };
  document.getElementById("watch-back").onclick = function() {
    C.Inputs.stop();
  };
  document.getElementById("open-iptv").onclick = function() {
    var app = byName(/iptv/i);
    if (app) {
      C.Catalog.launch(app);
    } else {
      C.toast("No IPTV app is installed. Find one in Samsung Apps.");
    }
  };
  setInterval(function() {
    if (!document.hidden && (view === "inputs" || C.Inputs.state.watching)) {
      C.Inputs.refreshProgramme();
    }
  }, 6e4);
  function openHelp() {
    openModal("A little help.", "help", function() {
      var ul = C.el("ul", "help-list");
      ["Use \u2191 to reach Home, Your apps and Settings. All menu items work with the remote.", "Choose Add app or Your apps, then select + to pin an installed app. Select \u2713 to remove the shortcut.", "Use Samsung Apps to find and install new TV apps. Refresh Your apps when you return.", "Open Inputs & TV to select HDMI or Live TV. Back returns from HDMI playback. Live TV opens the Samsung TV player. Programme details depend on the source.", "Use \u2190 \u2192 to browse your favourites. The row scrolls as you move.", "Weather location is automatic and approximate. Select the weather card to change the city.", "Back closes a dialog, returns to Home, then exits. The Samsung Home key still opens Smart Hub."].forEach(function(text) {
        ul.appendChild(C.el("li", "", text));
      });
      content.appendChild(ul);
    });
  }
  function openAbout() {
    openModal("Morph TV", "about", function() {
      content.appendChild(C.el("p", "about-credit", "Developed by Karim Aboushousha"));
      content.appendChild(C.el("p", "", "Version 0.8.68 \xB7 A simple, personal home for your TV."));
      content.appendChild(C.el("p", "muted", "Morph TV opens apps already installed on your television. Accounts, subscriptions and playlists remain with those apps."));
      content.appendChild(C.el("p", "muted", "Automatic weather uses ipapi.is (with ipwho.is as a fallback) to estimate a city from your public network address. Coordinates are sent to Open-Meteo for forecasts. Morph TV saves only your selected area, preferences and cached weather on this TV. You can choose a city manually or turn weather off."));
      content.appendChild(C.el("p", "provider-line", "Weather: Open-Meteo.com, CC BY 4.0 \xB7 creativecommons.org/licenses/by/4.0/ \xB7 Approximate location: ipapi.is / ipwho.is."));
    });
  }
  document.querySelectorAll("[data-view]").forEach(function(nav) {
    nav.onclick = function() {
      showView(nav.getAttribute("data-view"), nav);
    };
  });
  document.getElementById("modal-close").onclick = function() {
    closeModal();
  };
  document.getElementById("manage-apps").onclick = openAppPicker;
  document.getElementById("weather-card").onclick = openWeather;
  document.getElementById("home-store").onclick = openStore;
  document.getElementById("apps-store").onclick = openStore;
  document.getElementById("home-internet").onclick = function() {
    if (window.TVNative && TVNative.browser) {
      TVNative.browser();
      return;
    }
    var browser = appByID("org.tizen.browser") || byName(/Internet|Browser|Silk|BrowseHere/i);
    if (browser) C.Catalog.launch(browser);
    else C.toast(document.documentElement.lang === "ar" ? "\u0645\u0641\u064A\u0634 \u0645\u062A\u0635\u0641\u062D \u0645\u062A\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646." : "No browser is available on this TV.");
  };
  document.getElementById("home-appearance").onclick = openAppearance;
  document.getElementById("home-help").onclick = openHelp;
  document.getElementById("refresh-apps").onclick = function() {
    loadApps(true);
  };
  document.getElementById("search-installed").onclick = function() {
    renderCatalog();
    C.Focus.focus(document.querySelector("#catalog .launch-tile") || document.getElementById("clear-search"));
  };
  document.getElementById("clear-search").onclick = function() {
    document.getElementById("app-search").value = "";
    renderCatalog();
    C.Focus.focus(document.getElementById("clear-search"));
  };
  document.getElementById("setting-clock").onclick = function() {
    C.settings.clock24 = !C.settings.clock24;
    C.saveSettings();
    updateClock();
    renderSettings();
  };
  document.getElementById("setting-units").onclick = function() {
    C.settings.units = C.settings.units === "celsius" ? "fahrenheit" : "celsius";
    C.saveSettings();
    C.Weather.state.data = null;
    renderSettings();
    C.Weather.load(true);
  };
  document.getElementById("setting-location").onclick = openLocation;
  document.getElementById("setting-refresh").onclick = function() {
    C.Weather.load(true);
    C.toast("Refreshing weather\u2026");
  };
  document.getElementById("setting-theme").onclick = openAppearance;
  document.getElementById("setting-motion").onclick = function() {
    C.settings.motion = !C.settings.motion;
    C.saveSettings();
    applyAppearance();
    renderSettings();
  };
  document.getElementById("setting-favourites").onclick = openAppPicker;
  document.getElementById("setting-about").onclick = openAbout;
  document.addEventListener("visibilitychange", function() {
    scheduleClock();
    if (!document.hidden) {
      loadApps(false);
      updateNetwork();
    }
  });
  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);
  document.getElementById("preview-badge").hidden = !C.Catalog.preview;
  applyAppearance();
  updateNetwork();
  scheduleClock();
  renderSettings();
  loadApps(false);
  C.Weather.load(false);
  C.Focus.focus(document.querySelector("#favourites .favourite") || document.getElementById("nav-home"));
  C.showView = showView;
  C.closeModal = closeModal;
  C.Inputs.load();
})(window.ClearTV);
