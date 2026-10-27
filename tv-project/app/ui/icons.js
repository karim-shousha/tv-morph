/* Morph-owned actions only. Installed application logos remain authoritative. */
(function(w){'use strict';
 var paths={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  fitness:'<path d="M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12"/>',
  prayer:'<path d="M18 3a9 9 0 1 0 3 14A8 8 0 0 1 18 3Z"/>',
  inputs:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/>',
  store:'<path d="M4 8h16l1 13H3L4 8ZM8 8V6a4 4 0 0 1 8 0v2"/>',
  internet:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  appearance:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/>'};
 function svg(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.appearance)+'</svg>';}
 w.MorphIcons={svg:svg};
})(window);
