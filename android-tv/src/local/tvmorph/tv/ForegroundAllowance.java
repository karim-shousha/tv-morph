package local.tvmorph.tv;
/** Foreground-only persistent allowance accounting; elapsed time is monotonic. */
final class ForegroundAllowance {
 interface Store {long read(String id);void write(String id,long remaining);}
 private final Store store;private String id="";private long at=-1;
 ForegroundAllowance(Store store){this.store=store;}
 void focus(String next,long now){settle(now);id=next==null?"":next;at=now;}
 void settle(long now){if(at>=0&&!id.isEmpty()){long left=store.read(id);if(left>0)store.write(id,Math.max(0,left-Math.max(0,now-at)));}at=now;}
 String current(){return id;}
}
