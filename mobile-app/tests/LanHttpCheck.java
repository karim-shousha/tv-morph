import local.cleartv.mobile.LanHttp;import java.net.*;import java.io.*;import java.util.*;
public class LanHttpCheck{
 static String send(String request)throws Exception{try(Socket s=new Socket("127.0.0.1",18787)){s.setSoTimeout(3000);s.getOutputStream().write(request.getBytes("UTF-8"));ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[512];int n;while((n=s.getInputStream().read(b))!=-1)out.write(b,0,n);return out.toString("UTF-8");}}
 public static void main(String[] args)throws Exception{try(LanHttp server=new LanHttp(18787,(method,path,headers,body)->{if(path.equals("/private")&&!"test-token".equals(headers.get("x-tv-morph-token")))return new LanHttp.Response(401,"text/plain",new byte[0]);return LanHttp.Response.json("{\"received\":"+body.length+"}");})){
  if(!send("GET /info HTTP/1.1\r\nHost: localhost\r\n\r\n").contains("200 Response"))throw new Exception("GET failed");
  if(!send("GET /info HTTP/1.1\r\nOrigin: https://example.com\r\n\r\n").contains("403 Response"))throw new Exception("Browser origin not rejected");
  if(!send("POST /pair HTTP/1.1\r\nContent-Length: 1048577\r\n\r\n").contains("400 Response"))throw new Exception("Oversized body not rejected");
  if(!send("GET /private HTTP/1.1\r\n\r\n").contains("401 Response"))throw new Exception("Missing token accepted");
  if(!send("POST /private HTTP/1.1\r\nX-TV-Morph-Token: test-token\r\nContent-Length: 2\r\n\r\n{}").contains("\"received\":2"))throw new Exception("Authenticated body failed");
  System.out.println("PASS: real HTTP GET/POST framing, origin rejection, body bounds and token routing.");
 }}
}
