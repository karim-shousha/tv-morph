package tv.appbridge.phase0.rt.ui

import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.os.*
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.*
import tv.appbridge.phase0.rt.session.*

/** One task per page; Android code entry can happen on the paired TV. */
class PhoneSetupActivity : Activity() {
    private lateinit var column: LinearLayout
    private lateinit var state: TextView
    private lateinit var palette: HostPalette
    private lateinit var font: Typeface
    private var stage = 1
    private var busy = false
    private var manual = false
    private var message = ""
    private var notificationGuide = false
    private var pairPort: EditText? = null
    private var connectPort: EditText? = null
    private var code: EditText? = null
    private var pairingValue = ""
    private var connectionValue = ""
    private var discovery: AutoCloseable? = null
    private var observedPaired = false
    private var observedReady = false
    private val buttons = mutableListOf<Button>()
    private val handler = Handler(Looper.getMainLooper())
    private val lang get() = getSharedPreferences("cleartv", MODE_PRIVATE).getString("language", "ar")
    private fun t(ar: String, en: String) = if (lang == "ar") ar else en
    private fun dp(n: Int) = (n * resources.displayMetrics.density).toInt()
    private fun paired() = EmbeddedAdb.isPaired(this)
    private fun shape(color: Int) = MorphHostShell.surface(this, color, palette.border, 18)
    private val poll = object : Runnable {
        override fun run() {
            if (isFinishing || isDestroyed) return
            val ready = EmbeddedShellProvider.ready()
            val saved = paired()
            if (!busy && ready && intent.getBooleanExtra("returnToAppsOnReady", false)) { finish(); return }
            if (!busy && ready && !observedReady) go(5)
            else if (!busy && !ready && observedReady && stage == 5) go(4)
            else if (!busy && saved && !observedPaired && stage < 4) go(4)
            observedReady = ready; observedPaired = saved
            if (!busy) updateState()
            handler.postDelayed(this, 700)
        }
    }
    private fun text(parent: LinearLayout, value: String, size: Float = 16f, muted: Boolean = false) = TextView(this).apply {
        text = value; textSize = size; typeface = font; includeFontPadding = false
        setTextColor(if (muted) palette.muted else palette.foreground)
        setLineSpacing(dp(4).toFloat(), 1.08f); setPadding(0, dp(6), 0, dp(6))
        textDirection = if (lang == "ar") View.TEXT_DIRECTION_RTL else View.TEXT_DIRECTION_LTR
        parent.addView(this, LinearLayout.LayoutParams(-1, -2))
    }
    private fun button(parent: LinearLayout, title: String, primary: Boolean = true, action: () -> Unit) = Button(this).apply {
        text = title; typeface = font; textSize = 16f; isAllCaps = false; isEnabled = !busy
        setTextColor(if (primary) MorphHostShell.onAccent(this@PhoneSetupActivity) else palette.foreground)
        backgroundTintList = null; background = shape(if (primary) palette.accent else palette.soft)
        minHeight = dp(54); setPadding(dp(14), dp(12), dp(14), dp(12))
        layoutParams = LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) }
        setOnClickListener { if (!busy) action() }; buttons.add(this); parent.addView(this)
    }
    private fun field(parent: LinearLayout, label: String, placeholder: String, codeField: Boolean = false): EditText {
        text(parent, label, 15f)
        return EditText(this).apply {
            hint = placeholder; typeface = font; textSize = if (codeField) 25f else 18f
            setTextColor(palette.foreground); setHintTextColor(palette.muted)
            background = shape(palette.soft); setPadding(dp(14), dp(10), dp(14), dp(10))
            setSingleLine(true); textDirection = View.TEXT_DIRECTION_LTR
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(android.text.InputFilter.LengthFilter(if (codeField) 6 else 5))
            imeOptions = if (codeField) EditorInfo.IME_ACTION_DONE else EditorInfo.IME_ACTION_NEXT
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
            parent.addView(this, LinearLayout.LayoutParams(-1, dp(58)))
        }
    }
    private fun rememberFields() {
        pairPort?.let { pairingValue = it.text.toString() }
        connectPort?.let { connectionValue = it.text.toString() }
        code?.text?.clear()
    }
    private fun go(value: Int) {
        if (busy) return
        rememberFields(); stage = value.coerceIn(1, 5); manual = false; message = ""; render()
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        palette = MorphHostShell.palette(this)
        font = Typeface.createFromAsset(assets, "ui/fonts/morph-sans-400.ttf")
        window.statusBarColor = palette.background; window.navigationBarColor = palette.background
        observedPaired = paired(); observedReady = EmbeddedShellProvider.ready()
        stage = PhoneSetupState.initial(observedReady, observedPaired, savedInstanceState?.getInt("stage") ?: intent.getIntExtra("setupStage", 1))
        pairingValue = savedInstanceState?.getString("pairPort") ?: ""
        connectionValue = savedInstanceState?.getString("connectPort") ?: ""
        notificationGuide = savedInstanceState?.getBoolean("notificationGuide") ?: intent.getBooleanExtra("notificationGuide", false)
        render(); startDiscovery()
    }
    private fun startDiscovery() {
        discovery?.close()
        discovery = PhoneAdbDiscovery.start(this, keepAlive = true) {
            if (isFinishing || isDestroyed) return@start
            pairPort?.takeIf { !it.hasFocus() && EmbeddedAdb.pairingPort > 0 }?.setText(EmbeddedAdb.pairingPort.toString())
            connectPort?.takeIf { !it.hasFocus() && EmbeddedAdb.connectionPort > 0 }?.setText(EmbeddedAdb.connectionPort.toString())
        }
    }
    private fun render() {
        pairPort = null; connectPort = null; code = null; buttons.clear()
        column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(16), dp(20), dp(30))
            layoutDirection = if (lang == "ar") View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
        }
        column.addView(MorphHostShell.header(this, { backStep() }))
        setContentView(ScrollView(this).apply { isFillViewport = true; background = MorphHostShell.background(this@PhoneSetupActivity); addView(column) })
        text(column, t("تجهيز Bridge على الموبايل", "Prepare Bridge on your phone"), 25f)
        text(column, t("التجهيز هنا للموبايل فقط. Bridge موجود بالفعل داخل لانشر التلفزيون.", "Phone setup only. Bridge is already in your TV launcher."), 15f, true)
        if (Build.VERSION.SDK_INT < 30) {
            text(column, t("المساعد المدمج يحتاج أندرويد 11 أو أحدث. إصدار الموبايل الحالي لا يدعم طريقة التجهيز دي.", "The built-in setup needs Android 11 or newer. This phone does not support this setup method."), 18f)
            button(column, t("رجوع إلى Bridge", "Back to Bridge")) { finish() }; return
        }
        val progress = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, dp(12), 0, dp(18)) }
        val names = listOf(t("المطوّر", "Developer"), t("لاسلكي", "Wireless"), t("الاقتران", "Pairing"), t("تشغيل", "Start"), t("جاهز", "Ready"))
        names.forEachIndexed { index, label ->
            progress.addView(TextView(this).apply {
                text = "${index + 1}\n$label"; gravity = Gravity.CENTER; textSize = 12f; typeface = font
                setTextColor(if (index + 1 == stage) palette.accent else palette.muted)
                setPadding(dp(2), dp(8), dp(2), dp(8))
            }, LinearLayout.LayoutParams(0, -2, 1f))
        }
        column.addView(progress)
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; background = shape(palette.surface)
            setPadding(dp(18), dp(18), dp(18), dp(22)); column.addView(this)
        }
        text(card, t("الخطوة $stage من 5", "Step $stage of 5"), 13f, true)
        when (stage) {
            1 -> {
                text(card, t("فعّل خيارات المطوّر", "Enable Developer options"), 23f)
                text(card, t("دي إعدادات على الموبايل، مش التلفزيون. لو خيارات المطوّر ظاهرة بالفعل، اضغط التالي.", "These are phone settings, not TV settings. If Developer options is already available, choose Next."))
                text(card, t("1. افتح حول الهاتف ← معلومات البرنامج.\n2. اضغط رقم الإصدار / Build number سبع مرات، وأدخل قفل الموبايل لو طُلب.\n3. ارجع لـBridge واضغط التالي. أسماء القوائم ممكن تختلف حسب الموبايل.", "1. Open About phone → Software information.\n2. Tap Build number seven times; enter your phone lock if asked.\n3. Return to Bridge and choose Next. Menu names vary by phone."), 16f, true)
                button(card, t("فتح معلومات الموبايل", "Open phone information"), false) { settings(Settings.ACTION_DEVICE_INFO_SETTINGS) }
                button(card, t("خيارات المطوّر ظاهرة · التالي", "Developer options available · next")) { go(2) }
            }
            2 -> {
                text(card, t("شغّل التصحيح اللاسلكي", "Turn on Wireless debugging"), 23f)
                text(card, t("1. افتح خيارات المطوّر على الموبايل.\n2. ابحث عن التصحيح اللاسلكي / Wireless debugging وفعّله.\n3. وافق على السماح للشبكة الحالية لو ظهر الطلب، ثم ارجع هنا.", "1. Open Developer options on your phone.\n2. Find and enable Wireless debugging.\n3. Allow the current Wi-Fi network if asked, then return here."))
                text(card, t("لا تختار كود الإقران لسه. الخطوة الجاية هتوضح إزاي تكتب الكود من ريموت التلفزيون.", "Do not open a pairing code yet. The next page explains entering the code with your TV remote."), 15f, true)
                button(card, t("فتح خيارات المطوّر", "Open Developer options"), false) { settings(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS) }
                button(card, t("فعّلت التصحيح اللاسلكي · التالي", "Wireless debugging enabled · next")) { go(3) }
            }
            3 -> if (notificationGuide) notificationPairingPage(card) else tvPairingPage(card)
            4 -> helperPage(card)
            5 -> {
                text(card, t("الموبايل جاهز ✓", "Your phone is ready ✓"), 25f)
                text(card, t("المساعد المدمج شغّال. ارجع لـBridge واختار التطبيقات، وبعدها اختار التلفزيون. افتح Bridge من لانشر التلفزيون وسيبه ظاهر علشان الاتصال.", "The built-in helper is running. Return to Bridge, choose your apps, then choose the TV. Open Bridge in your TV launcher and leave it visible to connect."))
                button(card, t("اختيار التطبيقات والتلفزيون", "Choose apps and TV")) {
                    if (EmbeddedShellProvider.ready()) { getSystemService(NotificationManager::class.java).cancel(82); setResult(RESULT_OK); finish() }
                    else { message = t("المساعد وقف. شغّله مرة أخرى.", "The helper stopped. Start it again."); stage = 4; render() }
                }
            }
        }
        state = text(card, "", 15f, true).apply { accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE }
        updateState()
        if (stage > 1 && stage < 5) button(column, t("السابق", "Back"), false) { backStep() }
    }
    private fun notificationPairingPage(card: LinearLayout) {
        text(card, t("اكتب الكود في إشعار Bridge", "Enter the code in the Bridge notification"), 23f)
        text(card, t("مش محتاج تقسيم الشاشة: نافذة كود أندرويد هتفضل مفتوحة تحت شريط الإشعارات.", "No split screen needed: Android's code dialog stays open under the notification shade."), 15f, true)
        text(card, t("الكود اللي بيظهر في إعدادات أندرويد مكوّن من 6 أرقام. مش هتكتبه على التلفزيون، ولا في شاشة اتصال Bridge.", "The code shown in Android settings has 6 digits. Do not enter it on the TV or in the Bridge TV connection screen."))
        val example = LinearLayout(this).apply { orientation = 1; background = shape(palette.soft); setPadding(dp(16), dp(12), dp(16), dp(12)); card.addView(this) }
        text(example, t("إشعار Morph Bridge على الموبايل", "Morph Bridge phone notification"), 14f, true)
        text(example, t("اكتب كود الإقران هنا ←  ● ● ● ● ● ●", "Enter pairing code here →  ● ● ● ● ● ●"), 18f)
        text(card, t("1. اضغط «إظهار الإشعار وفتح الإعدادات». هتفتح خيارات المطوّر؛ ده طبيعي. اختار التصحيح اللاسلكي / Wireless debugging.\n2. اختار «إقران الجهاز باستخدام رمز» / Pair device with pairing code. سيب نافذة الأرقام مفتوحة.\n3. اسحب شريط الإشعارات من فوق. وسّع إشعار Morph Bridge واضغط «اكتب كود الإقران هنا».\n4. اكتب نفس الستة أرقام الظاهرة، واضغط إرسال. بعد رسالة نجاح الاقتران، ارجع لـBridge.", "1. Tap Show notification & open settings. Developer options opens; choose Wireless debugging.\n2. Choose Pair device with pairing code. Keep the code dialog open.\n3. Pull down notifications. Expand Morph Bridge and tap Enter pairing code here.\n4. Enter the same six digits and tap Send. After pairing succeeds, return to Bridge."), 16f, true)
        text(card, t("بعد النجاح: اقفل شريط الإشعارات وارجع لـBridge. لو محتاج تشغيل المساعد هتظهر لك الخطوة التالية. لو نافذة الكود اتقفلت، افتح كود جديد قبل الإرسال.", "After success, dismiss notifications and return to Bridge. The next step appears if the helper still needs starting. If the code dialog closes, open a fresh code before sending."), 15f, true)
        button(card, t("إظهار الإشعار وفتح الإعدادات", "Show notification & open settings")) { prepareNotification() }

        button(card, if (manual) t("إخفاء الإدخال اليدوي", "Hide manual entry") else t("الإشعار مش ظاهر؟ إدخال يدوي", "No notification? Enter manually"), false) {
            rememberFields(); manual = !manual; render()
        }
        if (manual) {
            text(card, t("استخدم تقسيم الشاشة: إعدادات أندرويد وBridge جنب بعض. لازم نافذة الكود تفضل مفتوحة. لو الكود اتقفل، افتح نافذة جديدة واستخدم الكود والمنفذ الجديدين.", "Use split screen with Android settings and Bridge side by side. Keep the code dialog open. If it closes, open a new dialog and use its new code and port."), 15f, true)
            pairPort = field(card, t("منفذ الإقران — الرقم بعد النقطتين في نافذة الكود", "Pairing port — digits after the colon in the code dialog"), t("مثال توضيحي: 37123", "Example only: 37123")).apply { setText(pairingValue.ifEmpty { EmbeddedAdb.pairingPort.takeIf { it > 0 }?.toString() ?: "" }) }
            code = field(card, t("اكتب كود أندرويد هنا — نفس الستة أرقام", "Enter the Android code here — the same 6 digits"), t("الكود الظاهر في نافذة الإقران", "Code shown in the pairing dialog"), true)
            button(card, t("تأكيد الكود والاقتران", "Confirm code & pair")) {
                val entered = code?.text.toString(); val port = pairPort?.text.toString().toIntOrNull() ?: EmbeddedAdb.pairingPort
                val normalized = PhoneSetupState.normalizeCode(entered)
                if (!normalized.matches(Regex("[0-9]{6}")) || port !in 1..65535) {
                    message = t("اكتب الستة أرقام من نافذة أندرويد ومنفذ الإقران اللي معاها. ما تستخدمش كود التلفزيون.", "Enter the six digits and pairing port from the Android dialog. Do not use the TV code."); updateState()
                } else runTask(4) { EmbeddedAdb.pair(this, port, normalized) }
            }
        }
    }
    private fun helperPage(card: LinearLayout) {
        text(card, t("الاقتران محفوظ · شغّل المساعد", "Pairing saved · start the helper"), 23f)
        text(card, t("خلصنا كود الإقران؛ مش محتاج تدخله تاني. اضغط تشغيل المساعد. هنكتشف عنوان الاتصال على نفس الموبايل تلقائيًا.", "The pairing code is complete; do not enter it again. Tap Start helper. We will discover this phone's connection port automatically."))
        button(card, t("تشغيل المساعد المدمج", "Start built-in helper")) { startHelper() }
        button(card, t("مش لاقي الاتصال؟ افتح التصحيح اللاسلكي", "Connection missing? Open Wireless debugging"), false) { settings(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS) }
        button(card, if (manual) t("إخفاء المنفذ اليدوي", "Hide manual port") else t("إدخال منفذ الاتصال يدويًا", "Enter connection port manually"), false) { rememberFields(); manual = !manual; render() }
        if (manual) {
            text(card, t("خد الرقم بعد النقطتين من IP address & Port في الصفحة الرئيسية للتصحيح اللاسلكي. ده غير منفذ نافذة كود الإقران، وغير عنوان التلفزيون.", "Use the digits after the colon under IP address & Port on the main Wireless debugging page. This differs from the code dialog port and the TV address."), 15f, true)
            connectPort = field(card, t("منفذ الاتصال — الصفحة الرئيسية للتصحيح اللاسلكي", "Connection port — main Wireless debugging page"), t("يتعبّى تلقائيًا عند اكتشافه", "Filled automatically when found")).apply { setText(connectionValue.ifEmpty { EmbeddedAdb.connectionPort.takeIf { it > 0 }?.toString() ?: "" }) }
        }
        text(card, t("بعد إعادة تشغيل الموبايل ممكن تحتاج تشغيل المساعد من هنا مرة أخرى. مش هنرجّعك لأول الخطوات لو الاقتران لسه محفوظ.", "After a phone restart you may need to start the helper here again. Saved pairing skips the earlier steps."), 15f, true)
        button(card, t("أندرويد رفض الاقتران؟ افتح كود جديد", "Android rejected pairing? Use a new code"), false) { go(3) }
    }
    private fun startHelper() {
        if (!paired()) { go(3); return }
        val port = connectPort?.text.toString().toIntOrNull() ?: EmbeddedAdb.connectionPort
        if (port !in 1..65535 || port == EmbeddedAdb.pairingPort) {
            message = t("لسه ما لقيناش منفذ الاتصال. افتح الصفحة الرئيسية للتصحيح اللاسلكي وارجع. لو ما ظهرش تلقائيًا، افتح الإدخال اليدوي تحت.", "Connection port not found yet. Open the main Wireless debugging page and return. If it is not discovered, use manual entry below.")
            startDiscovery(); updateState(); return
        }
        runTask(5) { EmbeddedAdb.start(this, port); check(EmbeddedShellProvider.ready()) }
    }
    private fun updateState() {
        if (!::state.isInitialized) return
        state.text = if (busy) t("جارٍ تنفيذ الخطوة… استنى النتيجة.", "Working… wait for the result.") else message.ifBlank {
            when { EmbeddedShellProvider.ready() -> t("المساعد المدمج شغّال ✓", "Built-in helper running ✓")
                paired() -> t("الاقتران محفوظ ✓", "Pairing saved ✓")
                else -> t("هنأكد نجاح كل خطوة قبل ما نكمل.", "Each step is confirmed before continuing.") }
        }
    }
    private fun settings(action: String) {
        startDiscovery()
        try { startActivity(Intent(action)) } catch (_: Exception) { startActivity(Intent(Settings.ACTION_SETTINGS)) }
    }
    private fun tvPairingPage(card: LinearLayout) {
        val session = SessionService.ensure(this)
        text(card, t("اكتب الكود على التلفزيون", "Enter the code on TV"), 23f)
        text(card, t("على الموبايل: خيارات المطوّر ← التصحيح اللاسلكي ← إقران الجهاز باستخدام رمز.", "On your phone: Developer options → Wireless debugging → Pair device with pairing code."))
        text(card, t("سيب نافذة الكود مفتوحة. اكتب نفس الـ6 أرقام على التلفزيون واضغط اتصال، وبعدها ارجع للموبايل.", "Keep the code dialog open. Enter the same 6 digits on TV, choose Connect, then return to your phone."), 16f, true)
        if (!session.tvConnected) button(card, t("البحث عن التلفزيون وربطه", "Find and pair your TV")) {
            startActivity(Intent(this, HostActivity::class.java).putExtra("setupTvFirst", true)); finish()
        }
        button(card, t("إظهار خانة الكود على التلفزيون", "Show code entry on the TV")) {
            when {
                !session.tvConnected -> { message = t("اربط التلفزيون وافتح Bridge عليه الأول.", "Pair your TV and open Bridge on it first."); updateState() }
                !session.tvPhoneSetupSupported -> { message = t("حدّث Bridge على التلفزيون لاستخدام الكود بالريموت.", "Update Bridge on your TV to enter the code with your remote."); updateState() }
                else -> { TvPhoneSetup.arm(this); settings(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS) }
            }
        }
        button(card, t("التلفزيون قديم؟ كتابة الكود من الإشعار", "Older TV? Enter code in notification"), false) { notificationGuide = true; render() }
    }
    private fun prepareNotification() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 81); return
        }
        openPairingSettings()
    }
    private fun openPairingSettings() {
        val manager = getSystemService(NotificationManager::class.java)
        val channelBlocked = manager.getNotificationChannel("phone_setup")?.importance == NotificationManager.IMPORTANCE_NONE
        if (!manager.areNotificationsEnabled() || channelBlocked) {
            message = t("إشعارات Bridge مقفولة. افتح إعدادات إشعارات التطبيق وفعّلها، أو اختار الإدخال اليدوي وتقسيم الشاشة.", "Bridge notifications are disabled. Enable them in app notification settings, or use manual entry with split screen."); updateState()
            startActivity(Intent(if (channelBlocked) Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS else Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, packageName).putExtra(Settings.EXTRA_CHANNEL_ID, "phone_setup")); return
        }
        PhonePairingReceiver.notify(this, t("سيب نافذة كود أندرويد مفتوحة. اضغط «اكتب كود الإقران هنا»، اكتب الستة أرقام، ثم إرسال.", "Keep the Android code dialog open. Tap Enter pairing code here, type its six digits, then Send."))
        settings(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)
    }
    private fun runTask(next: Int, action: () -> Unit) {
        busy = true; message = ""; buttons.forEach { it.isEnabled = false }; updateState()
        Thread {
            val error = try { action(); null } catch (error: Throwable) { error.message ?: "" }
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                busy = false
                if (error == null) {
                    observedPaired = paired(); observedReady = EmbeddedShellProvider.ready()
                    if (next == 5 && !observedReady) { message = t("المساعد لم يبدأ بعد. حاول تشغيله مرة أخرى.", "The helper is not running yet. Try again."); render() } else go(next)
                } else {
                    message = t("الخطوة ما كملتش. ", "This step did not finish. ") + (if (lang == "ar") error else "Check Wireless debugging and the connection, then try again.") + if (stage == 3) t(" افتح نافذة كود جديدة واستخدم الأرقام الجديدة.", " Open a fresh pairing dialog and use its new digits.") else ""
                    code?.text?.clear(); buttons.forEach { it.isEnabled = true }; updateState()
                }
            }
        }.start()
    }
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); go(if (EmbeddedShellProvider.ready()) 5 else if (paired()) 4 else 3) }
    override fun onResume() { super.onResume(); startDiscovery(); handler.removeCallbacks(poll); handler.post(poll) }
    override fun onPause() { handler.removeCallbacks(poll); super.onPause() }
    override fun onDestroy() { handler.removeCallbacks(poll); discovery?.close(); super.onDestroy() }
    override fun onSaveInstanceState(out: Bundle) {
        out.putBoolean("notificationGuide", notificationGuide)
        rememberFields(); out.putInt("stage", stage); out.putString("pairPort", pairingValue); out.putString("connectPort", connectionValue); super.onSaveInstanceState(out)
    }
    private fun backStep() {
        if (busy) return
        TvPhoneSetup.cancel()
        if (stage == 3 && notificationGuide) { notificationGuide = false; manual = false; render(); return }
        if (stage > 1) go(stage - 1) else finish()
    }
    override fun onBackPressed() { backStep() }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, results)
        if (requestCode == 81) {
            if (results.firstOrNull() == PackageManager.PERMISSION_GRANTED) openPairingSettings()
            else { message = t("الإذن ما اتسمحش. اختار الإدخال اليدوي تحت مع تقسيم الشاشة، أو فعّل إشعارات التطبيق من الإعدادات.", "Notification permission was not granted. Use manual entry with split screen below, or enable app notifications in Settings."); updateState() }
        }
    }
}

