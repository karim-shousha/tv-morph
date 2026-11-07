/* Morph-owned actions only. Installed application logos remain authoritative. */
(function(w){'use strict';
 var paths={bridge:'<rect x="8" y="3" width="14" height="11" rx="2"/><path d="M15 14v4M12 18h7M13 7a5 5 0 0 1 5 5M13 10a2 2 0 0 1 2 2"/><rect x="2" y="10" width="7" height="12" rx="1.5"/><path d="M5 19h1"/>',sports:'<path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v6M8 21h8"/>',iptv:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/><path d="m10 7 5 3.5-5 3.5Z"/>',radio:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M5 7 18 3M14 12h4M14 16h4"/><circle cx="8" cy="14" r="2.5"/>',kids:'<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m8 2 4 3 4-3M8 13q4 4 8 0M8 22h8"/><path d="M8 9h.01M16 9h.01"/>',performance:'<path d="M4 18a9 9 0 1 1 16 0M12 12l5-5"/><circle cx="12" cy="12" r="2"/>',family:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  fitness:'<path d="M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12"/>',
  prayer:'<path d="M18 3a9 9 0 1 0 3 14A8 8 0 0 1 18 3Z"/>',
  inputs:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/>',
  store:'<path d="M4 8h16l1 13H3L4 8ZM8 8V6a4 4 0 0 1 8 0v2"/>',
  internet:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  appearance:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/>'};
 var detailed={
 hdmi:'<path d="M4 4h16v6l-3 4H7l-3-4z"/><path d="M7 7h10v3H7z" stroke-width="1"/><text x="12" y="22" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="5.5" font-weight="700">HDMI</text>',
  inputs:'<rect x="2" y="3" width="20" height="14" rx="3.5" fill="currentColor" fill-opacity=".16"/><path d="M5 6h14" stroke="#fff" stroke-opacity=".5"/><path d="M12 17v4M8 21h8"/><rect x="7" y="8" width="10" height="5" rx="1" fill="currentColor" fill-opacity=".25" stroke-width="1"/>',
 iptv:'<rect x="2" y="4" width="20" height="14" rx="3.5" fill="currentColor" fill-opacity=".14"/><path d="m10 8 5 3.5-5 3.5Z" fill="currentColor" stroke="none"/><path d="M8 22h8M12 18v4"/><path d="M6 6h12" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>',
 radio:'<path d="m5 6 13-4"/><rect x="2" y="6" width="20" height="15" rx="4" fill="currentColor" fill-opacity=".15"/><circle cx="8" cy="14" r="3.5" fill="currentColor" fill-opacity=".18"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><path d="M15 11h4M15 15h4"/><path d="M5 8h13" stroke="#fff" stroke-opacity=".45" stroke-width="1"/><circle cx="17" cy="18" r=".75" fill="currentColor" stroke="none"/>',
 bridge:'<rect x="8" y="2" width="14" height="12" rx="3" fill="currentColor" fill-opacity=".16"/><path d="M15 14v4M12 18h7M12 6h6"/><rect x="2" y="9" width="8" height="13" rx="2.5" fill="currentColor" fill-opacity=".3"/><path d="M5 18h2M12 9a4 4 0 0 1 5 4"/><path d="M4 11h4" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>'
 };
 function svg(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(detailed[name]||paths[name]||paths.appearance)+'</svg>';}
 w.MorphIcons={svg:svg};
})(window);
