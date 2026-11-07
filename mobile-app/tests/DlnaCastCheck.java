package local.cleartv.mobile;

import java.net.*;
import java.io.*;
import java.util.*;
import com.sun.net.httpserver.*;
import java.lang.reflect.Field;

/** Automated coverage for the phone DMC + mini-DMS. Mock renderer/server bind
 *  to the machine's private LAN address only; no external network is used. */
public class DlnaCastCheck {
    static int failures = 0;
    static void check(boolean ok, String name) {
        System.out.println((ok ? "PASS " : "FAIL ") + name);
        if (!ok) failures++;
    }
    static String privateIP() throws Exception {
        Enumeration<NetworkInterface> nis = NetworkInterface.getNetworkInterfaces();
        while (nis.hasMoreElements()) {
            Enumeration<InetAddress> addrs = nis.nextElement().getInetAddresses();
            while (addrs.hasMoreElements()) {
                InetAddress a = addrs.nextElement();
                if (a instanceof Inet4Address) {
                    String h = a.getHostAddress();
                    if (h.startsWith("10.") || h.startsWith("192.168.") || h.matches("172\\.(1[6-9]|2[0-9]|3[01])\\..*")) return h;
                }
            }
        }
        throw new Exception("no private interface");
    }
    static final List<String> actions = Collections.synchronizedList(new ArrayList<String>());
    static final List<String> bodies = Collections.synchronizedList(new ArrayList<String>());
    static String desc(String ip, int port) {
        return "<?xml version=\"1.0\"?><root xmlns=\"urn:schemas-upnp-org:device-1-0\">"
            + "<URLBase>http://" + ip + ":" + port + "/</URLBase>"
            + "<device><deviceType>urn:schemas-upnp-org:device:MediaRenderer:2</deviceType>"
            + "<friendlyName>Fixture Renderer</friendlyName><UDN>uuid:fixture-renderer</UDN>"
            + "<serviceList>"
            + "<service><serviceType>urn:schemas-upnp-org:service:AVTransport:2</serviceType><controlURL>/av</controlURL></service>"
            + "<service><serviceType>urn:schemas-upnp-org:service:RenderingControl:3</serviceType><controlURL>/rc</controlURL></service>"
            + "</serviceList></device></root>";
    }
    static void soap(HttpExchange x, String inner) throws IOException {
        byte[] req = readAll(x.getRequestBody());
        String body = new String(req, "UTF-8");
        actions.add(String.valueOf(x.getRequestHeaders().getFirst("SOAPAction")));
        bodies.add(body);
        String resp;
        if (body.contains("<u:SetAVTransportURI")) resp = "<CurrentURI>ok</CurrentURI>";
        else if (body.contains("GetTransportInfo")) resp = "<CurrentTransportState>PLAYING</CurrentTransportState>";
        else if (body.contains("GetCurrentTransportActions")) resp = "<Actions>Play,Pause,Stop,Seek</Actions>";
        else if (body.contains("GetPositionInfo")) resp = "<RelTime>00:01:30</RelTime><TrackDuration>01:00:00</TrackDuration>";
        else if (body.contains("<u:Seek")) { if (!body.contains("<Target>00:02:00</Target>")) { fault(x); return; } resp = "<Seek>ok</Seek>"; }
        else if (body.contains("GetVolume")) resp = "<CurrentVolume>20</CurrentVolume>";
        else if (body.contains("SetVolume")) { if (!body.contains("<DesiredVolume>25</DesiredVolume>")) { fault(x); return; } resp = "<Volume>ok</Volume>"; }
        else if (body.contains("SetMute")) resp = "<Mute>ok</Mute>";
        else resp = "<Result>ok</Result>";
        String action = body.contains("xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl") ? "RenderingControl" : "AVTransport";
        byte[] out = ("<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Body><u:Response xmlns:u=\"urn:schemas-upnp-org:service:" + action + ":1\">" + resp + "</u:Response></s:Body></s:Envelope>").getBytes("UTF-8");
        x.getResponseHeaders().add("Content-Type", "text/xml; charset=\"utf-8\"");
        x.sendResponseHeaders(200, out.length);
        x.getResponseBody().write(out);
        x.close();
    }
    static void fault(HttpExchange x) throws IOException {
        byte[] out = "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\"><s:Body><s:Fault><faultstring>UPnPError</faultstring><detail><UPnPError xmlns=\"urn:schemas-upnp-org:control-1-0\"><errorCode>501</errorCode></detail></s:Fault></s:Body></s:Envelope>".getBytes("UTF-8");
        x.sendResponseHeaders(500, out.length);
        x.getResponseBody().write(out);
        x.close();
    }
    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] b = new byte[4096]; int n;
        while ((n = in.read(b)) != -1) out.write(b, 0, n);
        return out.toByteArray();
    }
    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws Exception {
        check(!DlnaCast.privateIP("8.8.8.8"), "public rejected");
        check(!DlnaCast.privateIP("127.0.0.1"), "loopback rejected");
        check(!DlnaCast.privateIP("10.999.0.1"), "invalid octet rejected");
        check(!DlnaCast.privateIP("::1"), "ipv6 loopback rejected");
        check(DlnaCast.privateIP("192.168.1.20"), "private accepted");
        check(DlnaCast.privateIP("172.31.9.9"), "172.16/12 accepted");
        check(!DlnaCast.privateIP("172.32.0.1"), "172.32 rejected");
        check(DlnaCast.relTime(3661).equals("01:01:01"), "relTime format");
        check(DlnaCast.parseTime("00:01:30") == 90, "parseTime");
        check(DlnaCast.parseTime("bogus") == -1, "parseTime invalid");
        check(DlnaCast.escape("a<b>&\"'").equals("a&lt;b&gt;&amp;&quot;&apos;"), "soap escape");
        try { DlnaCast.localURL("http://u:p@192.168.1.1/a", "192.168.1.1"); check(false, "userinfo rejected"); }
        catch (IOException expected) { check(true, "userinfo rejected"); }
        try { DlnaCast.localURL("http://192.168.1.99/a", "192.168.1.20"); check(false, "host mismatch rejected"); }
        catch (IOException expected) { check(true, "host mismatch rejected"); }
        long[] r = DlnaMediaServer.range(null, 100);
        check(r[0] == 0 && r[1] == 99, "range full");
        long[] r2 = DlnaMediaServer.range("bytes=10-19", 100);
        check(r2[0] == 10 && r2[1] == 19, "range slice");
        try { DlnaMediaServer.range("bytes=90-10", 100); check(false, "range inverted rejected"); }
        catch (IOException expected) { check(true, "range inverted rejected"); }
        String ip;
        try { ip = privateIP(); }
        catch (Exception e) { System.out.println("BLOCKED mock renderer: no private interface"); return; }
        final String host = ip;
        HttpServer server = HttpServer.create(new InetSocketAddress(host, 0), 0);
        final int port = server.getAddress().getPort();
        server.createContext("/desc.xml", x -> { byte[] out = desc(host, port).getBytes("UTF-8"); x.sendResponseHeaders(200, out.length); x.getResponseBody().write(out); x.close(); });
        server.createContext("/av", x -> soap(x, ""));
        server.createContext("/rc", x -> soap(x, ""));
        server.start();
        try {
            java.lang.reflect.Method m = DlnaCast.class.getDeclaredMethod("description", URL.class, String.class);
            m.setAccessible(true);
            Object dev = m.invoke(null, new URL("http://" + host + ":" + port + "/desc.xml"), host);
            Field f = DlnaCast.class.getDeclaredField("devices");
            f.setAccessible(true);
            Map<String, Object> map = (Map<String, Object>) f.get(null);
            Field idF = dev.getClass().getDeclaredField("id");
            idF.setAccessible(true);
            String id = (String) idF.get(dev);
            map.put(id, dev);
            Field typeF = dev.getClass().getDeclaredField("type");
            typeF.setAccessible(true);
            check("urn:schemas-upnp-org:service:AVTransport:2".equals(typeF.get(dev)), "AVTransport:2 captured");
            check(DlnaCast.connect(id).optBoolean("connected"), "connect probe");
            org.json.JSONObject caps = DlnaCast.caps(id);
            check(caps.optBoolean("seek") && caps.optBoolean("volume"), "caps seek+volume");
            org.json.JSONObject pos = DlnaCast.position(id);
            check(pos.optLong("position") == 90 && pos.optLong("duration") == 3600, "position parse");
            check(DlnaCast.seek(id, 120).optLong("target") == 120, "seek accepted");
            check(actions.stream().anyMatch(a -> a.contains("AVTransport:2#Seek")), "seek SOAPAction versioned");
            check(DlnaCast.volume(id, 25).optInt("volume") == 25, "volume accepted");
            check(actions.stream().anyMatch(a -> a.contains("RenderingControl:3#SetVolume")), "RC SOAPAction versioned");
            check(DlnaCast.mute(id, true).optBoolean("mute"), "mute accepted");
            check(DlnaCast.control(id, "Pause").optBoolean("accepted"), "pause accepted");
            org.json.JSONObject sent = DlnaCast.send(id, "http://" + host + ":" + port + "/film.mp4", "video");
            check(sent.optBoolean("accepted"), "send URL accepted");
            check(bodies.stream().anyMatch(b -> b.contains("object.item.videoItem")), "DIDL videoItem metadata");
            try { DlnaCast.send(id, "http://user:pass@" + host + "/x.mp4", "video"); check(false, "send userinfo rejected"); }
            catch (IOException expected) { check(true, "send userinfo rejected"); }
            try { DlnaCast.control(id, "Record"); check(false, "bogus control rejected"); }
            catch (IOException expected) { check(true, "bogus control rejected"); }
            byte[] file = new byte[5000];
            for (int i = 0; i < file.length; i++) file[i] = (byte) (i % 251);
            DlnaMediaServer.Source src = new DlnaMediaServer.Source() {
                public long length() { return file.length; }
                public String mime() { return "video/mp4"; }
                public InputStream open(long offset) { return new ByteArrayInputStream(file, (int) offset, file.length - (int) offset); }
            };
            InetAddress local = InetAddress.getByName(host);
            DlnaMediaServer mini = new DlnaMediaServer(local, local, src, ".mp4");
            try {
                check(mini.url.startsWith("http://" + host + ":") && mini.url.endsWith(".mp4"), "mini server URL");
                HttpURLConnection c = (HttpURLConnection) new URL(mini.url).openConnection();
                c.setInstanceFollowRedirects(false);
                check(c.getResponseCode() == 200 && c.getContentLength() == 5000, "mini GET full");
                check("bytes".equalsIgnoreCase(c.getHeaderField("Accept-Ranges")), "mini range support");
                check("video/mp4".equals(c.getHeaderField("Content-Type")), "mini mime");
                HttpURLConnection h = (HttpURLConnection) new URL(mini.url).openConnection();
                h.setRequestMethod("HEAD");
                check(h.getResponseCode() == 200, "mini HEAD");
                HttpURLConnection p = (HttpURLConnection) new URL(mini.url).openConnection();
                p.setRequestProperty("Range", "bytes=100-199");
                check(p.getResponseCode() == 206, "mini 206 partial");
                byte[] part = readAll(p.getInputStream());
                check(part.length == 100 && part[0] == file[100], "mini partial bytes");
                HttpURLConnection bad = (HttpURLConnection) new URL(mini.url + "x").openConnection();
                check(bad.getResponseCode() == 404, "mini wrong path 404");
                try {
                    Socket s = new Socket(local, new URL(mini.url).getPort());
                    s.setSoTimeout(3000);
                    OutputStream o = s.getOutputStream();
                    o.write(("GET " + new URL(mini.url).getPath() + " HTTP/1.1\r\nHost: x\r\nRange: bytes=1-2\r\nRange: bytes=3-4\r\n\r\n").getBytes("US-ASCII"));
                    o.flush();
                    ByteArrayOutputStream resp = new ByteArrayOutputStream();
                    byte[] bb = new byte[256]; int nn = s.getInputStream().read(bb);
                    resp.write(bb, 0, nn); s.close();
                    check(resp.toString("US-ASCII").contains("400"), "mini dup range 400");
                } catch (Exception e) { check(false, "mini dup range 400"); }
            } finally { mini.close(); mini.close(); check(true, "mini close idempotent"); }
        } finally { server.stop(0); }
        if (failures > 0) throw new AssertionError(failures + " checks failed");
        System.out.println("PASS DlnaCast/DlnaMediaServer: validation, SOAP, caps, position, seek, volume, mute, faults, ranges, allowlist.");
    }
}
