package tv.appbridge.phase0.rt.ui

import android.graphics.*
import android.graphics.drawable.Drawable

/** The same simple outline symbols used by the TV installation wizard. */
internal class BridgeWizardIcon(private val kind: String, color: Int) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = 1.8f
        strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }
    override fun draw(canvas: Canvas) {
        val save = canvas.save()
        canvas.translate(bounds.left.toFloat(), bounds.top.toFloat())
        canvas.scale(bounds.width()/24f, bounds.height()/24f)
        fun line(vararg points: Float) {
            val path = Path(); path.moveTo(points[0], points[1])
            for (i in 2 until points.size step 2) path.lineTo(points[i], points[i+1])
            canvas.drawPath(path, paint)
        }
        when (kind) {
            "search" -> { canvas.drawCircle(10f,10f,6.5f,paint); line(15f,15f,21f,21f) }
            "tv" -> { canvas.drawRoundRect(RectF(2f,3f,22f,17f),2f,2f,paint);line(12f,17f,12f,21f);line(7f,21f,17f,21f) }
            "code" -> { canvas.drawRoundRect(RectF(3f,5f,21f,19f),2f,2f,paint);line(8f,10f,6f,12f,8f,14f);line(16f,10f,18f,12f,16f,14f);line(13f,9f,11f,15f) }
            "apps" -> for (x in listOf(3f,14f)) for (y in listOf(3f,14f)) canvas.drawRoundRect(RectF(x,y,x+7,y+7),1f,1f,paint)
            "check" -> { canvas.drawCircle(12f,12f,9f,paint);line(7f,12f,10.5f,15.5f,17f,9f) }
            "phone" -> {canvas.drawRoundRect(RectF(6f,2f,18f,22f),2.5f,2.5f,paint);line(10f,18f,14f,18f)}
        }
        canvas.restoreToCount(save)
    }
    override fun setAlpha(alpha: Int) { paint.alpha=alpha }
    override fun setColorFilter(filter: ColorFilter?) { paint.colorFilter=filter }
    @Deprecated("Deprecated in Java") override fun getOpacity() = PixelFormat.TRANSLUCENT
}