class PhonePairingReceiver : BroadcastReceiver() {
    companion object {
        fun notify(context: Context, message: String, codeEntry: Boolean = true) {
            val ar = context.getSharedPreferences("cleartv", Context.MODE_PRIVATE).getString("language", "ar") == "ar"
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel("phone_setup", if (ar) "تجهيز الموبايل لـBridge" else "Bridge phone setup", NotificationManager.IMPORTANCE_HIGH))
            val pending = PendingIntent.getBroadcast(context, 82, Intent(context, PhonePairingReceiver::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE)
            val input = RemoteInput.Builder("pair_code").setLabel(if (ar) "اكتب نفس الستة أرقام الظاهرة في إعدادات أندرويد" else "Enter the same six digits shown in Android settings").build()
            val action = Notification.Action.Builder(null, if (ar) "اكتب كود الإقران هنا" else "Enter pairing code here", pending).addRemoteInput(input).build()
            val open = PendingIntent.getActivity(context, 83, Intent(context, PhoneSetupActivity::class.java).putExtra("setupStage", 3).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            try { manager.notify(82, Notification.Builder(context, "phone_setup").setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
                .setContentTitle(if (ar) "Morph Bridge · كود تجهيز الموبايل" else "Morph Bridge · phone setup code")
                .setContentText(message).setStyle(Notification.BigTextStyle().bigText(message))
                .setContentIntent(open).apply { if (codeEntry) addAction(action) }.setOngoing(true).build()) } catch (_: SecurityException) { }
        }
    }
    override fun onReceive(context: Context, intent: Intent) {
        val entered = RemoteInput.getResultsFromIntent(intent)?.getCharSequence("pair_code")?.toString()?.trim() ?: return
        val ar = context.getSharedPreferences("cleartv", Context.MODE_PRIVATE).getString("language", "ar") == "ar"
        val pending = goAsync()
        Thread {
            try {
                EmbeddedAdb.pair(context, EmbeddedAdb.pairingPort, entered)
                // Pairing is a completed step even when connection discovery has not finished yet.
                val connection = EmbeddedAdb.connectionPort
                val started = if (connection in 1..65535 && connection != EmbeddedAdb.pairingPort) try {
                    EmbeddedAdb.start(context, connection); EmbeddedShellProvider.ready()
                } catch (_: Throwable) { false } else false
                context.getSystemService(NotificationManager::class.java).cancel(82)
                notify(context, if (started) {
                    if (ar) "الموبايل جاهز ✓ ارجع إلى Bridge لاختيار التطبيقات والتلفزيون." else "Phone ready ✓ Return to Bridge to choose apps and TV."
                } else {
                    if (ar) "الاقتران نجح ✓ ارجع إلى Bridge وأكمل تشغيل المساعد. لا تدخل الكود مرة أخرى." else "Pairing succeeded ✓ Return to Bridge and start the helper. Do not enter the code again."
                }, codeEntry = false)
            } catch (_: Throwable) {
                notify(context, if (ar) "الاقتران لم يكتمل. افتح نافذة كود جديدة، وسيبها مفتوحة، ثم اكتب الكود الجديد هنا." else "Pairing did not finish. Open a new code dialog, keep it open, then enter the new code here.")
            } finally { pending.finish() }
        }.start()
    }
}
