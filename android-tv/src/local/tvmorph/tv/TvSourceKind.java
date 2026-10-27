package local.tvmorph.tv;
import java.util.regex.Pattern;

/** OEM hardware labels can identify an external source even when its type is generic. */
final class TvSourceKind {
 private static final Pattern HDMI_LABEL=Pattern.compile("(?i)\\bHDMI(?:\\s*[-:#]?\\s*[0-9]{1,2})?\\b");
 private static final Pattern AV_LABEL=Pattern.compile("(?i)^\\s*(?:AV|COMPOSITE|COMPONENT|SCART)(?:\\s*[-:#]?\\s*[0-9]{1,2})?(?:\\s|$)");
 private static final Pattern HDMI_ID=Pattern.compile("(?i)(?:^|[/_:.-])HDMI[-_:]?[0-9]{1,2}(?:$|[/_:.-])");
 static String type(boolean hdmi,boolean tuner,boolean passthrough,String label,String id){
  if(hdmi||HDMI_LABEL.matcher(label==null?"":label).find()||HDMI_ID.matcher(id==null?"":id).find())return "HDMI";
  if(AV_LABEL.matcher(label==null?"":label).find())return "AV";
  return tuner&&!passthrough?"TV":"AV";
 }
 static boolean passthrough(String type,boolean reported){return reported||!"TV".equals(type);}
 private TvSourceKind(){}
}
