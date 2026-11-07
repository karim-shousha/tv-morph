package local.cleartv.mobile;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/** Phone transport only. The launcher and IPTV use this same normalized public feed. */
final class MatchSchedule {
    private static final String ENDPOINT = "https://morph-tv.com/api/matches";
    private static final long HOUR = 3600000L, WEEK = 7 * 24 * HOUR;

    static JSONObject validate(String raw) throws Exception {
        JSONObject data = new JSONObject(raw);
        JSONArray rows = data.optJSONArray("matches"), teams = data.optJSONArray("teams");
        if (rows == null || rows.length() > 32 || teams == null || teams.length() > 32
                || !"TheSportsDB".equals(data.optString("source")))
            throw new IOException("invalid_match_schedule");
        long updated = data.optLong("updatedAt") * 1000L;
        if (updated > System.currentTimeMillis() + 300000L) throw new IOException("invalid_match_date");
        if (updated <= 0 || System.currentTimeMillis() - updated > WEEK) {
            data.put("matches", new JSONArray());
            data.put("stale", true);
        }
        for(int i=0;i<rows.length();i++){JSONObject match=rows.optJSONObject(i);if(match==null)continue;for(String side:new String[]{"home","away"}){JSONObject club=match.optJSONObject(side);if(club==null||!club.optString("badge").isEmpty())continue;for(int j=0;j<teams.length();j++){JSONObject team=teams.optJSONObject(j);if(team!=null&&club.optString("id").equals(team.optString("id"))){club.put("badge",team.optString("badge"));break;}}}}
        return data;
    }

    private static boolean missingArtwork(JSONObject feed){JSONArray rows=feed.optJSONArray("matches");if(rows==null)return true;for(int i=0;i<rows.length();i++){JSONObject match=rows.optJSONObject(i);if(match==null)continue;for(String key:new String[]{"home","away"}){JSONObject team=match.optJSONObject(key);if(team!=null&&team.optString("badge").isEmpty())return true;}}return false;}
    static synchronized JSONObject load(Context context, boolean force) throws Exception {
        SharedPreferences prefs = context.getSharedPreferences("morph-matches-cache", Context.MODE_PRIVATE);
        JSONObject cached = null;
        try { cached = validate(prefs.getString("feed", "")); } catch (Exception ignored) { }
        long age = System.currentTimeMillis() - prefs.getLong("fetched", 0L);
        if (!force && cached != null && age >= 0 && age < HOUR
                && !cached.optBoolean("loading") && !cached.optBoolean("stale") && (age<30000||!missingArtwork(cached))) return cached;
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(ENDPOINT).openConnection();
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "Morph-TV-Mobile/Matches");
            if (connection.getResponseCode() != 200) throw new IOException("match_schedule_unavailable");
            JSONObject result = validate(new String(Network.read(connection.getInputStream(), 512 * 1024), "UTF-8"));
            prefs.edit().putString("feed", result.toString()).putLong("fetched", System.currentTimeMillis()).apply();
            return result;
        } catch (Exception failure) {
            if (cached != null) return cached.put("phoneOffline", true).put("stale", true);
            throw new IOException("match_schedule_unavailable");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}
