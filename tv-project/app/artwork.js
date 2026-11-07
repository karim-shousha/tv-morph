(function(C){'use strict';
 function valid(value){return typeof value==='string'&&value.length<1000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);}
 function image(node,value,fallback){if(!node)return;if(!node.dataset.originalSrc)node.dataset.originalSrc=node.getAttribute('src')||'';var source=valid(value)?value:(fallback||node.dataset.originalSrc);node.src=C.ThemePacks?C.ThemePacks.src(source):source;}
 C.applyArtwork=function(){var retired=false;["logoImage","heroLogoSize","logoOffsetX","logoOffsetY"].forEach(function(k){if(Object.prototype.hasOwnProperty.call(C.settings,k)){delete C.settings[k];retired=true;}});if(retired&&C.saveSettings)C.saveSettings();var art=C.settings.artImage,club=(C.ClubThemes||{})[C.settings.theme];document.body.dataset.clubTheme=club?'true':'false';document.querySelectorAll('.club-team-photo img').forEach(function(node){image(node,art,club&&club.art?'assets/'+club.art:C.settings.theme==='ahly'?'assets/ahly-team-cutout-v2.webp':null);});
  // Keep artwork in its own hero column; the old second overlay covered club copy.
  var hero=document.getElementById('personal-art');if(hero)hero.remove();document.body.classList.toggle('has-personal-art',valid(art));document.body.classList.remove('has-hero-logo','has-personal-logo');
 };
})(window.ClearTV);
