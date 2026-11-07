package local.tvmorph.tv;
import android.app.*;import android.os.*;import android.widget.*;
/** A paired phone may request changes; only the parent can approve them on TV. */
public final class ParentRemoteActivity extends Activity {
 protected void onCreate(Bundle state){super.onCreate(state);TextView title=new TextView(this);title.setText(FamilyText.t(this,"طلب رقابة أبوية من الموبايل — أدخل رقم الأهل للموافقة","Phone parental-control request — enter the parent PIN to approve"));title.setTextSize(28);title.setPadding(48,48,48,48);setContentView(title);String id=getIntent().getStringExtra("app"),op=getIntent().getStringExtra("operation");int minutes=getIntent().getIntExtra("minutes",-1);if(id==null||!AppLocks.configured(this)){title.setText(FamilyText.t(this,"عيّن رقم الأهل أولًا من إعدادات Morph TV ← الرقابة الأبوية، ثم أعد الطلب.","Set a parent PIN in Morph TV Settings > Parental controls, then retry."));return;}PlusAccess.require(this,()->AppLocks.parent(this,()->{if("stop".equals(op))ParentalTimer.stop(this,id);else if("time".equals(op)&&minutes>=1&&minutes<=1440)ParentalTimer.set(this,id,minutes);finish();}));}
}
