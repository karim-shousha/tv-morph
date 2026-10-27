import local.cleartv.mobile.SdbClient;
public class SamsungProbe {
 public static void main(String[] args)throws Exception {
  try(SdbClient s=new SdbClient(args[0])) {
   String apps=s.shell("0 applist");
   for(String line:apps.split("[\r\n]+"))if(line.toLowerCase().contains("clearmob")||line.toLowerCase().contains("cleartv")||line.contains("TV Morph"))System.out.println(line);
  }
  long start=System.currentTimeMillis();
  try(SdbClient s=new SdbClient(args[0])){String reply=s.shellUntil("0 debug ClearMob01.Home",java.util.regex.Pattern.compile("port[:\\s]+(\\d+)"));System.out.println("debug reply: "+reply);}
  catch(Exception e){System.out.println("debug elapsed="+(System.currentTimeMillis()-start)+" error="+e.getClass().getSimpleName()+": "+e.getMessage());}
 }
}
