(function(C){'use strict';
 var builtins=[{id:'local.tvmorph.tv.prayer',name:'Prayer times'},{id:'local.tvmorph.tv.play',name:'Morph IPTV'},{id:'local.tvmorph.tv.radio',name:'Morph Radio'},{id:'local.tvmorph.tv.bridge',name:'Morph Bridge'}];
 var load=C.Catalog.load,launch=C.Catalog.launch;
 C.Catalog.load=function(callback){var self=this;load.call(self,function(error){if(!error)self.apps=builtins.concat(self.apps.filter(function(a){return !builtins.some(function(b){return a.id===b.id;});}));callback(error,self.apps);});};
 function recent(app){var ids=C.read('recent',[]).filter(function(id){return id!==app.id;});ids.unshift(app.id);C.write('recent',ids.slice(0,5));}
 C.Catalog.launch=function(app){if(app&&app.id==='local.tvmorph.tv.bridge'){C.BridgeReceiver.open();recent(app);return;}if(app&&app.id==='local.tvmorph.tv.kids'){C.Kids.open();recent(app);return;}if(app&&app.id==='local.tvmorph.tv.prayer'){C.Prayer.open();recent(app);return;}if(app&&app.id===builtins[1].id){SamsungMedia.open('iptv');recent(app);return;}if(app&&app.id===builtins[2].id){SamsungMedia.open('radio');recent(app);return;}launch.call(this,app);};
})(window.ClearTV);
