/* Transport only: provider requests use the desktop protocol, preserving CORS isolation. */
(function(){'use strict';
 function proxy(value){var url=String(value);if(url==='https://morph-tv.com/api/matches')return 'morph://app/__matches';return /^https?:\/\//i.test(url)?'morph://app/__remote?url='+encodeURIComponent(url):url;}
 window.MorphDesktopURL=proxy;
 var open=XMLHttpRequest.prototype.open,originals=new WeakMap(),responseURL=Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype,'responseURL');
 XMLHttpRequest.prototype.open=function(method,url){var args=Array.prototype.slice.call(arguments);if(/^https?:\/\//i.test(String(url)))originals.set(this,String(url));else originals.delete(this);args[1]=proxy(url);return open.apply(this,args);};
 // HLS resolves relative segments against the response URL, including redirects.
 if(responseURL&&responseURL.get)Object.defineProperty(XMLHttpRequest.prototype,'responseURL',{configurable:true,get:function(){if(originals.has(this)){if(this.readyState>=2)return this.getResponseHeader('X-Morph-Upstream-URL')||originals.get(this);return '';}return responseURL.get.call(this);}});
 var nativeFetch=window.fetch.bind(window);
 window.fetch=function(input,options){var promise;if(typeof input==='string'||input instanceof URL)promise=nativeFetch(proxy(input),options);else if(input instanceof Request&&/^https?:/.test(input.url))promise=nativeFetch(new Request(proxy(input.url),input),options);else promise=nativeFetch(input,options);return promise.then(function(response){var upstream=response.headers.get('X-Morph-Upstream-URL');if(upstream)Object.defineProperty(response,'url',{value:upstream});return response;});};
})();
