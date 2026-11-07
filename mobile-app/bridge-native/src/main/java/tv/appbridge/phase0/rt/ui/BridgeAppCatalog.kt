package tv.appbridge.phase0.rt.ui

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import android.widget.ImageView
import java.lang.ref.WeakReference
import java.util.concurrent.Executors
import tv.appbridge.phase0.rt.data.AppStore
import tv.appbridge.phase0.rt.session.ShizukuBackend
import android.content.Context

/** PackageManager work stays off the first frame; icon memory is capped at 2 MB. */
internal class BridgeAppCatalog : AutoCloseable {
    private data class Icon(val state: Drawable.ConstantState, val bytes: Int)
    private val icons = object : LruCache<String, Icon>(2 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Icon) = value.bytes
    }
    private val worker = Executors.newFixedThreadPool(2)
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var closed = false

    fun checkBackend(context: Context, done: (ShizukuBackend?) -> Unit) {
        worker.execute {
            val backend = ShizukuBackend(context).let { if (it.isAvailable()) it else null }
            main.post { if (!closed) done(backend) }
        }
    }

    fun load(store: AppStore, done: (List<AppStore.Entry>) -> Unit) {
        worker.execute {
            val result = runCatching { store.discover() }.getOrDefault(emptyList())
            main.post { if (!closed) done(result) }
        }
    }
    fun bind(store: AppStore, entry: AppStore.Entry, view: ImageView) {
        val key = entry.packageName + "/" + entry.activityClass
        view.tag = key
        icons.get(key)?.let { view.setImageDrawable(it.state.newDrawable(view.resources)); return }
        view.setImageDrawable(null)
        val weak = WeakReference(view)
        worker.execute {
            if (closed) return@execute
            val original = store.iconFor(entry.packageName, entry.activityClass)?.mutate()
            val target=weak.get()
            if(original==null||target==null||closed||target.tag!=key)return@execute
            val edge=(48*target.resources.displayMetrics.density).toInt().coerceIn(48,192)
            val bitmap=Bitmap.createBitmap(edge,edge,Bitmap.Config.ARGB_8888)
            original.setBounds(0,0,edge,edge);original.draw(Canvas(bitmap))
            val image=BitmapDrawable(target.resources,bitmap)
            val state=image.constantState
            if (state != null) {
                val bytes = if (image is BitmapDrawable) image.bitmap.allocationByteCount
                    else image.intrinsicWidth.coerceIn(1, 512) * image.intrinsicHeight.coerceIn(1, 512) * 4
                if (bytes <= 2 * 1024 * 1024 && !closed) icons.put(key, Icon(state, bytes.coerceAtLeast(1)))
                main.post { if (!closed) weak.get()?.let { if(it.tag==key) it.setImageDrawable(state.newDrawable(it.resources)) } }
            }
        }
    }
    override fun close() { closed = true; worker.shutdownNow(); main.removeCallbacksAndMessages(null); icons.evictAll() }
}
