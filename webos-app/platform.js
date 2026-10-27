/* LG preview: no automatic launches, system settings changes or private Luna calls. */
(function(){'use strict';
 ['keydown','keyup'].forEach(function(type){document.addEventListener(type,function(e){if(e.keyCode!==461)return;e.preventDefault();e.stopImmediatePropagation();var mapped=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(mapped,'keyCode',{value:27});(e.target||document).dispatchEvent(mapped);},true);});
 window.MorphLG={exit:function(){if(window.webOS)webOS.platformBack();},note:function(){ClearTV.toast('LG Preview · Connect from the phone with Developer Mode. LG Home and automatic startup are not replaced.');}};
})();
