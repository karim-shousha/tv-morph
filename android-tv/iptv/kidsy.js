/* One built-in channel, shared by the phone and TV IPTV library. No provider account or favorites are changed. */
(function(){'use strict';
 var label='Kidsy · كيدزي',description='قناة الأطفال · Kids live TV';
 function open(){if(window.TvIptvLayout&&TvIptvLayout.stopLivePreview)TvIptvLayout.stopLivePreview();if(window.IptvNative&&typeof IptvNative.kids==='function'){IptvNative.kids();return;}var note=document.getElementById('dashboard-status');if(note)note.textContent='Open Kidsy in the installed Morph TV app.';}
 var nav=document.querySelector('header nav'),grid=document.querySelector('.portal-grid');if(!nav||!grid)return;
 var tab=document.createElement('button');tab.id='kidsy-open';tab.textContent=label;tab.setAttribute('data-no-translate','');tab.onclick=open;nav.appendChild(tab);

})();
