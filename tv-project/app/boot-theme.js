(function(w){'use strict';
 var html=document.documentElement;html.classList.add('theme-starting');
 function paint(){try{var viewer=localStorage.getItem('cleartv.activeViewer')||'default';if(!/^(default|v[0-9a-z]+)$/.test(viewer))viewer='default';var cfg=w.ClearTV?w.ClearTV.settings:JSON.parse(localStorage.getItem('cleartv.'+(viewer==='default'?'':'viewer.'+viewer+'.')+'settings')||'{}'),theme=cfg.theme||'blue';var backgrounds={"saudi-national":"radial-gradient(ellipse at 80% 30%,#168451,#042d24 75%)","egypt-national":"radial-gradient(ellipse at 85% 25%,#67303b,#101b28 70%)","inter-miami":"radial-gradient(ellipse at 90% 15%,#f7b5cd44,transparent 60%),linear-gradient(125deg,#0b0b0e,#30212a)",blue:'radial-gradient(ellipse at 99% 7%,#c0d3d699,transparent 50%),radial-gradient(ellipse 140% 90% at 122% 125%,#234f6666 49%,transparent 49.2%),radial-gradient(ellipse 130% 95% at 115% 120%,#92bdc944 60%,transparent 60.2%),linear-gradient(110deg,#111c31 5%,#245777 54%,#81b8c3 100%)',night:'linear-gradient(130deg,#090d1b,#28324b)',emerald:'linear-gradient(130deg,#10242b,#39636b 65%,#8fb1ad)',amber:'linear-gradient(130deg,#251923,#815d56 65%,#c6a279)',violet:'linear-gradient(130deg,#17142d,#504271 65%,#9a88b7)'};var background=backgrounds[theme]||'linear-gradient(120deg,#142236,#82c1c9)';if(/^#[0-9a-f]{6}$/i.test(cfg.backgroundStart||'')&&/^#[0-9a-f]{6}$/i.test(cfg.backgroundEnd||''))background='linear-gradient(125deg,'+cfg.backgroundStart+','+cfg.backgroundEnd+')'; var landscape=document.querySelector('.landscape');if(landscape)background=getComputedStyle(landscape).backgroundImage;html.style.setProperty('--startup-background',background);}catch(e){}}
 paint();

 function reveal(){html.classList.remove('theme-starting');html.setAttribute('data-theme-ready','true');}
 function prepare(){var C=w.ClearTV;if(!C||!C.applyRemoteConfig){reveal();return;}var finished=false,timer;
  function done(){if(finished)return;finished=true;clearTimeout(timer);reveal();}
  function apply(){if(finished)return;C.applyRemoteConfig({});paint();var image=document.querySelector('#cinema-background>img'),backdrop=document.getElementById('cinema-background');if(image&&backdrop&&C.settings.theme!=='blue'&&/twilight-entertainment-v4/.test(image.getAttribute('src')||''))backdrop.hidden=true;if(!image||!backdrop||backdrop.hidden||image.complete){done();return;}image.addEventListener('load',done);image.addEventListener('error',done);}
  timer=setTimeout(function(){var image=document.querySelector('#cinema-background>img');if(image&&!image.complete)image.style.visibility='hidden';done();},5000);
  Promise.all([w.ThemePacks?(w.ThemePacks.displayReady||w.ThemePacks.ready):null,w.MorphPlus?MorphPlus.ready:null]).then(function(){setTimeout(apply,0);},function(){setTimeout(apply,0);});
 }
 // Core scripts have run at DOM ready; weather and other nonessential images
 // must not hold the entire Home screen behind the startup cover.
 window.addEventListener('DOMContentLoaded',prepare);setTimeout(function(){if(html.classList.contains('theme-starting'))reveal();},7000);
})(window);
