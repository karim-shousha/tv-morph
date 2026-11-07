/* Desktop presentation: retain shared forms and allow physical typing directly. */
(function(){'use strict';
function enable(){document.querySelectorAll('input:not([type=range])').forEach(function(input){input.readOnly=false;input.removeAttribute('inputmode');input.removeAttribute('onkeydown');});}
enable();window.addEventListener('load',enable);
document.addEventListener('focusin',function(e){var input=e.target;if(input&&['search','unified-query'].indexOf(input.id)>=0){input.readOnly=false;input.removeAttribute('inputmode');}},true);
window.IptvAccountKeyboard={back:function(){return false;},isOpen:function(){return false;},fieldBlurred:function(){return false;},activate:function(field){field.readOnly=false;field.focus();return true;},keyboardClosed:function(){return false;}};
/* At a text boundary, arrows can leave library search for adjacent controls.
   Inside a query they retain normal caret/selection behavior. */
var editingSearch=null;
document.addEventListener('input',function(e){if(e.target&&e.target.id==='search')editingSearch=e.target;},true);
document.addEventListener('focusout',function(e){if(e.target===editingSearch)editingSearch=null;},true);
document.addEventListener('keydown',function(e){var input=e.target;if(!input||input.id!=='search'||e.isComposing||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.keyCode!==37&&e.keyCode!==39)return;var left=e.keyCode===37,start=input.selectionStart,end=input.selectionEnd,boundary=start===end&&(left?start===0:end===input.value.length);if(editingSearch===input&&!boundary)return;if(window.IptvCinemaNavigation&&IptvCinemaNavigation.move(e.keyCode)){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keydown',function(e){var input=e.target;if(!input||!['INPUT','TEXTAREA'].includes(input.tagName)||input.type==='range')return;if(e.keyCode===27){input.blur();return;}if(e.keyCode===13&&input.id==='search'){editingSearch=null;var search=document.getElementById('search-go');if(search)search.click();}else if(e.keyCode===13&&input.id==='unified-query'){document.getElementById('unified-go').click();}else if(e.keyCode===13&&input.id==='account-password'){document.getElementById('account-save').click();}},true);
window.addEventListener('load',function(){document.querySelectorAll('input[type=search]').forEach(function(input){input.readOnly=false;});});
})();
