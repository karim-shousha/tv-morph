/* Native multi-view is exposed only on platforms that can create independent players. */
(function(){'use strict';
 if(!window.IptvNative||typeof IptvNative.supportsMultiView!=='function'||!IptvNative.supportsMultiView())return;
 var nav=document.querySelector('header nav'),cards=document.querySelector('.portal-grid');if(!nav||!cards)return;
 function tr(a,b){return window.MorphLocale?MorphLocale.t(a,b):b;}
 var open=document.createElement('button'),card=document.createElement('button');open.id='multiview-open';card.id='home-multiview';open.dataset.noTranslate=card.dataset.noTranslate='';card.innerHTML='<img class="portal-icon" src="icon-live.svg" alt=""><strong></strong><small></small>';
 function launch(){IptvNative.multiView(window.IptvUI&&IptvUI.multiViewFavorites?IptvUI.multiViewFavorites():'[]');}
 open.onclick=card.onclick=launch;nav.appendChild(open);cards.appendChild(card);
 function labels(){open.textContent=tr('٤ شاشات','Multi-view');card.querySelector('strong').textContent=tr('شاشات متعددة','Multi-view');card.querySelector('small').textContent=tr('حتى ٤ قنوات · اختر الصوت والتقسيمة','Up to 4 channels · choose audio and layout');}
 window.addEventListener('morphLanguage',labels);labels();
})();
