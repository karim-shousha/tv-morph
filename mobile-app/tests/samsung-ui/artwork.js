(function(C) {
  "use strict";
  function valid(value) {
    return typeof value === "string" && value.length < 1e6 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  }
  function image(node, value, fallback) {
    if (!node) return;
    if (!node.dataset.originalSrc) node.dataset.originalSrc = node.getAttribute("src") || "";
    var source = valid(value) ? value : fallback || node.dataset.originalSrc;
    node.src = C.ThemePacks ? C.ThemePacks.src(source) : source;
  }
  C.applyArtwork = function() {
    var logo = C.settings.logoImage, art = C.settings.artImage, club = (C.ClubThemes || {})[C.settings.theme];
    document.body.dataset.clubTheme = club ? "true" : "false";
    document.body.classList.toggle("has-personal-logo", valid(logo));
    document.querySelectorAll(".club-hero-logo,.club-crest,.club-watermark img").forEach(function(node) {
      image(node, logo, club ? "assets/" + club.logo : C.settings.theme === "ahly" ? "assets/al-ahly.png" : null);
    });
    document.querySelectorAll(".club-team-photo img").forEach(function(node) {
      image(node, art, club && club.art ? "assets/" + club.art : C.settings.theme === "ahly" ? "assets/al-ahly-duel.png" : C.settings.theme === "blue" ? "assets/twilight-entertainment-v4.webp" : null);
    });
    var brand = document.getElementById("personal-brand");
    if (!brand) {
      brand = document.createElement("img");
      brand.id = "personal-brand";
      brand.alt = "";
      document.querySelector("header .brand").prepend(brand);
    }
    brand.hidden = !valid(logo);
    if (valid(logo)) brand.src = logo;
    var hero = document.getElementById("personal-art");
    if (hero) hero.remove();
    document.body.classList.toggle("has-personal-art", valid(art));
    document.body.classList.toggle("has-hero-logo", !!club || C.settings.theme === "ahly" || valid(logo));
  };
})(window.ClearTV);
