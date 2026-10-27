package local.cleartv.mobile;
import java.math.BigInteger;import java.nio.*;import java.security.*;import java.security.interfaces.*;import java.security.spec.*;import java.util.*;import javax.crypto.Cipher;
/** ADB RSA identity. The caller persists the PKCS8 key only in the encrypted vault. */
final class AdbIdentity implements SdbClient.Auth {
 final RSAPrivateCrtKey key;
 AdbIdentity(byte[] saved)throws Exception{if(saved==null){KeyPairGenerator generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048);key=(RSAPrivateCrtKey)generator.generateKeyPair().getPrivate();}else key=(RSAPrivateCrtKey)KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(saved));}
 byte[] encoded(){return key.getEncoded();}
 public byte[] sign(byte[] token)throws Exception{if(token.length!=20)throw new GeneralSecurityException("Invalid ADB token");byte[] prefix={0x30,0x21,0x30,0x09,0x06,0x05,0x2b,0x0e,0x03,0x02,0x1a,0x05,0x00,0x04,0x14};byte[] digest=Arrays.copyOf(prefix,prefix.length+20);System.arraycopy(token,0,digest,prefix.length,20);Cipher rsa=Cipher.getInstance("RSA/ECB/PKCS1Padding");rsa.init(Cipher.ENCRYPT_MODE,key);return rsa.doFinal(digest);}
 static byte[] little(BigInteger value){byte[] raw=value.toByteArray(),out=new byte[256];for(int i=0;i<256&&i<raw.length;i++)out[i]=raw[raw.length-i-1];return out;}
 public byte[] publicKey()throws Exception{BigInteger n=key.getModulus(),word=BigInteger.ONE.shiftLeft(32);ByteBuffer out=ByteBuffer.allocate(524).order(ByteOrder.LITTLE_ENDIAN);out.putInt(64);out.putInt(n.modInverse(word).negate().mod(word).intValue());out.put(little(n));out.put(little(BigInteger.ONE.shiftLeft(4096).mod(n)));out.putInt(key.getPublicExponent().intValue());return (Base64.getEncoder().encodeToString(out.array())+" tvmorph@phone\0").getBytes("UTF-8");}
}
