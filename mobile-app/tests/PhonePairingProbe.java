package local.cleartv.pairprobe;
import android.app.*;
import android.os.*;
import android.content.*;
import java.lang.reflect.*;
/** Physical-device diagnostic: uses a user-visible Android pairing dialog, never grants permissions. */
public final class PhonePairingProbe extends Instrumentation {
 private Bundle args;
 @Override public void onCreate(Bundle bundle){super.onCreate(bundle);args=bundle;start();}
 @Override public void onStart(){Bundle result=new Bundle();String code=args.getString("code","");try{
  int port=Integer.parseInt(args.getString("port","0"));
  Class<?> type=Class.forName("tv.appbridge.phase0.rt.session.EmbeddedAdb");Object adb=type.getField("INSTANCE").get(null);
  if (!"true".equals(args.getString("startOnly"))) {
   type.getMethod("pair",Context.class,int.class,String.class).invoke(adb,getTargetContext(),port,code);
   result.putString("pair","PASS real Android wireless pairing");
  }
  String connect=args.getString("connect","");
  if(!connect.isEmpty()){
   type.getMethod("start",Context.class,int.class).invoke(adb,getTargetContext(),Integer.parseInt(connect));
   result.putString("helper","PASS embedded helper startup after fresh pairing");
  }
  if(args.containsKey("tvIP")) {
   Activity host=startActivitySync(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.ui.HostActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
   Method pair=host.getClass().getDeclaredMethod("pair",String.class,String.class);pair.setAccessible(true);
   runOnMainSync(()->{try{pair.invoke(host,args.getString("tvIP"),"android");}catch(Exception e){throw new RuntimeException(e);}});
   long discoveryEnd=System.currentTimeMillis()+10000;
   Field connectionPort=type.getDeclaredField("connectionPort");connectionPort.setAccessible(true);
   while(connectionPort.getInt(null)==0&&System.currentTimeMillis()<discoveryEnd)Thread.sleep(200);
   if(connectionPort.getInt(null)<=0)throw new AssertionError("Automatic connection-port discovery failed");
   result.putString("discovery","PASS automatic local-phone ADB discovery");
   Field mgrField=host.getClass().getDeclaredField("mgr");mgrField.setAccessible(true);Object manager=mgrField.get(host);
   Method connected=manager.getClass().getMethod("getTvConnected");
   long until=System.currentTimeMillis()+40000;
   while(!(Boolean)connected.invoke(manager)&&System.currentTimeMillis()<until)Thread.sleep(300);
   if(!(Boolean)connected.invoke(manager))throw new AssertionError("Physical TV did not connect; leave Bridge open on the TV");
   Field step=host.getClass().getDeclaredField("step");step.setAccessible(true);
   until=System.currentTimeMillis()+10000;
   while(step.getInt(host)!=1&&System.currentTimeMillis()<until)Thread.sleep(100);
   if(step.getInt(host)!=1)throw new AssertionError("Connected phone did not switch to app selection");
   result.putString("transition","PASS physical TV session and automatic native phone app selection");
   Field apps=host.getClass().getDeclaredField("apps");apps.setAccessible(true);
   if(((java.util.List<?>)apps.get(host)).isEmpty())throw new AssertionError("App picker is empty");
   result.putString("apps","PASS populated app picker");
   manager.getClass().getMethod("disconnectTv").invoke(manager);
   if((Boolean)connected.invoke(manager))throw new AssertionError("Disconnect did not clear TV session");
   result.putString("disconnect","PASS explicit disconnect");
  }
  finish(Activity.RESULT_OK,result);
 }catch(Throwable error){while(error instanceof InvocationTargetException&&error.getCause()!=null)error=error.getCause();
  String message=android.util.Log.getStackTraceString(error);if(!code.isEmpty())message=message.replace(code,"[redacted]");
  result.putString("error",error.getClass().getName()+": "+message);finish(Activity.RESULT_CANCELED,result);
 }}
}
