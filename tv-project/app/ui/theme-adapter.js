/* Presentation only: never downloads assets, changes a license, or writes settings. */
(function(w){'use strict';
 var C=w.ClearTV,base={blue:['#63caff','#14283e'],night:['#8aaeff','#101421'],emerald:['#68e8ba','#0d302e'],amber:['#ffc680','#302017'],violet:['#cda2ff','#241632'],ahly:['#ff4769','#300c1b']};
 var keys=['blue','night','emerald','amber','violet','ahly','zamalek','barcelona','madrid','egypt','basketball','baseball','montreal','toronto','argentina','portugal','ismaily','king-salman','crown-prince','nassr','hilal','ittihad','ahli-saudi','inter-miami','saudi-national','egypt-national','blue-cinema','gta6'];
 var scenes={'gta6':true,'blue-cinema':true,'saudi-national':true,'egypt-national':true};
 function hex(v,fallback){return /^#[0-9a-f]{6}$/i.test(v||'')?v:fallback;}
 function rgb(s){return [parseInt(s.substr(1,2),16),parseInt(s.substr(3,2),16),parseInt(s.substr(5,2),16)];}
 function rgba(s,a){return 'rgba('+rgb(s).join(',')+','+a+')';}
 function mix(a,b,t){var x=rgb(a),y=rgb(b);return '#'+x.map(function(n,i){var v=Math.round(n+(y[i]-n)*t).toString(16);return v.length<2?'0'+v:v;}).join('');}
 function luminance(s){return rgb(s).map(function(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce(function(sum,v,i){return sum+v*[.2126,.7152,.0722][i];},0);}
 function readable(text,bg,minimum){var value=text;for(var i=0;i<12;i++){var a=luminance(value),b=luminance(bg);if((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=minimum)return value;value=mix(value,'#ffffff',.22);}return '#ffffff';}
 function resolve(settings){var s=settings||{},id=keys.indexOf(s.theme)>=0?s.theme:'blue',club=(C.ClubThemes||{})[id]||{},p=base[id]||['#63caff','#14283e'];
  var accent=hex(s.highlightColor,hex(s.accent,hex(club.primary,p[0]))),identity=hex(club.secondary,p[1]),bg=hex(s.backgroundStart,mix(identity,'#030610',.7)),raised=mix(hex(s.cardColor,identity),'#050916',.45);
  /* Retain the user's hue as a safe tonal surface; never rewrite the saved color. */
  while(luminance(raised)>.075)raised=mix(raised,'#050916',.12);
  var focus=readable(accent,raised,4.5),text=readable(hex(s.textColor,'#f7f9ff'),raised,7),secondary=id==='blue'||id==='blue-cinema'?'#a88aff':readable(mix(accent,identity,.25),raised,3);
  var opacity=Math.max(.48,Math.min(.88,.42+(Number(s.glassOpacity)||18)/150)),custom=/^data:image\/(png|jpeg|webp);base64,/.test(s.artImage||''),slides=s.slideshowEnabled&&Array.isArray(s.backgroundImages)&&s.backgroundImages.length;
  return {theme:id,art:{fit:'contain',position:club.portrait?'right center':'right top',width:custom||slides||scenes[id]?'100%':club.portrait?'66%':'78%',height:'100%',custom:custom,slideshow:!!slides,source:custom?s.artImage:club.art|| (id==='ahly'?'al-ahly-duel.webp':'')},tokens:{
   '--ui-bg':bg,'--ui-bg-raised':raised,'--ui-glass-color':identity,'--ui-glass-opacity':String(opacity),
   '--ui-card-bg':rgba(raised,.8),'--ui-card-border':rgba(focus,.28),'--ui-text':text,'--ui-text-muted':readable(mix(text,raised,.24),raised,4.5),
   '--ui-accent':accent,'--ui-accent-secondary':secondary,'--ui-button-gradient':'linear-gradient(120deg,'+accent+','+secondary+')',
   '--ui-focus-ring':focus,'--ui-focus-glow':rgba(focus,.38),'--ui-dock-bg':rgba(raised,opacity),'--ui-dock-border':rgba(focus,.3),
   '--ui-art-scrim':'linear-gradient(90deg,'+rgba(mix(bg,'#030610',.7),.96)+','+rgba(mix(bg,'#030610',.7),.68)+' 33%,'+rgba(bg,.08)+' 73%)',
   '--ui-overlay-bg':rgba(bg,.9),'--ui-art-width':custom||slides||scenes[id]?'100%':club.portrait?'66%':'78%',
   '--ui-art-position':club.portrait?'right center':'right top','--ui-art-fit':'contain'
  }};
 }
 function apply(){var value=resolve(C.settings);Object.keys(value.tokens).forEach(function(key){document.body.style.setProperty(key,value.tokens[key]);});document.body.setAttribute('data-ui-theme',value.theme);return value;}
 w.MorphThemeAdapter={keys:keys.slice(),resolve:resolve,apply:apply,contrast:function(a,b){var x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}};
})(window);
