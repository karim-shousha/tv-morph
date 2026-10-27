/* Morph-owned actions only. Installed application logos remain authoritative. */
(function(w){'use strict';
 var paths={performance:'<path d="M4 18a9 9 0 1 1 16 0M12 12l5-5"/><circle cx="12" cy="12" r="2"/>',family:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
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
