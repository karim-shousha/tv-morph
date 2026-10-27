/* Enhance existing navigation surfaces without creating or rerouting actions. */
(function(w){'use strict';
 var names={launcher:'inputs',performance:'performance',appearance:'appearance',apps:'family',iptv:'inputs',prayer:'prayer',time:'clock',general:'settings',about:'help'};
 function apply(mode){if(!w.MorphIcons)return;mode=typeof mode==='string'?mode:w.ClearTV&&ClearTV.settings.uiMode||'classic';Object.keys(names).forEach(function(key){var b=document.getElementById('settings-category-'+key+'-entry');if(!b)return;var current=b.querySelector('.ui-section-icon');if(mode!=='modern'){if(current&&b._uiClassicIcon)current.parentNode.replaceChild(b._uiClassicIcon,current);return;}if(current)return;var old=b.querySelector('svg');if(!old)return;b._uiClassicIcon=old;var icon=document.createElement('span');icon.className='ui-section-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=MorphIcons.svg(names[key]);old.parentNode.replaceChild(icon,old);});}
 w.MorphInternalUI={apply:apply};if(document.readyState==='complete')apply();else w.addEventListener('load',apply);
})(window);
