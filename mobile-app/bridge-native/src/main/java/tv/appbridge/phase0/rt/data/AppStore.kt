package tv.appbridge.phase0.rt.data

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.os.Build

/**
 * Installed-app discovery + user selection persistence.
 * No QUERY_ALL_PACKAGES: a <queries> MAIN/LAUNCHER block is sufficient.
 */
class AppStore(private val context: Context) {

    data class Entry(
        val label: String,
        val packageName: String,
        val activityClass: String
    )

    private val prefs = context.getSharedPreferences("appbridge_sel", Context.MODE_PRIVATE)

    fun discover(): List<Entry> {
        val pm = context.packageManager
        val main = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val infos = if (Build.VERSION.SDK_INT >= 33) {
            pm.queryIntentActivities(main, PackageManager.ResolveInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(main, 0)
        }
        return infos.mapNotNull {
            val pkg = it.activityInfo?.packageName ?: return@mapNotNull null
            if (pkg == context.packageName) return@mapNotNull null
            Entry(
                it.loadLabel(pm).toString(),
                pkg,
                it.activityInfo.name
            )
        }.sortedBy { it.label.lowercase() }
    }

    fun iconFor(packageName: String, activityClass: String): Drawable? {
        return try {
            val pm = context.packageManager
            val cn = android.content.ComponentName(packageName, activityClass)
            pm.getActivityIcon(cn)
        } catch (t: Throwable) {
            try {
                context.packageManager.getApplicationIcon(packageName)
            } catch (t2: Throwable) {
                null
            }
        }
    }

    fun isSelected(packageName: String): Boolean =
        prefs.getBoolean("sel:$packageName", false)

    fun iconData(entry: Entry): String? = try {
        val icon = iconFor(entry.packageName, entry.activityClass)
        if (icon == null) null else {
            val bitmap = android.graphics.Bitmap.createBitmap(96, 96, android.graphics.Bitmap.Config.ARGB_8888)
            icon.setBounds(0, 0, 96, 96)
            icon.draw(android.graphics.Canvas(bitmap))
            val out = java.io.ByteArrayOutputStream()
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
            bitmap.recycle()
            "data:image/png;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
        }
    } catch (_: Throwable) { null }

    fun setSelected(packageName: String, selected: Boolean) {
        prefs.edit().putBoolean("sel:$packageName", selected).apply()
    }

    fun selected(discovered: List<Entry>): List<Entry> =
        discovered.filter { isSelected(it.packageName) }
}
