/* Samsung IME owns keys while editing Plus. Do not cancel text entry defaults. */
(function(w,d){'use strict';
 if(w.MorphSamsungPlusIme)return;w.MorphSamsungPlusIme=true;
 function input(){var e=d.activeElement;return e&&e.id==='plus-code'&&!e.readOnly&&!e.disabled?e:null;}
 w.addEventListener('focusin',function(){if(input()&&w.ClearTV)ClearTV.keyboardVisible=true;},true);
 w.addEventListener('focusout',function(e){if(e.target&&e.target.id==='plus-code'&&w.ClearTV)ClearTV.keyboardVisible=false;},true);
 w.addEventListener('keydown',function(e){var field=input();if(!field)return;
  // Document-level spatial navigation and Enter handlers otherwise blur the
  // field before Samsung can open/use its keyboard (including empty input).
  e.stopImmediatePropagation();
  var code=e.keyCode||e.which;
  if(code===65376||code===65385||code===10009||code===27){
   var panel=field.closest('.morph-plus-overlay');field.blur();
   if(w.ClearTV)ClearTV.keyboardVisible=false;
   var next=panel&&panel.querySelector(code===65376?'.plus-activate':'.plus-close');
   if(next&&!next.disabled){if(w.ClearTV&&ClearTV.Focus)ClearTV.Focus.focus(next);else next.focus();}
  }
 },true);
})(window,document);
