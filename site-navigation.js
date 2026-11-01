'use strict';
(()=>{
 const header=document.querySelector('.header'),menu=document.getElementById('menu-toggle'),products=header.querySelector('.products-trigger'),switcher=header.querySelector('.product-switcher');
 function closeMenus(){header.classList.remove('navigation-open');switcher.classList.remove('products-open');menu.setAttribute('aria-expanded','false');products.setAttribute('aria-expanded','false');}
 menu.addEventListener('click',()=>{const open=!header.classList.contains('navigation-open');closeMenus();header.classList.toggle('navigation-open',open);menu.setAttribute('aria-expanded',String(open));});
 products.addEventListener('click',()=>{const open=!switcher.classList.contains('products-open');switcher.classList.toggle('products-open',open);products.setAttribute('aria-expanded',String(open));});
 products.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();switcher.classList.add('products-open');products.setAttribute('aria-expanded','true');switcher.querySelector('a').focus();}});
 document.addEventListener('click',event=>{if(!header.contains(event.target)||event.target.closest('.header a'))closeMenus();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const mobile=header.classList.contains('navigation-open');const open=mobile||switcher.classList.contains('products-open');closeMenus();if(open)(mobile?menu:products).focus();}});
 window.addEventListener('hashchange',closeMenus);
 matchMedia('(max-width:1000px)').addEventListener('change',closeMenus);
})();
