package local.cleartv.mobile;

import java.io.*;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.zip.*;

/** W3C widget signatures over the exact bytes in the application archive. */
public final class WidgetSigner {
    private static final String NS="http://www.w3.org/2000/09/xmldsig#",SHA="http://www.w3.org/2001/04/xmlenc#sha512",EXC="http://www.w3.org/2001/10/xml-exc-c14n#",CAN="http://www.w3.org/2006/12/xml-c14n11";
    static byte[] utf(String s){return s.getBytes(StandardCharsets.UTF_8);}
    static String b64(byte[] b){return Base64.getEncoder().encodeToString(b);}
    static String esc(String s){return s.replace("&","&amp;").replace("\"","&quot;").replace("<","&lt;").replace(">","&gt;");}
    static String uri(String path){StringBuilder value=new StringBuilder();char[] hex="0123456789ABCDEF".toCharArray();for(byte octet:utf(path)){int c=octet&255;if(c>='a'&&c<='z'||c>='A'&&c<='Z'||c>='0'&&c<='9'||"-._~/".indexOf(c)>=0)value.append((char)c);else value.append('%').append(hex[c>>>4]).append(hex[c&15]);}return value.toString();}
    static String hash(byte[] b)throws Exception{return b64(MessageDigest.getInstance("SHA-512").digest(b));}
    private static byte[] signature(String id,Map<String,byte[]> files,PrivateKey key,List<X509Certificate> chain)throws Exception{
        String role=id.equals("AuthorSignature")?"author":"distributor";
        StringBuilder props=new StringBuilder("<Object xmlns=\""+NS+"\" Id=\"prop\"><SignatureProperties xmlns:dsp=\"http://www.w3.org/2009/xmldsig-properties\">");
        String[] names={"profile","role","identifier"},children={"Profile","Role","Identifier"},uris={"http://www.w3.org/ns/widgets-digsig#profile","http://www.w3.org/ns/widgets-digsig#role-"+role,""};
        for(int i=0;i<3;i++)props.append("<SignatureProperty Id=\"").append(names[i]).append("\" Target=\"#").append(id).append("\"><dsp:").append(children[i]).append(uris[i].isEmpty()?"":" URI=\""+uris[i]+"\"").append("></dsp:").append(children[i]).append("></SignatureProperty>");
        props.append("</SignatureProperties></Object>");
        StringBuilder info=new StringBuilder("<SignedInfo xmlns=\""+NS+"\"><CanonicalizationMethod Algorithm=\""+EXC+"\"></CanonicalizationMethod><SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha512\"></SignatureMethod>");
        for(Map.Entry<String,byte[]> f:files.entrySet())info.append("<Reference URI=\"").append(esc(uri(f.getKey()))).append("\"><DigestMethod Algorithm=\"").append(SHA).append("\"></DigestMethod><DigestValue>").append(hash(f.getValue())).append("</DigestValue></Reference>");
        info.append("<Reference URI=\"#prop\"><Transforms><Transform Algorithm=\"").append(CAN).append("\"></Transform></Transforms><DigestMethod Algorithm=\"").append(SHA).append("\"></DigestMethod><DigestValue>").append(hash(utf(props.toString()))).append("</DigestValue></Reference></SignedInfo>");
        Signature rsa=Signature.getInstance("SHA512withRSA");rsa.initSign(key);rsa.update(utf(info.toString()));
        StringBuilder xml=new StringBuilder("<Signature xmlns=\""+NS+"\" Id=\""+id+"\">").append(info).append("<SignatureValue>").append(b64(rsa.sign())).append("</SignatureValue><KeyInfo><X509Data>");
        for(X509Certificate c:chain)xml.append("<X509Certificate>").append("\n").append(Base64.getMimeEncoder(76,new byte[]{10}).encodeToString(c.getEncoded())).append("\n</X509Certificate>");
        return utf(xml.append("</X509Data></KeyInfo>").append(props).append("</Signature>").toString());
    }
    static SortedMap<String,byte[]> readFiles(InputStream source)throws Exception{
        SortedMap<String,byte[]> files=new TreeMap<>();ZipInputStream zip=new ZipInputStream(source);ZipEntry e;int total=0;
        while((e=zip.getNextEntry())!=null){String n=e.getName();if(e.isDirectory()||n.matches("signature[0-9]+\\.xml")||n.equals("author-signature.xml"))continue;if(n.contains("..")||n.startsWith("/")||files.containsKey(n)||n.contains("\\")||files.size()>=10000)throw new IOException("Unsafe application package");ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buf=new byte[8192];int count;while((count=zip.read(buf))!=-1){total+=count;if(total>32*1024*1024)throw new IOException("Application too large");bytes.write(buf,0,count);}files.put(n,bytes.toByteArray());}
        zip.close();if(!files.containsKey("config.xml"))throw new IOException("Application manifest missing");
        return files;
    }
    public static byte[] build(InputStream source,byte[] initial,PrivateKey author,List<X509Certificate> authorChain,PrivateKey distributor,List<X509Certificate> distributorChain)throws Exception{
        Map<String,byte[]> files=readFiles(source);
        if(initial!=null)files.put("initial-config.js",utf("window.ClearTVInitial="+new String(initial,StandardCharsets.UTF_8)+";"));
        byte[] a=signature("AuthorSignature",files,author,authorChain);files.put("author-signature.xml",a);files.put("signature1.xml",signature("DistributorSignature",files,distributor,distributorChain));
        ByteArrayOutputStream result=new ByteArrayOutputStream();ZipOutputStream out=new ZipOutputStream(result);for(Map.Entry<String,byte[]> f:files.entrySet()){out.putNextEntry(new ZipEntry(f.getKey()));out.write(f.getValue());out.closeEntry();}out.close();return result.toByteArray();
    }
    public static KeyPair newKey()throws Exception{KeyPairGenerator gen=KeyPairGenerator.getInstance("RSA");gen.initialize(2048);return gen.generateKeyPair();}
    static byte[] join(byte[]... arrays)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();for(byte[] b:arrays)out.write(b);return out.toByteArray();}
    static byte[] der(int tag,byte[] content)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(tag);int len=content.length;if(len<128)out.write(len);else{int n=0;for(int a=len;a>0;a>>>=8)n++;out.write(128|n);for(int i=n-1;i>=0;i--)out.write((len>>>(i*8))&255);}out.write(content);return out.toByteArray();}
    static byte[] seq(byte[]... a)throws IOException{return der(48,join(a));}
    static byte[] oid(String s)throws IOException{String[] a=s.split("\\.");ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(Integer.parseInt(a[0])*40+Integer.parseInt(a[1]));for(int i=2;i<a.length;i++){long v=Long.parseLong(a[i]);byte[] b=new byte[10];int p=9;b[p]=(byte)(v&127);while((v>>>=7)>0)b[--p]=(byte)((v&127)|128);out.write(b,p,10-p);}return der(6,out.toByteArray());}
    public static String csr(KeyPair key,String identity,String duid)throws Exception{
        byte[] attrs=new byte[0];if(duid!=null){byte[] san=seq(der(134,utf("URN:tizen:packageid=")),der(134,utf("URN:tizen:deviceid="+duid)));byte[] extension=seq(oid("2.5.29.17"),der(4,san));attrs=seq(oid("1.2.840.113549.1.9.14"),der(49,seq(extension)));}
        byte[] subject=seq(der(49,seq(oid("2.5.4.3"),der(12,utf(identity))))),info=seq(der(2,new byte[]{0}),subject,key.getPublic().getEncoded(),der(160,attrs));
        Signature rsa=Signature.getInstance("SHA512withRSA");rsa.initSign(key.getPrivate());rsa.update(info);byte[] request=seq(info,seq(oid("1.2.840.113549.1.1.13"),der(5,new byte[0])),der(3,join(new byte[]{0},rsa.sign())));
        return "-----BEGIN CERTIFICATE REQUEST-----\n"+Base64.getMimeEncoder(64,new byte[]{10}).encodeToString(request)+"\n-----END CERTIFICATE REQUEST-----\n";
    }
}
