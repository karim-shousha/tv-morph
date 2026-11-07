package local.tvmorph.tv;
import java.util.concurrent.*;
/** Cache writes are optional. Keep one active and one newest pending catalog, never block UI. */
final class CatalogWriteQueue {
 static ExecutorService create(){return new ThreadPoolExecutor(1,1,0L,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<Runnable>(1),new ThreadPoolExecutor.DiscardOldestPolicy());}
}
