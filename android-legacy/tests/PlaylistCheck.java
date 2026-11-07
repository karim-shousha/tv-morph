package local.morphtv.legacy;
public class PlaylistCheck {
 public static void main(String[] args)throws Exception{
  if(Playlist.valid("javascript:alert(1)")||Playlist.valid("file:///etc/passwd")||Playlist.valid("https://user:pass@example.com/a"))throw new AssertionError("Unsafe URL accepted");
  if(!Playlist.valid("https://example.com/stream.m3u8"))throw new AssertionError("HTTPS rejected");
  java.util.List<Playlist.Entry> entries=Playlist.parse("\ufeff#EXTM3U\n#EXTINF:-1,قناة اختبار\nhttps://example.com/live\n#EXTINF:-1,Bad\nfile:///test\n");
  if(entries.size()!=1||!entries.get(0).title.equals("قناة اختبار"))throw new AssertionError("M3U parsing");
  try{Playlist.parse("<html>error</html>");throw new AssertionError("HTML accepted");}catch(java.io.IOException expected){}
   StringBuilder large=new StringBuilder("#EXTM3U\n");for(int i=0;i<5005;i++)large.append("https://example.com/").append(i).append('\n');
   if(Playlist.parse(large.toString()).size()!=5000)throw new AssertionError("Item bound");
  System.out.println("PASS: URL validation, UTF-8 titles, malformed response, item limit");
 }
}
