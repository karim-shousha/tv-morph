package local.cleartv.mobile;
import android.content.Context;
import android.security.keystore.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.security.*;
import java.io.*;
import java.util.*;
/** Secrets remain encrypted in app-private storage; never included in the APK or logs. */
final class Vault {
    private final Context context;Vault(Context c){context=c;}
    private javax.crypto.SecretKey key()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);String alias="cleartv.mobile.secrets";if(!ks.containsAlias(alias)){KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());g.generateKey();}return (javax.crypto.SecretKey)ks.getKey(alias,null);}
    void put(String name,byte[] data)throws Exception{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());try(FileOutputStream out=context.openFileOutput(name,Context.MODE_PRIVATE)){out.write(c.getIV());out.write(c.doFinal(data));}}
    byte[] get(String name)throws Exception{File f=new File(context.getFilesDir(),name);if(!f.exists())return null;byte[] data=Network.read(new FileInputStream(f),4*1024*1024);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Arrays.copyOfRange(data,0,12)));return c.doFinal(Arrays.copyOfRange(data,12,data.length));}
}
