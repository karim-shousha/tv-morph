package tv.appbridge.phase0.rt.session

import android.content.ComponentName
import android.content.Intent

/** Shell-only task control. Never change a task belonging to the phone display. */
internal class TvTaskRecents {
    private val manager = Class.forName("android.app.ActivityTaskManager").getMethod("getService").invoke(null)
    private val getTasks = manager.javaClass.getMethod("getTasks", Int::class.javaPrimitiveType,
        Boolean::class.javaPrimitiveType, Boolean::class.javaPrimitiveType, Int::class.javaPrimitiveType)
        .apply { isAccessible = true }
    private val tokenType = Class.forName("android.window.WindowContainerToken")
    private val transactionType = Class.forName("android.window.WindowContainerTransaction")
    private val exclude = transactionType.getMethod("setTaskForceExcludedFromRecents", tokenType, Boolean::class.javaPrimitiveType)
    private val organizerType = Class.forName("android.window.WindowOrganizer")
    private val organizer = organizerType.getConstructor().newInstance()
    private val apply = organizerType.getMethod("applyTransaction", transactionType)
    private val hidden = HashSet<Int>()

    fun update(selected: String, targetDisplay: Int, enabled: Boolean) {
        if (targetDisplay <= 0 || selected.isEmpty()) return
        val transaction = transactionType.getConstructor().newInstance()
        val tasks = getTasks.invoke(manager, 100, false, false, -1) as List<*>
        val alive = HashSet<Int>()
        val changed = ArrayList<Pair<Int, Boolean>>()
        for (task in tasks.filterNotNull()) {
            val type = task.javaClass
            val id = type.getField("taskId").getInt(task)
            alive.add(id)
            val display = type.getField("displayId").getInt(task)
            // Restore only our own change if the owner moves the task to another display.
            if (display != targetDisplay) {
                if (id in hidden) {
                    exclude.invoke(transaction, type.getField("token").get(task), false)
                    changed.add(id to false)
                }
                continue
            }
            val base = type.getField("baseIntent").get(task) as? Intent
            val top = type.getField("topActivity").get(task) as? ComponentName
            val belongsToApp = base?.component?.packageName == selected || top?.packageName == selected
            val shouldHide = enabled && (belongsToApp || id in hidden)
            if (!belongsToApp && id !in hidden) continue
            if (shouldHide == (id in hidden)) continue
            exclude.invoke(transaction, type.getField("token").get(task), shouldHide)
            changed.add(id to shouldHide)
        }
        hidden.retainAll(alive)
        if (changed.isEmpty()) return
        apply.invoke(organizer, transaction)
        for ((id, value) in changed) {
            if (value) hidden.add(id) else hidden.remove(id)
            android.util.Log.i("APPBRIDGE-PROBE", "probe=tv_recents task=$id excluded=$value displayId=$targetDisplay")
        }
    }
}
