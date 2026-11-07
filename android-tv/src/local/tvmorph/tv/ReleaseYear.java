package local.tvmorph.tv;
import org.json.JSONObject;import java.util.regex.*;
/** Release metadata only; never infer release year from an added timestamp or resolution. */
final class ReleaseYear {
 static String from(JSONObject item){if(item==null)return "";for(String field:new String[]{"year","releaseDate","releasedate","release_date","released","premiered"}){String raw=item.optString(field,"").trim();Matcher m=Pattern.compile("^((?:19|20)[0-9]{2})(?:$|[-/ ])").matcher(raw);if(m.find())return m.group(1);}Matcher named=Pattern.compile("[\\[(]((?:19|20)[0-9]{2})[\\])](?:\\s|$)").matcher(item.optString("name",""));return named.find()?named.group(1):"";}
}
