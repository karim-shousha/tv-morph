package local.tvmorph.tv;
import java.security.*;import java.util.*;import javax.crypto.*;import javax.crypto.spec.*;

/** Versioned salted PIN verifier; no plaintext PIN is persisted. */
final class PinSecret {
 static final int ITERATIONS=120000;
 static boolean valid(String pin){return pin!=null&&pin.matches("[0-9]{4,8}");}
 private static byte[] derive(String pin,byte[] salt)throws Exception{PBEKeySpec spec=new PBEKeySpec(pin.toCharArray(),salt,ITERATIONS,256);try{return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();}finally{spec.clearPassword();}}
 static String create(String pin)throws Exception{if(!valid(pin))throw new IllegalArgumentException("Use 4–8 digits");byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);return "1$"+Base64.getEncoder().encodeToString(salt)+"$"+Base64.getEncoder().encodeToString(derive(pin,salt));}
 static boolean matches(String pin,String stored)throws Exception{if(!valid(pin)||stored==null)return false;String[] parts=stored.split("\\$");if(parts.length!=3||!parts[0].equals("1"))return false;try{byte[] salt=Base64.getDecoder().decode(parts[1]),expected=Base64.getDecoder().decode(parts[2]);return salt.length==16&&expected.length==32&&MessageDigest.isEqual(expected,derive(pin,salt));}catch(IllegalArgumentException e){return false;}}
}
