package local.tvmorph.tv;
import java.util.Locale;
final class SourceSelectorPolicy {
 static boolean matches(String name){if(name==null)return false;String full=name.toLowerCase(Locale.ROOT),n=full.substring(full.lastIndexOf('.')+1);if(full.matches(".*(factory|reset|recovery|format|wipe|engineering|inputmethod|keyboard|languageandinput|externalsources|external_sources|unknown|install|specialaccess|permission|applications|\\.apps\\.|test).*"))return false;return n.matches(".*(?:inputsource|sourceinput|sourceselect|selectsource|sourceswitch|switchsource|sourcepicker|sourcelist|sourcemenu|tvinput|inputselect|selectinput|inputswitch|switchinput|inputpicker|inputspanel|inputpanel|inputlist|sourceactivity|sourcesactivity).*");}
 static int rank(String name){if(!matches(name))return 0;String n=name.toLowerCase(Locale.ROOT);return n.matches(".*(picker|select|menu|switch|list).*")?3:n.contains("settings")?1:2;}
}
