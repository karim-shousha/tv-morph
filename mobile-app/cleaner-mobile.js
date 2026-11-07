/* Handheld guidance only. The shared TV Cleaner and deletion rules stay intact. */
(function () {
 'use strict';
 var root=document.getElementById('morph-cleaner');
 if(!root||!window.MorphCleaner)return;
 var ar=document.documentElement.lang==='ar';
 var intro=root.querySelector('.cleaner-intro');
 intro.textContent=ar?'اختار المجلد اللي عايز تنظفه، وبعد الفحص حدّد الملفات وراجعها قبل الحذف.':'Choose a folder to clean, then scan, select files and review before deleting.';
 var folder=root.querySelector('[data-cleaner-scope="folder"]');
 if(folder){
  var card=document.createElement('section');card.className='cleaner-phone-access';
  var title=document.createElement('strong');title.textContent=ar?'ملفات الموبايل':'Phone files';card.appendChild(title);
  var text=document.createElement('p');text.textContent=ar?'علشان تظهر ملفاتك، اختار مجلد من مدير الملفات واضغط «استخدام هذا المجلد». التطبيق يشوف المجلد اللي تسمح له بيه فقط.':'To show your files, choose a folder in the file picker and tap “Use this folder”. Only the folder you allow can be scanned.';card.appendChild(text);
  var button=document.createElement('button');button.type='button';button.className='cleaner-phone-folder';button.textContent=ar?'اختيار مجلد من الموبايل':'Choose a phone folder';button.onclick=function(){MorphCleaner.scan('folder');};card.appendChild(button);
  root.insertBefore(card,root.querySelector('.cleaner-toolbar'));
 }
 var cache=root.querySelector('[data-cleaner-scope="cache"]');
 if(cache)cache.textContent=ar?'كاش Morph TV':'Morph TV cache';
})();
