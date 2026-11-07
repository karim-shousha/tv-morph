package local.tvmorph.tv;
import java.util.concurrent.*;import java.util.concurrent.atomic.*;
public class CatalogWriteQueueCheck {
 public static void main(String[] args)throws Exception{
  ExecutorService queue=CatalogWriteQueue.create();CountDownLatch started=new CountDownLatch(1),release=new CountDownLatch(1);AtomicInteger last=new AtomicInteger(),count=new AtomicInteger();
  queue.execute(()->{started.countDown();try{release.await();}catch(InterruptedException e){Thread.currentThread().interrupt();}});
  if(!started.await(2,TimeUnit.SECONDS))throw new AssertionError("worker did not start");
  for(int i=1;i<=100;i++){final int n=i;queue.execute(()->{last.set(n);count.incrementAndGet();});}
  if(((ThreadPoolExecutor)queue).getQueue().size()!=1)throw new AssertionError("unbounded catalog retention");
  release.countDown();queue.shutdown();if(!queue.awaitTermination(3,TimeUnit.SECONDS))throw new AssertionError("writer stuck");
  if(last.get()!=100||count.get()!=1)throw new AssertionError("newest pending catalog was lost");
  System.out.println("PASS: 100 queued catalogs retain only the newest pending write; active write completes; no caller blocking.");
 }
}
