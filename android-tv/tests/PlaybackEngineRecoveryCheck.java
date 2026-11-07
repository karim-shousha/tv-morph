package local.tvmorph.tv;

/** Pure policy checks: never infer an unsupported format from a system failure. */
public final class PlaybackEngineRecoveryCheck {
  private static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
  public static void main(String[] args){
    for(int code:new int[]{-1010,-1007,Integer.MIN_VALUE}){
      PlaybackEngineRecovery recovery=new PlaybackEngineRecovery();
      check(recovery.tryAlternate(code,false),"One alternate engine is allowed: "+code);
      check(!recovery.tryAlternate(code,false),"Never loop between engines");
      check(!recovery.tryAlternate(-1010,false),"Other error codes do not reset the attempt");
      recovery.reset();check(recovery.tryAlternate(code,false),"Explicit Retry starts a fresh bounded attempt");
    }
    for(int code:new int[]{-1004,-110,0,1,401,403,404})check(!new PlaybackEngineRecovery().tryAlternate(code,false),"Network/provider/unknown failures are not decoder failures: "+code);
    for(int code:new int[]{-1010,-1007,Integer.MIN_VALUE}){
      PlaybackEngineRecovery recovery=new PlaybackEngineRecovery();
      check(recovery.tryAlternate(code,true),"A local USB file may try the alternate decoder once");
      check(!recovery.tryAlternate(code,false),"The local attempt consumes the same bounded recovery budget");
    }
    check(StreamFallback.category(1,Integer.MIN_VALUE).equals("unknown"),"System error must not be labelled unsupported");
    System.out.println("PASS bounded system-error engine recovery; explicit reset; local fallback and network exclusions; honest classification");
  }
}
