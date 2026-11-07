'use strict';
(()=>{
 const key='morph.preview.theme';
 let theme='light';
 try{theme=localStorage.getItem(key)==='dark'?'dark':'light';}catch{}
 document.documentElement.dataset.theme=theme;
 function paint(){
  const button=document.getElementById('theme-toggle');
  if(!button)return;
  const en=document.documentElement.lang==='en',light=theme==='light';
  const label=light?(en?'Switch to dark theme':'التبديل للثيم الغامق'):(en?'Switch to light theme':'التبديل للثيم الفاتح');
  button.setAttribute('aria-label',label);button.title=label;
  button.setAttribute('aria-pressed',String(light));
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(light?'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>')+'</svg>';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f4f7fb':'#111b30');
 }
 document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('theme-toggle').addEventListener('click',()=>{
   theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;
   try{localStorage.setItem(key,theme);}catch{}
   paint();
  });
  paint();window.addEventListener('morphlanguagechange',paint);
 });
})();
