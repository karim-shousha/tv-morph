package local.tvmorph.tv;
import java.util.*;
/** Stable catalog indices; unknown provider dates stay last in either date order. */
final class CatalogOrder {
 static int[] indices(String[] names,long[] dates,String order){
  Integer[] rows=new Integer[names.length];for(int i=0;i<rows.length;i++)rows[i]=i;
  final java.text.Collator collator=java.text.Collator.getInstance(Locale.ENGLISH);collator.setStrength(java.text.Collator.PRIMARY);
  Arrays.sort(rows,(a,b)->{int result;if(order.equals("az")||order.equals("za")){result=collator.compare(names[a],names[b]);if(order.equals("za"))result=-result;}else{long x=Math.max(0,dates[a]),y=Math.max(0,dates[b]);result=x==0?(y==0?0:1):y==0?-1:order.equals("oldest")?Long.compare(x,y):Long.compare(y,x);}return result!=0?result:Integer.compare(a,b);});
  int[] out=new int[rows.length];for(int i=0;i<rows.length;i++)out[i]=rows[i];return out;
 }
}
