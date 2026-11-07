package local.tvmorph.tv;
import java.io.*;import org.json.*;
/** Host metadata tests never read a catalog. Native/incremental catalog tests cover that path separately. */
final class ProviderCatalog {interface Row{JSONObject map(JSONObject value)throws JSONException;}static final class Result{JSONArray rows=new JSONArray();int total;boolean complete;}static Result read(InputStream in,int limit,Row row)throws IOException{throw new IOException("Catalog is outside the startup fixture");}}
