/* Assign semantic roles once, including content inserted by inner-page renderers. */
(function(w,d){'use strict';
 d.documentElement.id='morph-phone-ui';
 var roles={
  'phone-card':'.theme,.pm-service-card,#phone-support-invitation>section,.fr-service,.panel,.manual,.install-card,.pm-remote-info,.pm-remote-showcase,.pm-iptv-feature,.iptv-source-card,.app-row,.approved-preview-card,.customization-menu,.theme-library,.studio-personal-group>details,.s310-group,.s310-card,.wf-tile,.wf-prayer-form,.wf-text-card,.wf-tasbih-panel,.wf-mushaf,.wf-resume,.wf-bookmark-row,.wf-prayer-times,.mp-league,.mp-match,.mp-empty,.support-card,.operation-card,.morph-plus-dialog',
  'phone-hero':'.pm-page-intro,.reference-device-hero,#studio-design-hero,.wf-hero,.mp-hero',
  'phone-list':'.s310-group,.settings-group',
  'phone-disclosure':'.connect-step',
  'phone-tabs':'.m30-segment,.iptv-tabs',
  'phone-row':'.wf-surah,.wf-prayer-row,.wf-prayer-field',
  'phone-reading':'.wf-sacred-text,.wf-ayah>p',
  'phone-caption':'#phone-settings-v2 h3,.s310-section>h3,.fine,.eyebrow,.pm-overline,.wf-eyebrow,.wf-local-note,.wf-reference p,.mp-eyebrow',
  'phone-input':'input:not([type=range]):not([type=checkbox]):not([type=color]),select,textarea'
 };
 function decorate(){

  d.querySelectorAll('img.brand-wordmark,img.matches-app-wordmark,img[src="morph-wordmark.webp"]').forEach(function(image){if(image.closest('.phone-symbol-brand'))return;var brand=d.createElement('span');brand.className='phone-symbol-brand';brand.dir='ltr';brand.setAttribute('aria-label','Morph TV');image.parentNode.insertBefore(brand,image);image.src='morph-header-symbol.webp';image.alt='';brand.appendChild(image);var text=d.createElement('span');text.textContent='orph TV';brand.appendChild(text);});

  Object.keys(roles).forEach(function(role){d.querySelectorAll(roles[role]).forEach(function(el){el.classList.add(role);});});
  d.querySelectorAll('.page h1,#page-matches h1,#phone-settings-v2 h1,.s310-title').forEach(function(el){el.classList.add('phone-title');});
  d.querySelectorAll('.page h2,#page-matches h2,#phone-settings-v2 h2').forEach(function(el){if(!el.classList.contains('phone-title'))el.classList.add('phone-section-title');});
  d.querySelectorAll('.page p,#page-matches p').forEach(function(el){if(!el.closest('.preview,.theme-swatch')&&!el.classList.contains('phone-reading'))el.classList.add('phone-body');});
  d.querySelectorAll('.page button').forEach(function(el){if(!el.closest('.preview')&&!el.matches('.wf-tile,.wf-surah,.wf-back'))el.classList.add('phone-button');});
 }
 function init(){decorate();var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decorate();});}).observe(d.body,{childList:true,subtree:true});}
 w.MorphPhoneDesign={refresh:decorate};
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
