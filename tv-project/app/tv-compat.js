/* Runtime helpers for older Samsung WebViews. Must run before locale and UI. */
(function(){'use strict';
 var oldGrid=!(window.CSS&&CSS.supports&&CSS.supports('display','grid'));
 if(oldGrid)document.documentElement.classList.add('morph-legacy-layout');
 // Grid support does not imply flex-gap support (Tizen 5 has Grid but no flex gap).
 var gapProbe=document.createElement('div');gapProbe.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px;padding:0;border:0';
 gapProbe.appendChild(document.createElement('div'));gapProbe.appendChild(document.createElement('div'));
 document.documentElement.appendChild(gapProbe);var noFlexGap=gapProbe.scrollHeight!==1;gapProbe.parentNode.removeChild(gapProbe);
 if(noFlexGap)document.documentElement.classList.add('morph-no-flex-gap');
 window.MorphTVCompatibility={legacyLayout:oldGrid,noFlexGap:noFlexGap};
 function define(target,name,value){if(!target[name])Object.defineProperty(target,name,{value:value,configurable:true,writable:true});}
 define(Object,'values',function(o){return Object.keys(o).map(function(k){return o[k];});});
 define(Object,'entries',function(o){return Object.keys(o).map(function(k){return [k,o[k]];});});
 define(Object,'assign',function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];if(source!=null)Object.keys(source).forEach(function(k){target[k]=source[k];});}return target;});
 define(Array.prototype,'includes',function(value,from){var n=this.length,start=Number(from)||0;if(start<0)start=Math.max(0,n+start);for(var i=start;i<n;i++)if(this[i]===value||(this[i]!==this[i]&&value!==value))return true;return false;});
 define(Array.prototype,'find',function(fn,context){for(var i=0;i<this.length;i++)if(fn.call(context,this[i],i,this))return this[i];});
 define(String.prototype,'includes',function(value,start){return this.indexOf(value,start||0)!==-1;});
 define(String.prototype,'startsWith',function(value,start){return this.substr(start||0,String(value).length)===String(value);});
 define(String.prototype,'endsWith',function(value){value=String(value);return this.slice(-value.length)===value;});
 define(String.prototype,'padStart',function(length,value){var s=String(this),pad=value===undefined?' ':String(value);if(!pad)return s;while(s.length<length)s=pad+s;return s.slice(-Math.max(length,String(this).length));});
 define(String.prototype,'padEnd',function(length,value){var s=String(this),pad=value===undefined?' ':String(value);if(!pad)return s;while(s.length<length)s+=pad;return s.slice(0,Math.max(length,String(this).length));});
 if(window.Promise){define(Promise.prototype,'finally',function(fn){var P=this.constructor;return this.then(function(value){return P.resolve(typeof fn==='function'?fn():undefined).then(function(){return value;});},function(error){return P.resolve(typeof fn==='function'?fn():undefined).then(function(){throw error;});});});}
 function nodes(args){var f=document.createDocumentFragment();for(var i=0;i<args.length;i++)f.appendChild(args[i] instanceof Node?args[i]:document.createTextNode(String(args[i])));return f;}
 if(window.Element){define(Element.prototype,'before',function(){if(this.parentNode)this.parentNode.insertBefore(nodes(arguments),this);});define(Element.prototype,'after',function(){if(this.parentNode)this.parentNode.insertBefore(nodes(arguments),this.nextSibling);});define(Element.prototype,'replaceWith',function(){if(this.parentNode)this.parentNode.replaceChild(nodes(arguments),this);});define(Element.prototype,'replaceChildren',function(){while(this.firstChild)this.removeChild(this.firstChild);this.appendChild(nodes(arguments));});define(Element.prototype,'toggleAttribute',function(name,force){var on=arguments.length>1?!!force:!this.hasAttribute(name);if(on)this.setAttribute(name,'');else this.removeAttribute(name);return on;});}
 if(window.NodeList)define(NodeList.prototype,'forEach',Array.prototype.forEach);
 if(window.Element){
  define(Element.prototype,'matches',Element.prototype.webkitMatchesSelector||Element.prototype.msMatchesSelector);
  define(Element.prototype,'closest',function(selector){var el=this;while(el&&el.nodeType===1){if(el.matches(selector))return el;el=el.parentElement;}return null;});
  define(Element.prototype,'remove',function(){if(this.parentNode)this.parentNode.removeChild(this);});
  define(Element.prototype,'prepend',function(){var fragment=document.createDocumentFragment();for(var i=0;i<arguments.length;i++)fragment.appendChild(arguments[i] instanceof Node?arguments[i]:document.createTextNode(String(arguments[i])));this.insertBefore(fragment,this.firstChild);});
  define(Element.prototype,'append',function(){for(var i=0;i<arguments.length;i++)this.appendChild(arguments[i] instanceof Node?arguments[i]:document.createTextNode(String(arguments[i])));});
 }
})();
