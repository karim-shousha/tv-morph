package tv.appbridge.phase0.rt.ui

import android.app.Activity
import android.content.Context
import android.graphics.*
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.*

/** Embedded Bridge uses the phone's preferences and chrome, never a second app theme. */
object MorphHostShell {
    fun appearance(context: Context): String = "dark"
    fun palette(context: Context): HostPalette = if (appearance(context) == "dark") HostPalette(
        PhoneDesignTokens.backgroundBase, PhoneDesignTokens.surface, PhoneDesignTokens.text, PhoneDesignTokens.muted,
        PhoneDesignTokens.border, PhoneDesignTokens.accent, PhoneDesignTokens.accentEnd, PhoneDesignTokens.link,
        PhoneDesignTokens.soft, 0xff83dcb4.toInt(), 0xffffb3ba.toInt(), 0xff382331.toInt(), PhoneDesignTokens.backgroundBase
    ) else HostPalette(
        PhoneDesignTokens.lightBackgroundBase,PhoneDesignTokens.lightSurface,PhoneDesignTokens.lightText,PhoneDesignTokens.lightMuted,
        PhoneDesignTokens.lightBorder,PhoneDesignTokens.lightAccent,PhoneDesignTokens.lightAccentEnd,PhoneDesignTokens.lightLink,
        PhoneDesignTokens.lightSoft,PhoneDesignTokens.lightSuccess,PhoneDesignTokens.lightDanger,PhoneDesignTokens.lightSoft,PhoneDesignTokens.lightBackgroundBase
    )
    fun onAccent(context: Context): Int = if(appearance(context)=="dark") PhoneDesignTokens.onAccent else PhoneDesignTokens.lightOnAccent
    fun background(context: Context): Drawable = GradientDrawable().apply {
        val dark=appearance(context)=="dark"
        gradientType=GradientDrawable.RADIAL_GRADIENT;setGradientCenter(1f,0f)
        gradientRadius=context.resources.displayMetrics.widthPixels*1.2f
        colors=if(dark) intArrayOf(PhoneDesignTokens.backgroundTop,PhoneDesignTokens.backgroundMiddle,PhoneDesignTokens.backgroundBottom)
            else intArrayOf(PhoneDesignTokens.lightBackgroundTop,PhoneDesignTokens.lightBackgroundMiddle,PhoneDesignTokens.lightBackgroundBottom)
    }
    fun surface(context: Context, color: Int, stroke: Int, radius: Int): GradientDrawable = GradientDrawable().apply {
        if (color == palette(context).surface) {
            orientation = GradientDrawable.Orientation.TL_BR
            colors = if(appearance(context)=="dark") intArrayOf(PhoneDesignTokens.glassTop,PhoneDesignTokens.glassBottom) else intArrayOf(PhoneDesignTokens.lightGlassTop,PhoneDesignTokens.lightGlassBottom)
        } else setColor(color)
        cornerRadius = dp(context,if(color==palette(context).surface) PhoneDesignTokens.cardRadius else radius).toFloat();setStroke(dp(context,1),stroke)
    }
    fun dp(context: Context, value: Int): Int = (value * context.resources.displayMetrics.density + .5f).toInt()
    private fun ar(context: Context) = context.getSharedPreferences("cleartv", Context.MODE_PRIVATE).getString("language", "ar") == "ar"
    fun navigation(owner: Activity): View {
        val p = palette(owner)
        return LinearLayout(owner).apply {
            orientation=LinearLayout.HORIZONTAL; layoutDirection=if(ar(owner))View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
            background=surface(owner,p.surface,p.border,16);setPadding(dp(owner,5),dp(owner,5),dp(owner,5),dp(owner,5))
            layoutParams=LinearLayout.LayoutParams(-1,dp(owner,62)).apply { topMargin=dp(owner,8) }
            val routes=listOf("home","play","control","matches","more")
            val labels=if(ar(owner))listOf("الرئيسية","القنوات","الريموت","المباريات","المزيد") else listOf("Home","IPTV","Remote","Matches","More")
            routes.forEachIndexed { i, route ->
                addView(LinearLayout(owner).apply {
                    orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER
                    layoutParams=LinearLayout.LayoutParams(0,-1,1f)
                    addView(ImageView(owner).apply { setImageDrawable(ShellIcon("nav$route",p.muted,dp(owner,22))) },LinearLayout.LayoutParams(dp(owner,24),dp(owner,24)))
                    addView(TextView(owner).apply { text=labels[i];textSize=10f;setTextColor(p.muted);gravity=Gravity.CENTER })
                    contentDescription=labels[i]
                    setOnClickListener {
                        owner.startActivity(android.content.Intent().setClassName(owner,"local.cleartv.mobile.MainActivity").putExtra("phonePage",route).addFlags(android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP))
                        owner.finish()
                    }
                })
            }
        }
    }
    fun header(owner: Activity, back: () -> Unit, settings: (() -> Unit)? = null, reconnect: (() -> Unit)? = null): View {
        val colors=palette(owner)
        return FrameLayout(owner).apply {
            layoutDirection=View.LAYOUT_DIRECTION_LTR
            layoutParams=LinearLayout.LayoutParams(-1,dp(owner,PhoneDesignTokens.headerHeight))
            fun icon(kind: String, label: String, action: () -> Unit) = ImageButton(owner).apply {
                contentDescription=label;tag="morph-bridge-$kind";scaleType=ImageView.ScaleType.CENTER
                setImageDrawable(ShellIcon(kind,colors.foreground,dp(owner,if(kind=="back")PhoneDesignTokens.backIcon else if(kind=="settings")19 else 22)))
                setPadding(0,0,0,0);background=android.graphics.drawable.ColorDrawable(Color.TRANSPARENT);setOnClickListener{action()}
            }
            addView(icon("back",if(ar(owner))"رجوع" else "Back",back),FrameLayout.LayoutParams(dp(owner,44),dp(owner,48),Gravity.START or Gravity.CENTER_VERTICAL))
            addView(LinearLayout(owner).apply {
                orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER_VERTICAL
                contentDescription="Morph TV";tag="morph-bridge-wordmark"
                addView(ImageView(owner).apply {
                    scaleType=ImageView.ScaleType.FIT_CENTER
                    try { setImageBitmap(owner.assets.open("ui/morph-header-symbol.webp").use { BitmapFactory.decodeStream(it) }) }
                    catch (_: Exception) { setImageResource(tv.appbridge.phase0.R.drawable.morph_logo) }
                },LinearLayout.LayoutParams(dp(owner,42),dp(owner,42)))
                addView(TextView(owner).apply { text="orph TV";textSize=24f;setTextColor(colors.foreground);setTypeface(typeface,android.graphics.Typeface.BOLD) })
            },FrameLayout.LayoutParams(-2,dp(owner,48),Gravity.START or Gravity.CENTER_VERTICAL).apply { leftMargin=dp(owner,56) })
            if(settings!=null)addView(icon("settings",if(ar(owner))"إعدادات Bridge" else "Bridge settings",settings),FrameLayout.LayoutParams(dp(owner,44),dp(owner,44),Gravity.END or Gravity.CENTER_VERTICAL))
            if(reconnect!=null)addView(icon("reconnect",if(ar(owner))"ربط التلفزيون" else "Connect TV",reconnect),FrameLayout.LayoutParams(dp(owner,44),dp(owner,46),Gravity.END or Gravity.CENTER_VERTICAL).apply{rightMargin=dp(owner,52)})
        }
    }
    private class ShellIcon(private val kind: String, private val color: Int,private val size:Int) : Drawable() {
        override fun getIntrinsicWidth()=size
        override fun getIntrinsicHeight()=size
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = this@ShellIcon.color; style = Paint.Style.STROKE; strokeWidth = 1.8f; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND }
        override fun draw(canvas: Canvas) {
            val save = canvas.save(); canvas.translate(bounds.left.toFloat(), bounds.top.toFloat()); canvas.scale(bounds.width()/24f, bounds.height()/24f)
            if (kind == "back") { val path=Path();path.moveTo(14f,6f);path.lineTo(8f,12f);path.lineTo(14f,18f);canvas.drawPath(path,paint) }
            else if(kind.startsWith("nav")) {
                when(kind) {
                    "navhome" -> {val p=Path();p.moveTo(3f,11f);p.lineTo(12f,3f);p.lineTo(21f,11f);p.lineTo(21f,21f);p.lineTo(15f,21f);p.lineTo(15f,14f);p.lineTo(9f,14f);p.lineTo(9f,21f);p.lineTo(3f,21f);p.close();canvas.drawPath(p,paint)}
                    "navplay" -> {canvas.drawRoundRect(RectF(3f,4f,21f,17f),2f,2f,paint);canvas.drawLine(8f,21f,16f,21f,paint);canvas.drawLine(12f,17f,12f,21f,paint)}
                    "navcontrol" -> {canvas.drawRoundRect(RectF(7f,2f,17f,22f),4f,4f,paint);canvas.drawCircle(12f,12f,3f,paint);canvas.drawPoint(12f,5f,paint)}
                    else -> {for(x in listOf(4f,14f))for(y in listOf(4f,14f))canvas.drawRoundRect(RectF(x,y,x+6,y+6),1f,1f,paint)}
                }
            }
            else if(kind=="reconnect"){canvas.drawArc(RectF(3f,4f,21f,22f),-50f,300f,false,paint);val p=Path();p.moveTo(12f,2f);p.lineTo(18f,2f);p.lineTo(18f,8f);canvas.drawPath(p,paint)}
            else { val points=floatArrayOf(19f,12f,18.9f,10.8f,21f,9.2f,19f,5.8f,16.6f,6.8f,14.6f,5.6f,14f,3f,10f,3f,9.5f,5.6f,7.5f,6.8f,5.1f,5.8f,3.1f,9.2f,5.1f,10.8f,5f,12f,5.1f,13.2f,3.1f,14.8f,5.1f,18.2f,7.5f,17.2f,9.5f,18.4f,10f,21f,14f,21f,14.5f,18.4f,16.5f,17.2f,18.9f,18.2f,20.9f,14.8f,18.9f,13.2f);val p=Path();p.moveTo(points[0],points[1]);for(i in 2 until points.size step 2)p.lineTo(points[i],points[i+1]);p.close();canvas.drawPath(p,paint);canvas.drawCircle(12f,12f,3f,paint) }
            canvas.restoreToCount(save)
        }
        override fun setAlpha(alpha: Int) { paint.alpha=alpha }
        override fun setColorFilter(filter: ColorFilter?) { paint.colorFilter=filter }
        @Deprecated("Drawable opacity") override fun getOpacity() = PixelFormat.TRANSLUCENT
    }
}

