/* Samsung Emscripten 1.39.4.7 socket binding contract, run off the UI thread.
   SDK reference: src/library_tizen_sockfs.js (SocketsManager / NetAddress).
   Only SSDP MediaRenderer discovery is sent; content is sent after selection. */
(function(){'use strict';
function privateIP(value){var p=value.split('.').map(Number);return p.length===4&&p.every(function(n){return isFinite(n)&&n>=0&&n<=255;})&&(p[0]===10||p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31);}
self.onmessage=function(){var socket=null,api=null,items={},end=Date.now()+3200;
 try{if(typeof tizentvwasm==='undefined'||!tizentvwasm.SocketsManager)throw Error('This Samsung model does not expose native network discovery.');api=tizentvwasm.SocketsManager;socket=api.create('af_inet','sock_dgram',0);api.bind(socket,new tizentvwasm.NetAddress('af_inet',new Uint8Array([0,0,0,0]),0));
  var query='M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\nMX: 2\r\nST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n',bytes=new Uint8Array(query.length);for(var i=0;i<query.length;i++)bytes[i]=query.charCodeAt(i);api.sendTo(socket,bytes,0,new tizentvwasm.NetAddress('af_inet',new Uint8Array([239,255,255,250]),1900));
  while(Date.now()<end&&Object.keys(items).length<8){var poll=new tizentvwasm.PollFd(socket,tizentvwasm.PollFlags.POLLIN);if(api.poll([poll],150)<=0||!(poll.revents&tizentvwasm.PollFlags.POLLIN))continue;var buffer=new Uint8Array(8192),received=api.recvFrom(socket,buffer,0);if(!received||!received.peerAddress||received.peerAddress.family!=='af_inet'||received.bytesRead<=0||received.bytesRead>8192)continue;var host=Array.prototype.join.call(received.peerAddress.bytes,'.');if(!privateIP(host))continue;var text='';for(var n=0;n<received.bytesRead;n++)text+=String.fromCharCode(buffer[n]);if(!/^HTTP\/1\.[01] 200\b/.test(text))continue;var location=/^location:\s*(\S+)\s*$/im.exec(text);if(!location)continue;try{var u=new URL(location[1]);if(!/^https?:$/.test(u.protocol)||u.hostname!==host||u.username||u.password||u.hash||u.href.length>2048)continue;items[u.href]=true;}catch(ignore){}}
  self.postMessage({items:Object.keys(items)});
 }catch(error){self.postMessage({error:String(error.message||error)});}finally{if(api&&socket!==null)try{api.close(socket);}catch(ignore){}}
};})();
