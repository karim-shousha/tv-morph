package local.tvmorph.tv;
import local.cleartv.mobile.LanHttp;
/** One listener per process; recreation transfers ownership without racing the old Activity. */
final class PhoneLinkServer {
 static final int[] PORTS={8787,8789,8790};private static LanHttp server;private static Object owner;private static LanHttp.Handler handler;private static int port;
 static synchronized int attach(Object next,LanHttp.Handler target)throws Exception{if(server==null){Exception failure=null;for(int candidate:PORTS){try{server=new LanHttp(candidate,(method,path,headers,body)->{LanHttp.Handler current;synchronized(PhoneLinkServer.class){current=handler;}return current==null?new LanHttp.Response(503,"application/json","{}".getBytes("UTF-8")):current.handle(method,path,headers,body);});port=candidate;break;}catch(Exception e){failure=e;}}if(server==null)throw failure;}owner=next;handler=target;return port;}
 static synchronized void detach(Object previous){if(owner!=previous)return;handler=null;owner=null;if(server!=null)server.close();server=null;port=0;}
 static synchronized boolean running(){return server!=null;}
 static synchronized int port(){return port;}
}
