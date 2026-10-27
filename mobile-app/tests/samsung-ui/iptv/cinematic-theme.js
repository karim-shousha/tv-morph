(function(w) {
  "use strict";
  if (!/width=1920/.test(document.querySelector("meta[name=viewport]").content)) return;
  var root = document.documentElement, last = "", meta = document.querySelector("meta[name=tvm-media-root]"), base = meta ? meta.content : "../tv/", artNames = { blue: "twilight-entertainment-v4.webp", ahly: "al-ahly-duel.png", argentina: "argentina-champions-hq.webp", portugal: "portugal-team.png", basketball: "basketball-team.png", baseball: "baseball-team.png", montreal: "montreal-team.png", toronto: "toronto-team.png", barcelona: "barcelona-team.png", madrid: "madrid-team.png", egypt: "egypt-national-team-v1.png", zamalek: "zamalek-team.png" };
  root.setAttribute("data-media-cinema", "");
  function configuration() {
    try {
      if (parent !== w && parent.ClearTV) return parent.ClearTV.settings;
      var viewer = localStorage.getItem("cleartv.activeViewer") || "default";
      if (!/^(default|v[0-9a-z]+)$/.test(viewer)) viewer = "default";
      return JSON.parse(localStorage.getItem("cleartv." + (viewer === "default" ? "" : "viewer." + viewer + ".") + "settings")) || {};
    } catch (e) {
      return {};
    }
  }
  function apply() {
    var cfg = configuration(), bridge = w.IptvNative || w.RadioNative;
    try {
      if (!cfg.theme && bridge && bridge.settingsJson) cfg = JSON.parse(bridge.settingsJson());
    } catch (e) {
    }
    var theme = cfg.theme || "blue", native = parent === w, source = "", packs = native ? w.ThemePacks : parent.ThemePacks;
    root.style.setProperty("--media-secondary", theme === "blue" ? "#7948ef" : "var(--media-card)");
    if (theme === "blue" && !cfg.highlightColor && !cfg.accent) root.style.setProperty("--media-accent", "#428cff");
    if (typeof cfg.artImage === "string" && cfg.artImage.length < 1e6 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(cfg.artImage)) source = cfg.artImage;
    else if (artNames[theme]) {
      source = base + "assets/" + artNames[theme];
      if (packs) source = packs.src(source);
    }
    var signature = theme + "|" + source;
    if (signature !== last) {
      last = signature;
      root.style.setProperty("--media-art", source ? "url(" + JSON.stringify(source) + ")" : "none");
      root.dataset.mediaTheme = theme;
    }
    var image = document.querySelector(".cinematic-hero-art");
    if (image && !image.hasAttribute("data-category-art")) {
      image.hidden = !source;
      if (source && image.getAttribute("src") !== source) image.src = source;
    }
  }
  w.MediaTheme = { apply };
  apply();
  w.addEventListener("load", apply);
  w.addEventListener("focus", apply);
  w.addEventListener("morphPacks", apply);
  w.addEventListener("storage", apply);
  if (parent !== w) {
    try {
      parent.addEventListener("morphPacks", apply);
      parent.addEventListener("morphViewer", apply);
    } catch (e) {
    }
  } else {
    var script = document.createElement("script");
    script.src = base + "theme-packs-manifest.js";
    script.onload = function() {
      var loader = document.createElement("script");
      loader.src = base + "theme-packs.js";
      loader.onload = function() {
        Promise.resolve(w.ThemePacks.ready).then(apply);
      };
      document.head.appendChild(loader);
    };
    document.head.appendChild(script);
  }
})(window);
