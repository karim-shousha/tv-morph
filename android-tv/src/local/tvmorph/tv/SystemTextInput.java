package local.tvmorph.tv;
import android.app.Activity;import android.widget.*;import android.view.inputmethod.*;import java.lang.ref.WeakReference;import java.util.WeakHashMap;
/** Registers ordinary Android text fields for the device IME and paired-phone text. No keyboard UI. */
final class SystemTextInput {
 private static final WeakHashMap<Activity,WeakReference<EditText>> focused=new WeakHashMap<>();
 static boolean text(Activity activity,String value){WeakReference<EditText> ref=focused.get(activity);EditText field=ref==null?null:ref.get();if(field==null||!field.isShown()||!field.hasWindowFocus())return false;field.setText(value);field.setSelection(field.length());return true;}
 static EditText wrap(Activity activity,EditText field,boolean numbers){attach(activity,null,new EditText[]{field},numbers);return field;}
 static void attach(Activity activity,LinearLayout panel,EditText[] fields,boolean numbers){
  for(EditText field:fields){field.setShowSoftInputOnFocus(true);field.setImeOptions(field.getImeOptions()|EditorInfo.IME_FLAG_NO_EXTRACT_UI|EditorInfo.IME_FLAG_NO_FULLSCREEN);field.setOnFocusChangeListener((view,has)->{if(has){focused.put(activity,new WeakReference<>(field));field.postDelayed(()->{if(field.isShown()&&field.hasFocus()){InputMethodManager ime=(InputMethodManager)activity.getSystemService(Activity.INPUT_METHOD_SERVICE);if(ime!=null)ime.showSoftInput(field,0);}},150);}});}focused.put(activity,new WeakReference<>(fields[0]));
 }
}
