package local.morph.iptv;
/** Product entry only; library, providers and player remain the shared implementation. */
public final class MainActivity extends local.tvmorph.tv.IptvActivity {
 @Override public void onCreate(android.os.Bundle state){super.onCreate(null);}
 @Override protected boolean standalone(){return true;}
 @Override protected boolean phoneLayout(){return false;}
 @Override protected boolean returnToHost(){return false;}
}
