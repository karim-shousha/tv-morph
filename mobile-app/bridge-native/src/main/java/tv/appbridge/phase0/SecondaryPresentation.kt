package tv.appbridge.phase0

import android.app.Presentation
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Bundle
import android.view.Display
import android.view.View
import android.widget.FrameLayout

/**
 * Content shown on the secondary display: a test pattern plus a movable
 * pointer dot. This is the unprivileged half of the remote-input story -
 * whatever the TV sends (future WebSocket) is rendered HERE, inside our own
 * content, requiring no input-injection permission.
 */
class SecondaryPresentation(context: Context, display: Display) : Presentation(context, display) {

    lateinit var overlay: PointerOverlayView
        private set

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        overlay = PointerOverlayView(context, display.displayId)
        val root = FrameLayout(context)
        root.setBackgroundColor(Color.rgb(18, 24, 38))
        val lp = android.view.ViewGroup.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        )
        root.addView(overlay, lp)
        setContentView(root)
    }

    fun movePointer(nx: Float, ny: Float) {
        if (::overlay.isInitialized) overlay.setPointer(nx, ny)
    }

    class PointerOverlayView(context: Context, private val did: Int) : View(context) {
        private var px = 0.5f
        private var py = 0.5f
        private val text = Paint().apply { color = Color.WHITE; textSize = 42f }
        private val dot = Paint().apply { color = Color.rgb(0, 229, 255) }
        private val ring = Paint().apply {
            color = Color.WHITE; style = Paint.Style.STROKE; strokeWidth = 4f
        }
        private val grid = Paint().apply { color = Color.argb(60, 255, 255, 255); strokeWidth = 2f }

        fun setPointer(nx: Float, ny: Float) {
            px = nx.coerceIn(0f, 1f)
            py = ny.coerceIn(0f, 1f)
            invalidate()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val w = width.toFloat()
            val h = height.toFloat()
            var gx = 0f
            while (gx <= w) { canvas.drawLine(gx, 0f, gx, h, grid); gx += w / 8f }
            var gy = 0f
            while (gy <= h) { canvas.drawLine(0f, gy, w, gy, grid); gy += h / 8f }
            canvas.drawText("AppBridge VD  displayId=$did", 40f, 90f, text)
            canvas.drawText("pointer = (%.2f, %.2f)".format(px, py), 40f, 150f, text)
            val cx = px * w
            val cy = py * h
            canvas.drawCircle(cx, cy, 46f, ring)
            canvas.drawCircle(cx, cy, 16f, dot)
            canvas.drawLine(cx - 70f, cy, cx + 70f, cy, ring)
            canvas.drawLine(cx, cy - 70f, cx, cy + 70f, ring)
        }
    }
}
