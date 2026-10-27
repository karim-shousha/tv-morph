package local.tvmorph.tv;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Physical connector numbers are independent of TvInputManager enumeration order. */
final class HdmiPort {
 private static final Pattern LABEL=Pattern.compile("(?i)\\bHDMI\\s*[-:#]?\\s*([0-9]{1,2})\\b");
 static int number(int physicalPort,String label){
  if(physicalPort>0&&physicalPort<=99)return physicalPort;
  Matcher match=LABEL.matcher(label==null?"":label);
  if(match.find()){int port=Integer.parseInt(match.group(1));if(port>0)return port;}
  return 0;
 }
 private HdmiPort(){}
}
