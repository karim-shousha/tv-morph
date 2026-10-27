package local.tvmorph.tv;

import android.content.Context;
import android.content.pm.PackageManager;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import java.util.*;
import org.json.*;

/** One hardware-only inventory shared by the Home bridge and fallback player. */
final class AndroidInputs {
 static String label(Context c,TvInputInfo input){try{CharSequence value=input.loadLabel(c);return value==null?"":value.toString().trim();}catch(RuntimeException e){return "";}}
 static String provider(TvInputInfo input){return input.getServiceInfo()==null?"":input.getServiceInfo().packageName;}
 static boolean hardware(Context c,TvInputInfo input){try{return c.getPackageManager().checkPermission("android.permission.TV_INPUT_HARDWARE",provider(input))==PackageManager.PERMISSION_GRANTED;}catch(RuntimeException e){return false;}}
 static String kind(Context c,TvInputInfo input,Set<String> physicalProviders){
  String base=label(c,input),id=input.getId();int raw=input.getType();
  if(raw==TvInputInfo.TYPE_HDMI)return "HDMI";
  if(raw==TvInputInfo.TYPE_COMPOSITE||raw==TvInputInfo.TYPE_SVIDEO||raw==TvInputInfo.TYPE_SCART)return "AV";
  if(raw==TvInputInfo.TYPE_COMPONENT)return "COMP";
  if(raw==TvInputInfo.TYPE_VGA)return "VGA";
  if(raw==TvInputInfo.TYPE_DVI)return "DVI";
  // Some OEMs report physical HDMI/AV as TYPE_TUNER. Require an explicit
  // connector label/ID, not the enumeration order or a generic software tuner.
  String inferred=TvSourceKind.type(false,raw==TvInputInfo.TYPE_TUNER,input.isPassthroughInput(),base,id);
  if("HDMI".equals(inferred)&&(HdmiPort.number(0,base)>0||HdmiPort.number(0,id)>0||input.isPassthroughInput()||hardware(c,input)))return "HDMI";
  if(base.matches("(?i)^\\s*(AV|COMPOSITE|COMPONENT|SCART)(\\s*[-:#]?\\s*[0-9]{1,2})?(\\s|$).*"))return "AV";
  if(raw==TvInputInfo.TYPE_TUNER&&(hardware(c,input)||physicalProviders.contains(provider(input))||id.matches(".*/HW[0-9]+$")))return "TV";
  return "";
 }
 static JSONArray collect(Context c)throws Exception{
  TvInputManager manager=(TvInputManager)c.getSystemService(Context.TV_INPUT_SERVICE);JSONArray result=new JSONArray();if(manager==null)return result;
  List<TvInputInfo> inputs=manager.getTvInputList();Set<String> physicalProviders=new HashSet<>();
  for(TvInputInfo input:inputs)if((input.getType()>=TvInputInfo.TYPE_COMPOSITE&&input.getType()<=TvInputInfo.TYPE_HDMI&&input.isPassthroughInput())||HdmiPort.number(0,label(c,input))>0||HdmiPort.number(0,input.getId())>0)physicalProviders.add(provider(input));
  LinkedHashMap<String,JSONObject> rows=new LinkedHashMap<>();
  for(TvInputInfo input:inputs){try{
   String type=kind(c,input,physicalProviders);if(type.isEmpty())continue;
   String base=label(c,input),custom="";try{CharSequence value=input.loadCustomLabel(c);if(value!=null)custom=value.toString().trim();}catch(RuntimeException ignored){}
   int port=type.equals("HDMI")?HdmiPort.number(0,base):0;if(type.equals("HDMI")&&port==0)port=HdmiPort.number(0,input.getId());if(type.equals("HDMI")&&port==0)port=HdmiPort.number(0,custom);
   String title=custom.isEmpty()?base:custom;
   if(type.equals("HDMI")&&custom.isEmpty())title=port>0?"HDMI "+port:"HDMI";
   if(type.equals("TV")&&(title.isEmpty()||title.equalsIgnoreCase("Tuner")))title="Live TV";
   int state=manager.getInputState(input.getId());
   JSONObject row=new JSONObject().put("id",input.getId()).put("type",type).put("number",port).put("title",title).put("nativeTitle",base).put("parentId",input.getParentId()==null?"":input.getParentId()).put("passthrough",!type.equals("TV")).put("connected",state==TvInputManager.INPUT_STATE_CONNECTED||state==TvInputManager.INPUT_STATE_CONNECTED_STANDBY).put("inputState",state);
   rows.put(input.getId(),row);
  }catch(RuntimeException invalid){/* One inaccessible provider must not hide the others. */}}
  List<JSONObject> ordered=new ArrayList<>();for(JSONObject row:rows.values()){JSONObject parent=rows.get(row.optString("parentId"));if(parent!=null&&"HDMI".equals(parent.optString("type"))&&"HDMI".equals(row.optString("type")))continue;ordered.add(row);}
  Collections.sort(ordered,(a,b)->{String at=a.optString("type"),bt=b.optString("type");if(at.equals(bt)){int port=Integer.compare(a.optInt("number"),b.optInt("number"));if(port!=0)return port;int name=a.optString("title").compareToIgnoreCase(b.optString("title"));return name!=0?name:a.optString("id").compareTo(b.optString("id"));}return at.equals("TV")?-1:bt.equals("TV")?1:at.compareTo(bt);});
  for(JSONObject row:ordered)result.put(row);return result;
 }
 static JSONObject diagnostics(Context c)throws Exception{JSONObject value=new JSONObject().put("manufacturer",android.os.Build.MANUFACTURER).put("model",android.os.Build.MODEL).put("sdk",android.os.Build.VERSION.SDK_INT).put("sources",collect(c));JSONArray raw=new JSONArray();TvInputManager manager=(TvInputManager)c.getSystemService(Context.TV_INPUT_SERVICE);if(manager!=null)for(TvInputInfo input:manager.getTvInputList())raw.put(new JSONObject().put("id",input.getId()).put("label",label(c,input)).put("type",input.getType()).put("passthrough",input.isPassthroughInput()).put("hardwarePermission",hardware(c,input)).put("parentId",input.getParentId()==null?"":input.getParentId()));return value.put("reported",raw);}
 static JSONObject find(Context c,String id)throws Exception{JSONArray rows=collect(c);for(int i=0;i<rows.length();i++)if(rows.getJSONObject(i).optString("id").equals(id))return rows.getJSONObject(i);return null;}
 private AndroidInputs(){}
}
