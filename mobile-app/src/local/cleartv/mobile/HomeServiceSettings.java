package local.cleartv.mobile;
import java.util.LinkedHashSet;
final class HomeServiceSettings {
 static final String OWN="local.tvmorph.tv/local.tvmorph.tv.HomeOverrideService";
 static String updated(String raw,boolean enabled){
  String old=raw==null||raw.trim().equals("null")?"":raw.trim();
  if(!old.matches("[A-Za-z0-9_./:]*"))throw new IllegalArgumentException("Open TV Accessibility settings to change Morph TV manually.");
  LinkedHashSet<String> entries=new LinkedHashSet<>();
  for(String entry:old.split(":"))if(!entry.isEmpty()&&!entry.equals(OWN)&&!entry.equals("local.tvmorph.tv/.HomeOverrideService"))entries.add(entry);
  if(enabled)entries.add(OWN);StringBuilder out=new StringBuilder();for(String entry:entries){if(out.length()>0)out.append(':');out.append(entry);}return out.toString();
 }
}
