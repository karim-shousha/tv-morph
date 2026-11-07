package local.tvmorph.tv;
import org.json.*;
/** Host-side Xtream test stub; portal functionality is outside this fixture. */
final class PortalSource {
 final JSONObject config;
 PortalSource(JSONObject value){config=value;throw new UnsupportedOperationException("Not a portal test");}
 void clear(){}
 JSONObject auth(){throw new UnsupportedOperationException();}
 JSONArray categories(String kind){throw new UnsupportedOperationException();}
 JSONArray list(String kind,String category){throw new UnsupportedOperationException();}
 JSONObject listPage(String kind,String category,int page){throw new UnsupportedOperationException();}
 JSONArray episodes(String series){throw new UnsupportedOperationException();}
 String stream(JSONObject item){throw new UnsupportedOperationException();}
}
