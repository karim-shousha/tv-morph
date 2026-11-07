package tv.appbridge.phase0.rt.ui

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.*
import tv.appbridge.phase0.R
import tv.appbridge.phase0.rt.data.AppStore
import tv.appbridge.phase0.rt.session.*
import tv.appbridge.phase0.rt.tv.TvDiscovery
import tv.appbridge.phase0.rt.tv.SendToTv
import tv.appbridge.phase0.rt.tv.SdbClient
import tv.appbridge.phase0.rt.tv.AndroidTvInstaller
import tv.appbridge.phase0.rt.tv.LgTvInstaller
import tv.appbridge.phase0.rt.tv.WgtPackage

/** Three user steps; diagnostics stay in Settings. No screen-sharing flow. */
class HostActivity : Activity() {
    private lateinit var mgr: SessionManager
    private lateinit var root: LinearLayout
    private lateinit var content: LinearLayout
    private lateinit var status: TextView
    private var step = 2
    private var awaitingPhoneSetup = true
    private var setupAutoArmed = false
    private val flowHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private var flowTvConnected = false
    private var flowSetupState = ""
    private val flowPoll = object : Runnable {
        override fun run() {
            if (isFinishing || isDestroyed) return
            advancePhoneSetup()
            if (step == 3 && !EmbeddedShellProvider.ready() && (flowTvConnected != mgr.tvConnected || flowSetupState != TvPhoneSetup.state)) render()
            flowTvConnected = mgr.tvConnected; flowSetupState = TvPhoneSetup.state
            flowHandler.postDelayed(this, 700)
        }
    }
    private var query = ""
    private var busy = false
    private var note = ""
    private var found = emptyList<TvDiscovery.Found>()
    private var autoScanStarted = false
    private var restoringTv = false
    private var advancedTv = false
    private var apps = emptyList<AppStore.Entry>()
    private val catalog = BridgeAppCatalog()
    private var appsLoading = true
    private var adbDiscovery: AutoCloseable? = null
    private val lightTheme get() = MorphHostShell.appearance(this) == "light"
    private val palette get() = MorphHostShell.palette(this)
    private var paintedAppearance = ""
    private var paintedLanguage = ""
    private val bg get() = palette.background
    private val card get() = palette.surface
    private val purple get() = palette.accent
    private val muted get() = palette.muted
    private val border get() = palette.border
    private val ink get() = palette.foreground
    private var trialNotice: TextView? = null
    private var trialWelcome: AlertDialog? = null
    private var selectionCount: TextView? = null
    private var actionButton: Button? = null
    private var runHeading: TextView? = null
    private var selectedIp = ""
    private var pendingTvPick: Pair<String, String>? = null
    private var selectedBrand = "samsung"
    private var lastMainStep = 1
    private var installTitle = ""
    private var installStatus: TextView? = null
    private var installSpinner: ProgressBar? = null
    private var wgtTargetIp = ""
    private val prefs by lazy { getSharedPreferences("appbridge_net", MODE_PRIVATE) }
    private val arabicFont by lazy { Typeface.createFromAsset(assets, "ui/fonts/morph-sans-400.ttf") }
    private val mediumFont by lazy { Typeface.createFromAsset(assets, "ui/fonts/morph-sans-600.ttf") }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(if (lightTheme) android.R.style.Theme_Material_Light_NoActionBar else android.R.style.Theme_Material_NoActionBar)
        super.onCreate(savedInstanceState)
        installTitle = tr("تثبيت تطبيق التلفزيون", "Install TV receiver")
        window.statusBarColor = bg
        window.navigationBarColor = bg
        window.decorView.systemUiVisibility = 0
        step = savedInstanceState?.getInt("step", 2) ?: 2
        awaitingPhoneSetup = savedInstanceState?.getBoolean("awaitingPhoneSetup") ?: true
        setupAutoArmed = savedInstanceState?.getBoolean("setupAutoArmed") ?: false
        lastMainStep = savedInstanceState?.getInt("lastMainStep", 1) ?: 1
        query = savedInstanceState?.getString("query", "") ?: ""
        selectedIp = savedInstanceState?.getString("selectedIp") ?: prefs.getString("tv_ip", "") ?: ""
        selectedBrand = savedInstanceState?.getString("selectedBrand") ?: prefs.getString("tv_brand", "samsung") ?: "samsung"
        wgtTargetIp = savedInstanceState?.getString("wgtTargetIp", "") ?: ""
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        mgr = SessionService.ensure(this)
        if (savedInstanceState == null && mgr.tvConnected) { step = 1; awaitingPhoneSetup = false }
        if (intent.getBooleanExtra("setupTvFirst", false) && !mgr.tvConnected) step = 2
        if (mgr.tvConnected && EmbeddedAdb.isPaired(this)) { step = 1; awaitingPhoneSetup = false }
        mgr.events = object : SessionManager.Events {
            override fun onStateChanged() { runOnUiThread { if (!isFinishing && !isDestroyed) {
                if(mgr.tvConnected&&(restoringTv||step==3&&!flowTvConnected)){restoringTv=false;step=1;awaitingPhoneSetup=false;note="";render()}
                advancePhoneSetup(); updateStatus()
            } } }
        }
        render()
        // Draw the local page before starting discovery/service Binder work.
        android.view.Choreographer.getInstance().postFrameCallback {
            root.post {
                if (!isFinishing && !isDestroyed) {
                    startForegroundService(Intent(this, SessionService::class.java))
                    val rememberedIp=selectedIp;val rememberedBrand=selectedBrand
                    if(rememberedIp.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}")))Thread({
                        val tv=TvDiscovery.probeKnown(rememberedIp,rememberedBrand)
                        if(tv!=null)runOnUiThread {
                            if(!isFinishing&&!isDestroyed&&selectedIp==rememberedIp&&selectedBrand==rememberedBrand){
                                found=found.filterNot {it.ip==tv.ip}+tv
                                prefs.edit().putString("tv_name",tv.name).putString("tv_model",tv.model).apply()
                                root.findViewWithTag<TextView>("bridge-device-name")?.text=tv.name
                                root.findViewWithTag<TextView>("bridge-device-name-${tv.ip}")?.text=tv.name
                            }
                        }
                    },"morph-tv-info").start()
                    if(!mgr.tvConnected&&selectedIp.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}"))&&prefs.getBoolean("tv_auto_connect",true)){
                        restoringTv=true;autoScanStarted=true
                        note=tr("جاري الرجوع للتلفزيون المحفوظ… افتح Bridge على التلفزيون.","Reconnecting to your saved TV… Open Bridge on your TV.")
                        mgr.selectTv(selectedIp);updateStatus()
                    }
                    adbDiscovery = PhoneAdbDiscovery.start(this)
                    catalog.load(mgr.appStore) { entries ->
                        if (!isFinishing && !isDestroyed) { apps = entries; appsLoading = false; render() }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        flowHandler.removeCallbacks(flowPoll); flowHandler.post(flowPoll)
        if (::root.isInitialized && (paintedAppearance != MorphHostShell.appearance(this) || paintedLanguage != isArabic.toString())) render()
        if (::mgr.isInitialized) catalog.checkBackend(this) { backend ->
            if (!isFinishing && !isDestroyed && backend != null) mgr.setBackend(backend)
        }
    }

    private val isArabic get() = getSharedPreferences("cleartv", MODE_PRIVATE).getString("language", "ar") == "ar"
    private fun tr(ar: String, en: String) = if (isArabic) ar else en
    private val flowDirection get() = if (isArabic) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
    private fun dp(n: Int) = (n * resources.displayMetrics.density).toInt()
    private fun column() = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
    private fun shape(color: Int = card, stroke: Int = border, radius: Int = 16) = MorphHostShell.surface(this, color, stroke, radius)
    private fun text(value: String, size: Float = PhoneDesignTokens.bodySize.toFloat(), color: Int = ink) = TextView(this).apply {
        text = value; textSize = when { size <= 12f -> PhoneDesignTokens.captionSize.toFloat(); size < 18f -> PhoneDesignTokens.bodySize.toFloat(); size < 20f -> PhoneDesignTokens.sectionSize.toFloat(); else -> PhoneDesignTokens.titleSize.toFloat() }; setTextColor(color); includeFontPadding = false
        typeface = arabicFont
        setPadding(0, dp(5), 0, dp(5)); textDirection = View.TEXT_DIRECTION_FIRST_STRONG
    }
    private fun button(label: String, primary: Boolean = true, action: () -> Unit) = Button(this).apply {
        text = label; isAllCaps = false; textSize = PhoneDesignTokens.labelSize.toFloat(); setTextColor(if (primary) MorphHostShell.onAccent(this@HostActivity) else palette.link)
        typeface = mediumFont; backgroundTintList = null
        background = if (primary) GradientDrawable(GradientDrawable.Orientation.RIGHT_LEFT,
            intArrayOf(purple, palette.accentEnd)).apply { cornerRadius = dp(16).toFloat() }
        else shape()
        stateListAnimator = null
        layoutParams = LinearLayout.LayoutParams(-1, dp(52)).apply { setMargins(0, dp(8), 0, dp(6)) }
        setOnClickListener { if (!busy) action() }
    }
    private fun space(height: Int) = content.addView(View(this), LinearLayout.LayoutParams(1, dp(height)))
    private fun stageIcon(kind: String, color: Int = palette.link, size: Int = 26) = ImageView(this).apply {
        setImageDrawable(BridgeWizardIcon(kind, color))
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        layoutParams = LinearLayout.LayoutParams(dp(size), dp(size))
    }
    private fun heading(eyebrow: String, title: String, description: String) {
        if (step in 1..3) {
            content.addView(LinearLayout(this).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(FrameLayout(this@HostActivity).apply {
                    background = shape(palette.soft, PhoneDesignTokens.borderWarm, 18)
                    addView(stageIcon(if(step==2) "search" else if(step==3) "code" else "apps"), FrameLayout.LayoutParams(dp(27),dp(27),Gravity.CENTER))
                }, LinearLayout.LayoutParams(dp(52),dp(52)).apply { marginEnd=dp(12) })
                addView(column().apply {
                    addView(text(tr("الخطوة ${if(step==2) 1 else if(step==3) 2 else 3} من ٣", "Step ${if(step==2) 1 else if(step==3) 2 else 3} of 3"),12f,palette.link).apply { textSize=12f })
                    addView(text(title,22f).apply { typeface=mediumFont; textSize=22f; setLineSpacing(dp(2).toFloat(),1f) })
                }, LinearLayout.LayoutParams(0,-2,1f))
            })
        } else {
            content.addView(text(eyebrow,12f,palette.link))
            content.addView(text(title,24f).apply { typeface=mediumFont })
        }
        content.addView(text(description,15f,muted).apply { setPadding(0,dp(12),0,dp(14));setLineSpacing(dp(3).toFloat(),1f) })
    }
    private fun wizardProgress(): View = LinearLayout(this).apply {
        val compact = step == 1
        tag="bridge-wizard-progress"; setPadding(0,dp(2),0,dp(12))
        val stages=listOf(2 to tr("التلفزيون","Your TV"),3 to tr("كود الموبايل","Phone code"),1 to tr("التطبيقات","Your apps"))
        val current=stages.indexOfFirst { it.first==step }
        stages.forEachIndexed { index, item ->
            val active=index==current; val complete=index<current
            val color=if(active)palette.link else if(complete)palette.success else muted
            addView(column().apply {
                gravity=Gravity.CENTER;setPadding(dp(3),dp(8),dp(3),0)
                if(!compact) addView(stageIcon(if(complete) "check" else listOf("search","code","apps")[index],color,23))
                addView(text(item.second,12f,color).apply { textSize=12f;gravity=Gravity.CENTER;setPadding(0,if(compact)0 else dp(8),0,if(compact)dp(6) else dp(10));typeface=mediumFont })
                addView(View(this@HostActivity).apply { setBackgroundColor(if(active||complete)color else border) },LinearLayout.LayoutParams(-1,dp(2)))
                contentDescription=tr("${index+1} · ${item.second}","${index+1} · ${item.second}")
                isSelected=active;setOnClickListener { if(!busy){step=item.first;render()} }
            },LinearLayout.LayoutParams(0,-2,1f).apply { marginStart=dp(3);marginEnd=dp(3) })
        }
    }
    private fun selectedTvCard(): View = LinearLayout(this).apply {
        tag="bridge-wizard-device";gravity=Gravity.CENTER_VERTICAL
        val compact=step==1
        background=shape(palette.soft,border,20);setPadding(dp(14),dp(if(compact)4 else 12),dp(12),dp(if(compact)4 else 12))
        layoutParams=LinearLayout.LayoutParams(-1,-2).apply { bottomMargin=dp(12) }
        addView(stageIcon("tv",palette.link,30),LinearLayout.LayoutParams(dp(32),dp(32)).apply { marginEnd=dp(12) })
        addView(column().apply {
            addView(text(deviceName(selectedIp,selectedBrand),17f).apply {tag="bridge-device-name";typeface=mediumFont;maxLines=1;ellipsize=android.text.TextUtils.TruncateAt.END})
            if(!compact)addView(text(selectedIp,12f,muted).apply { textSize=12f;textDirection=View.TEXT_DIRECTION_LTR;setPadding(0,dp(3),0,0) })
        },LinearLayout.LayoutParams(0,-2,1f))
        addView(button(tr("تغيير","Change"),false){step=2;render()}.apply {
            background=android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT)
            textSize=12f;setPadding(dp(6),0,dp(6),0);minimumWidth=0;minWidth=0
            layoutParams=LinearLayout.LayoutParams(dp(55),dp(44))
        })
    }
    private fun instruction(number: String, title: String, detail: String) {
        content.addView(LinearLayout(this).apply {
            gravity=Gravity.TOP;background=shape(palette.soft,border,16)
            setPadding(dp(12),dp(12),dp(12),dp(12))
            addView(text(number,15f,palette.link).apply { gravity=Gravity.CENTER;typeface=mediumFont;background=shape(card,border,10) },LinearLayout.LayoutParams(dp(32),dp(32)).apply {marginEnd=dp(10)})
            addView(column().apply {
                addView(text(title,17f).apply {typeface=mediumFont;setPadding(0,0,0,dp(5))})
                addView(text(detail,14f,muted).apply {setLineSpacing(dp(2).toFloat(),1f);setPadding(0,0,0,0)})
            },LinearLayout.LayoutParams(0,-2,1f))
        },LinearLayout.LayoutParams(-1,-2).apply {bottomMargin=dp(12)})
    }
    private fun credits() = column().apply {
        gravity = Gravity.CENTER; layoutDirection = View.LAYOUT_DIRECTION_LTR
        layoutParams = LinearLayout.LayoutParams(-1, -2)
        addView(text("morph-tv.com", 12f, palette.link).apply {
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(-1, -2)
            contentDescription = tr("موقع Morph Bridge", "Morph Bridge website"); setPadding(dp(16), dp(6), dp(16), 0)
            setOnClickListener { openWebsite() }
        })
        addView(text("Developed by Karim Aboushousha", 11f, muted).apply {
            gravity = Gravity.CENTER; layoutParams = LinearLayout.LayoutParams(-1, -2)
            setPadding(0, 0, 0, dp(3))
        })
    }
    private fun openWebsite() {
        try { startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://morph-tv.com"))) }
        catch (_: android.content.ActivityNotFoundException) { Toast.makeText(this, "morph-tv.com", Toast.LENGTH_LONG).show() }
    }
    private fun footer(label: String, action: () -> Unit) {
        actionButton = button(label, action = action).also { root.addView(it) }
    }
    private fun updateTrialNotice() {
        val paid=mgr.tvPlusState=="active"
        trialNotice?.visibility=if(paid || step in 1..3)View.GONE else View.VISIBLE
        if(paid){trialWelcome?.dismiss();trialWelcome=null;return}
        trialNotice?.text=if(mgr.tvConnected && mgr.tvPlusState=="inactive" && mgr.trialRemainingMs>0) tr("تجربة Bridge مجانية · متبقي ${(mgr.trialRemainingMs+3599999)/3600000} ساعة. بعدها فعّل Plus على التلفزيون لكل المزايا.", "Free Bridge trial · ${(mgr.trialRemainingMs+3599999)/3600000} hours left. Then activate Plus on your TV.") else tr("استمتع بـBridge مجانًا لمدة ٣ أيام. بعدها فعّل Plus على التلفزيون للاستمرار بكل المزايا. لا يلزم شراء Plus منفصل للموبايل.", "Enjoy Bridge free for 3 days. Activate Plus on your TV to continue. No separate phone Plus purchase is needed.")

    }
    private fun updateStatus() {
        if(::mgr.isInitialized)updateTrialNotice()
        if (!::status.isInitialized) return
        status.text = when {
            busy -> note
            mgr.tvConnected && step == 3 && !EmbeddedShellProvider.ready() -> tr("التلفزيون متصل ✓", "TV connected ✓")
            mgr.tvConnected -> tr("متصل بالتلفزيون • ${mgr.appStore.selected(apps).size} تطبيقات", "Connected to TV • ${mgr.appStore.selected(apps).size} apps")
            note.isNotEmpty() -> note
            else -> tr("٣ خطوات، وتطبيقاتك على التلفزيون", "3 steps to your phone apps on TV")
        }
        status.setTextColor(if (mgr.tvConnected && !busy) palette.success else muted)
        status.visibility = if (step == 1 || step >= 4 || !busy && !mgr.tvConnected && note.isEmpty()) View.GONE else View.VISIBLE
        selectionCount?.text = tr("${mgr.appStore.selected(apps).size} تطبيقات مختارة", "${mgr.appStore.selected(apps).size} apps selected")
        actionButton?.isEnabled = !busy && !(step == 3 && TvPhoneSetup.state == "pairing") && (step != 1 || mgr.appStore.selected(apps).isNotEmpty())
        actionButton?.alpha = if (actionButton?.isEnabled == true) 1f else .7f
        runHeading?.text = if (mgr.tvConnected) tr("التلفزيون متصل.", "Your TV is connected.") else tr("جاري الاتصال بتلفزيونك.", "Connecting to your TV.")
        installStatus?.text = note
        installSpinner?.visibility = if (busy) View.VISIBLE else View.GONE
    }
    private fun render() {
        paintedLanguage = isArabic.toString()
        if (isFinishing || isDestroyed) return
        paintedAppearance = MorphHostShell.appearance(this)
        setTheme(if (lightTheme) android.R.style.Theme_Material_Light_NoActionBar else android.R.style.Theme_Material_NoActionBar)
        window.statusBarColor = bg; window.navigationBarColor = bg
        window.decorView.systemUiVisibility = if (lightTheme) View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR else 0
        selectionCount = null; actionButton = null; runHeading = null; installStatus = null; installSpinner = null
        root = column().apply {
            layoutDirection = flowDirection
            background = MorphHostShell.background(this@HostActivity)
            setPadding(dp(16), 0, dp(16), dp(8))
        }
        root.addView(MorphHostShell.header(this, { onBackPressed() }, if (step == 4) null else { { diagnostics() } },{step=2;render()}))
        status = text("", 11f, muted).apply { setPadding(0, dp(2), 0, dp(10)); visibility = if(step >= 4) View.GONE else View.VISIBLE }; root.addView(status)
        trialNotice=text("",12f,muted).apply{background=shape();setPadding(dp(14),dp(10),dp(14),dp(10))};root.addView(trialNotice,LinearLayout.LayoutParams(-1,-2).apply{setMargins(0,0,0,dp(10))})
        val body = column()
        if (step in 1..3) {
            if(step==2) {
                body.addView(text(tr("تطبيقات موبايلك على التلفزيون", "Your phone apps, on TV"),24f).apply {typeface=mediumFont;textSize=24f;setPadding(0,dp(8),0,dp(4))})
                body.addView(text(tr("خطوة واحدة كل مرة، وبعدها اختار تطبيقاتك.", "One step at a time, then choose your apps."),14f,muted).apply {setPadding(0,0,0,dp(18))})
            }
            if(selectedIp.isNotEmpty() && step!=2) body.addView(selectedTvCard())
            body.addView(wizardProgress())
        }
        content=column().apply {
            if(step in 1..3) {
                tag="bridge-wizard-panel";background=shape(card,border,24)
                if(step==1)setPadding(dp(12),dp(12),dp(12),dp(8))
                else setPadding(dp(18),dp(20),dp(18),dp(18))
            }
        }
        if(step==1) {
            body.addView(content,LinearLayout.LayoutParams(-1,0,1f))
            root.addView(body,LinearLayout.LayoutParams(-1,0,1f))
        } else {
            body.addView(content,LinearLayout.LayoutParams(-1,-2))
            root.addView(ScrollView(this).apply {
                layoutParams=LinearLayout.LayoutParams(-1,0,1f);isFillViewport=true
                clipToPadding=false;isVerticalScrollBarEnabled=false;addView(body)
            })
        }
        setContentView(root)
        when (step) { 1 -> appsPage(); 2 -> tvPage(); 3 -> runPage(); 4 -> settingsPage(); else -> installPage() }
        if (mgr.tvConnected) root.addView(button(tr("قطع الاتصال", "Disconnect"), false) {
            awaitingPhoneSetup = false; setupAutoArmed = false
            work(tr("جاري قطع الاتصال…", "Disconnecting…"), after = { step = 2; note = ""; render() }) { mgr.disconnectTv() }
        })
        root.addView(MorphHostShell.navigation(this))
        updateStatus()
        root.post { if (!isFinishing && !isDestroyed) advancePhoneSetup() }
    }

    private fun appsPage() {
        if (!mgr.tvConnected) {
            content.addView(text(tr("اربط التلفزيون الأول", "Connect your TV first"), 23f))
            content.addView(text(tr("بعد الاتصال بالكود، قائمة التطبيقات هتفتح تلقائيًا.", "After code pairing, your app list opens automatically."), 15f, muted))
            footer(tr("متابعة الاتصال", "Continue connection")) { step = if (selectedIp.isNotEmpty()) 3 else 2; render() }
            return
        }
        content.addView(LinearLayout(this).apply {
            gravity=Gravity.CENTER_VERTICAL
            addView(stageIcon("apps",palette.link,24),LinearLayout.LayoutParams(dp(26),dp(26)).apply {marginEnd=dp(10)})
            addView(text(tr("اختار تطبيقاتك","Choose your apps"),20f).apply {typeface=mediumFont;textSize=20f},LinearLayout.LayoutParams(0,-2,1f))
            selectionCount=text("",12f,palette.link).also { it.textSize=12f;addView(it) }
        })
        content.addView(text(tr("اختار تطبيقاتك، وبعدها اضغط التالي.","Choose your apps, then tap Next."),13f,muted).apply {setPadding(0,dp(4),0,dp(10))})
        val search = EditText(this).apply {
            hint = tr("ابحث عن تطبيق", "Search for an app"); setHintTextColor(muted); setTextColor(ink)
            setSingleLine(true); setText(query); textSize = 14f; typeface = arabicFont
            background = shape(); setPadding(dp(16), 0, dp(16), 0)
            layoutParams = LinearLayout.LayoutParams(-1, dp(44)).apply { bottomMargin = dp(8) }
            imeOptions = android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH
        }
        content.addView(search)
        val list = GridView(this).apply {
            numColumns=3;horizontalSpacing=dp(8);verticalSpacing=dp(8);stretchMode=GridView.STRETCH_COLUMN_WIDTH
            cacheColorHint = android.graphics.Color.TRANSPARENT
            isVerticalScrollBarEnabled = true
            clipToPadding=false;setPadding(0,dp(4),0,dp(8))
        }
        content.addView(list, LinearLayout.LayoutParams(-1, 0, 1f))
        val selected = apps.filter { mgr.appStore.isSelected(it.packageName) }.map { it.packageName }.toSet()
        val ordered = apps.sortedByDescending { it.packageName in selected }
        var matching = emptyList<AppStore.Entry>()
        val adapter = object : BaseAdapter() {
            override fun getCount() = matching.size
            override fun getItem(position: Int) = matching[position]
            override fun getItemId(position: Int) = position.toLong()
            override fun getView(position: Int, recycled: View?, parent: ViewGroup): View {
                val entry = matching[position]
                val row = recycled as? FrameLayout ?: FrameLayout(this@HostActivity).apply {
                    layoutParams=AbsListView.LayoutParams(-1,dp(102));setPadding(dp(5),dp(5),dp(5),dp(5))
                    addView(ImageView(this@HostActivity).apply {
                        importantForAccessibility=View.IMPORTANT_FOR_ACCESSIBILITY_NO;scaleType=ImageView.ScaleType.FIT_CENTER
                    },FrameLayout.LayoutParams(dp(36),dp(36),Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {topMargin=dp(13)})
                    addView(text("",12f).apply {gravity=Gravity.CENTER;maxLines=1;ellipsize=android.text.TextUtils.TruncateAt.END;setPadding(dp(3),0,dp(3),0)},FrameLayout.LayoutParams(-1,dp(28),Gravity.BOTTOM).apply {bottomMargin=dp(5)})
                    addView(CheckBox(this@HostActivity).apply {buttonTintList=android.content.res.ColorStateList.valueOf(palette.link);setPadding(0,0,0,0);scaleX=.7f;scaleY=.7f},FrameLayout.LayoutParams(dp(28),dp(28),Gravity.TOP or Gravity.END))
                }
                row.background=shape(card,if(mgr.appStore.isSelected(entry.packageName))palette.link else border,13)
                val image = row.getChildAt(0) as ImageView
                catalog.bind(mgr.appStore, entry, image)
                (row.getChildAt(1) as TextView).text = entry.label
                val check = row.getChildAt(2) as CheckBox
                check.setOnCheckedChangeListener(null)
                check.contentDescription = tr("إضافة ${entry.label} للتلفزيون", "Add ${entry.label} to TV")
                check.isChecked = mgr.appStore.isSelected(entry.packageName)
                check.setOnCheckedChangeListener { _, value ->
                    mgr.appStore.setSelected(entry.packageName, value)
                    row.background=shape(card,if(value)palette.link else border,13)
                    Thread { if (mgr.tvConnected) SessionService.ws?.push(mgr.pushApps()) }.start()
                    updateStatus()
                }
                row.setOnClickListener { check.isChecked = !check.isChecked }
                return row
            }
        }
        list.adapter = adapter
        val empty = text(if (appsLoading) tr("جارٍ تجهيز تطبيقاتك…", "Loading your apps…") else tr("مفيش تطبيق بالاسم ده.", "No apps found with that name."), 14f, muted)
        content.addView(empty); list.emptyView = empty
        fun populate() {
            matching = ordered.filter { query.isBlank() || it.label.contains(query, true) || it.packageName.contains(query, true) }
            adapter.notifyDataSetChanged()
        }
        search.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) { query = s?.toString() ?: ""; populate() }
        })
        populate()
        footer(tr("التالي", "Next")) { step = 3; render() }
    }

    private fun tvPage() {
        // Search when this page is first shown, after its first frame is drawn.
        if (!autoScanStarted) root.post {
            if (!autoScanStarted && !busy && step == 2 && !isFinishing && !isDestroyed) {
                autoScanStarted = true
                scan()
            }
        }
        heading(tr("١ · اختار التلفزيون", "1 · Choose your TV"), tr("ابحث واربط شاشتك", "Find and pair your TV"), tr("خلّي الموبايل والتلفزيون على نفس شبكة الواي فاي.", "Connect your phone and TV to the same Wi-Fi."))
        content.addView(button(tr("تجهيز التلفزيون · خطوات فتح وضع المطوّر", "Prepare TV · Open Developer Mode"), false) { showDeveloperGuide() })
        val nearby = found.toMutableList()
        if (selectedIp.isNotEmpty() && nearby.none { it.ip == selectedIp }) {
            content.addView(deviceRow(selectedIp, selectedBrand))
        }
        for (tv in nearby) content.addView(deviceRow(tv.ip, tv.brand))
        content.addView(button(if (busy) tr("جاري البحث…", "Searching…") else tr("⌕  البحث عن التلفزيونات", "⌕  Find TVs"), false) { scan() })
        if (!advancedTv) {
            content.addView(text(tr("اختار اسم شاشتك هنا، وبعد الربط افتح Bridge من لانشر التلفزيون.", "Choose your TV here, then open Bridge from your TV launcher."), 14f, muted))
            content.addView(button(tr("الاتصال اليدوي عند عدم ظهور التلفزيون", "Manual connection if your TV is missing"), false) { advancedTv=true;render() })
            footer(tr("اتصال بالتلفزيون ←", "Connect to TV →")) { pair(selectedIp, selectedBrand) }
            return
        }
        space(12)
        content.addView(text(tr("نوع التلفزيون", "TV type"), 13f, muted))
        content.addView(LinearLayout(this).apply {
            for ((brand, label) in listOf("samsung" to "Samsung", "lg" to "LG", "android" to "Android TV", "firetv" to "Fire TV")) {
                addView(Button(this@HostActivity).apply {
                    text = label; isAllCaps = false; textSize = 12f; setTextColor(ink)
                    background = shape(if (selectedBrand == brand) palette.soft else card,
                        if (selectedBrand == brand) purple else border)
                    minWidth = 0; minimumWidth = 0; setPadding(0, 0, 0, 0)
                    layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(3), 0, dp(3), 0) }
                    setOnClickListener {
                        if(found.any {it.ip==selectedIp&&it.brand!=brand})selectedIp=""
                        selectedBrand = brand; render()
                    }
                })
            }
        })
        space(8)
        val ip = EditText(this).apply {
            hint = tr("عنوان IP التلفزيون", "TV IP address"); setHintTextColor(muted); setTextColor(ink); textSize = 14f
            setSingleLine(true); setText(selectedIp); layoutDirection = View.LAYOUT_DIRECTION_LTR
            background = shape(); setPadding(dp(15), 0, dp(15), 0)
            layoutParams = LinearLayout.LayoutParams(-1, dp(48))
            inputType = android.text.InputType.TYPE_CLASS_PHONE
        }
        content.addView(ip)
        ip.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) { selectedIp = s?.toString() ?: "" }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })
        space(15)
        content.addView(button(tr("↓  تثبيت أو تحديث Morph Bridge على التلفزيون", "↓  Install or update Morph Bridge on TV"), false) { installBuiltin() })
        if (selectedBrand == "samsung") content.addView(button(tr("＋  رفع ملف WGT من الموبايل", "＋  Upload a WGT file from your phone"), false) { chooseWgt() })
        content.addView(button(tr("أول مرة توصل التلفزيون؟", "Connecting your TV for the first time?"), false) {
            showInfo(tr("تجهيز التلفزيون", "Prepare your TV"), when (selectedBrand) {
                "lg" -> tr("فعّل Developer Mode وKey Server على LG. اضغط تثبيت هنا واكتب Passphrase الموجود على التلفزيون؛ التطبيق هيرفع نسخة LG ويثبّتها ويفتحها.", "Enable Developer Mode and Key Server on LG. Choose Install and enter the Passphrase shown on TV. Bridge uploads, installs and opens the LG receiver.")
                "android" -> tr("فعّل Network/USB debugging على Android TV. اضغط تثبيت ووافق على رسالة اتصال الموبايل في التلفزيون. بعد أول تثبيت تقدر تقفل التصحيح والربط العادي هيكمل بالواي فاي.", "Enable Network/USB debugging on Android TV. Choose Install and approve the phone on TV. After installation, ordinary Wi-Fi connection does not require debugging.")
                else -> tr("فعّل Developer Mode على سامسونج، واكتب IP الموبايل ${mgr.localIp()} في خانة Host PC IP وأعد تشغيل التلفزيون. بعد كده اضغط تثبيت من هنا.", "Enable Samsung Developer Mode, enter your phone IP ${mgr.localIp()} under Host PC IP and restart the TV. Then choose Install here.")
            })
        })
        footer(tr("اتصال بالتلفزيون ←", "Connect to TV →")) { selectedIp = ip.text.toString().trim(); pair(selectedIp, selectedBrand) }
    }

    private fun showDeveloperGuide() {
        showInfo(tr("تجهيز التلفزيون قبل التثبيت", "Prepare your TV before installation"), tr(
            "Samsung / Tizen:\n١. افتح Apps من الشاشة الرئيسية.\n٢. اكتب 12345 بالريموت لفتح Developer Mode.\n٣. فعّل On واكتب IP الموبايل ${mgr.localIp()} في Host PC IP ثم احفظ وأعد تشغيل التلفزيون.\n\nFire TV:\n١. الإعدادات ← My Fire TV ← About.\n٢. اضغط اسم الجهاز ٧ مرات، وارجع خطوة.\n٣. افتح Developer Options وفعّل ADB Debugging. وافق على رسالة السماح عند التثبيت.\n\nAndroid TV / Google TV:\nالإعدادات ← النظام / تفضيلات الجهاز ← حول ← اضغط Android TV OS Build سبع مرات. ارجع إلى خيارات المطوّر وفعّل USB / Network debugging إن كان متاحًا، ووافق على رسالة الاتصال.\n\nLG:\nثبّت Developer Mode من متجر LG، افتحه وسجّل بحساب LG Developer، ثم فعّل Dev Mode وأعد التشغيل، وافتح التطبيق وفعّل Key Server.\n\nبعد التجهيز اضغط البحث واختار التلفزيون. لو Morph Launcher موجود بالفعل افتح Bridge منه؛ مش محتاج تثبيت تاني.",
            "Samsung / Tizen:\n1. Open Apps from Home.\n2. Enter 12345 with the remote to open Developer Mode.\n3. Turn it On, enter phone IP ${mgr.localIp()} under Host PC IP, save and restart the TV.\n\nFire TV:\n1. Settings → My Fire TV → About.\n2. Select the device name seven times, then go back.\n3. Open Developer Options and enable ADB Debugging. Approve the connection request during installation.\n\nAndroid TV / Google TV:\nSettings → System / Device Preferences → About → select Android TV OS Build seven times. Return to Developer options, enable USB / Network debugging if available, and approve the connection.\n\nLG:\nInstall Developer Mode from the LG store, open it and sign in with your LG Developer account. Enable Dev Mode and restart. Reopen it and enable Key Server.\n\nThen search and choose your TV. If Morph Launcher is already installed, open its Bridge; no reinstall is needed."
        ))
    }

    private fun checkedTarget(): String? {
        val ip = selectedIp.trim()
        if (!ip.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}")) || ip.split('.').any { (it.toIntOrNull() ?: 256) !in 0..255 }) {
            showInfo(tr("اختار التلفزيون الأول", "Choose your TV first"), tr("اكتب عنوان IP صحيح للتلفزيون أو اختاره من البحث.", "Enter a valid TV IP address or choose a TV from search.")); return null
        }
        return ip
    }
    private fun installUpdate(value: String) { note = value; runOnUiThread { updateStatus() } }
    private fun beginInstall(title: String, after: (() -> Unit)? = null, action: () -> Unit) {
        installTitle = title; step = 5; note = tr("جاري تجهيز التثبيت…", "Preparing installation…"); render()
        work(note, after, action)
    }
    private fun installPage() {
        heading(tr("من الموبايل للتلفزيون", "From your phone to TV"), installTitle, tr("خلّي الموبايل والتلفزيون متصلين بنفس الشبكة لحد ما التثبيت يخلص.", "Keep your phone and TV on the same network until installation finishes."))
        content.addView(column().apply {
            background = shape(); setPadding(dp(19), dp(23), dp(19), dp(23)); gravity = Gravity.CENTER
            installSpinner = ProgressBar(this@HostActivity).apply {
                indeterminateTintList = android.content.res.ColorStateList.valueOf(purple)
            }.also { addView(it, LinearLayout.LayoutParams(dp(44), dp(44)).apply { bottomMargin = dp(20) }) }
            installStatus = text(note, 15f).apply { gravity = Gravity.CENTER; setLineSpacing(dp(3).toFloat(), 1f) }.also { addView(it) }
        })
        footer(tr("رجوع للتلفزيون", "Back to TV")) { step = 2; render() }
    }
    private fun installBuiltin() {
        if (busy) return
        val ip = checkedTarget() ?: return
        when (selectedBrand) {
            "android", "firetv" -> {
                val port = EditText(this).apply {
                    setText("5555"); inputType = android.text.InputType.TYPE_CLASS_NUMBER; setTextColor(ink)
                    background = shape(); setPadding(dp(14), 0, dp(14), 0); layoutDirection = View.LAYOUT_DIRECTION_LTR
                }
                inputDialog(tr("تثبيت Android TV", "Install on Android TV"), tr("فعّل Network/USB debugging على التلفزيون ووافق على رسالة السماح للموبايل.\n\nالتلفزيون: $ip\nمنفذ ADB:", "Enable Network/USB debugging on TV and approve the phone.\n\nTV: $ip\nADB port:"), port) {
                    val p = port.text.toString().toIntOrNull()
                    if (p == null || p !in 1..65535) { showInfo(tr("المنفذ غير صحيح", "Invalid port"), tr("اكتب رقم منفذ ADB الظاهر على التلفزيون", "Enter the ADB port shown on TV")); return@inputDialog }
                    beginInstall(tr("تثبيت Android TV", "Install on Android TV"), after = { connectAfterInstall(ip, "android") }) {
                        AndroidTvInstaller.install(this, ip, p, ::installUpdate); note = tr("تم تثبيت وفتح Morph Bridge على Android TV", "Morph Bridge installed and opened on Android TV")
                    }
                }
            }
            "lg" -> {
                val pass = EditText(this).apply {
                    hint = "Passphrase"; setHintTextColor(muted); setTextColor(ink); background = shape()
                    setPadding(dp(14), 0, dp(14), 0); setSingleLine(true)
                    inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                }
                inputDialog(tr("تثبيت نسخة LG", "Install LG receiver"), tr("فعّل Developer Mode وKey Server على التلفزيون.\nاكتب Passphrase اللي ظاهر على LG.\n\nالتلفزيون: $ip", "Enable Developer Mode and Key Server on TV.\nEnter the Passphrase shown on LG.\n\nTV: $ip"), pass) {
                    val phrase = pass.text.toString(); pass.text.clear()
                    beginInstall(tr("تثبيت نسخة LG", "Install LG receiver"), after = { connectAfterInstall(ip, "lg") }) {
                        LgTvInstaller.install(this, ip, phrase, ::installUpdate); note = tr("تم تثبيت وفتح Morph Bridge على LG", "Morph Bridge installed and opened on LG")
                    }
                }
            }
            else -> showInfo(tr("تثبيت Morph Bridge", "Install Morph Bridge"), tr("هيتم تثبيت أو تحديث نسخة سامسونج المدمجة على $ip.\n\nفعّل Developer Mode على التلفزيون.", "The bundled Samsung receiver will be installed or updated on $ip.\n\nEnable Developer Mode on TV."), tr("تثبيت وفتح", "Install and open")) {
                beginInstall(tr("تثبيت نسخة سامسونج", "Install Samsung receiver"), after = { connectAfterInstall(ip, "samsung") }) {
                    val file = java.io.File(cacheDir, "morph-builtin.wgt")
                    try {
                        WgtPackage.copyBounded(assets.open(SendToTv.ASSET_PATH), file)
                        SendToTv.installFile(ip, file, WgtPackage.inspect(file), ::installUpdate)
                        SdbClient(ip).use { it.shell("0 execute AppBridge1.TV") }
                        note = tr("تم تثبيت وفتح Morph Bridge على سامسونج", "Morph Bridge installed and opened on Samsung")
                    } finally { file.delete() }
                }
            }
        }
    }
    private fun connectAfterInstall(ip: String, brand: String) {
        pair(ip, brand)
    }
    private fun chooseWgt() {
        if (busy) return
        if (selectedBrand != "samsung") { selectedBrand = "samsung"; step = 2; render(); return }
        wgtTargetIp = checkedTarget() ?: return
        startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            type = "*/*"; addCategory(Intent.CATEGORY_OPENABLE)
        }, 6021)
    }
    @Deprecated("Framework document picker callback")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 6021 || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        val target = wgtTargetIp
        val file = java.io.File(cacheDir, "morph-import-${java.util.UUID.randomUUID()}.wgt")
        var info: WgtPackage? = null
        beginInstall(tr("فحص ملف WGT", "Check WGT file"), after = {
            val p = info ?: return@beginInstall
            val signature = if (p.hasSignatures) tr("ملفات التوقيع موجودة", "Signature files present") else tr("ملفات التوقيع غير موجودة", "Signature files missing")
            showInfo("${p.name} • ${p.version}", tr("سامسونج: $target\nTizen: ${p.minimumTizen}+\n${p.appId}\n\n$signature. قبول التوقيع والتوافق بيحدده التلفزيون.", "Samsung: $target\nTizen: ${p.minimumTizen}+\n${p.appId}\n\n$signature. The TV decides whether the signature and version are accepted."), tr("تثبيت الملف", "Install file")) {
                beginInstall(tr("تثبيت ${p.name}", "Install ${p.name}")) {
                    try { SendToTv.installFile(target, file, p, ::installUpdate); note = tr("تم تثبيت ${p.name} بنجاح على $target", "${p.name} installed successfully on $target") }
                    finally { file.delete() }
                }
            }
        }) {
            val stream = contentResolver.openInputStream(uri) ?: error(tr("تعذر فتح ملف WGT", "Could not open the WGT file"))
            WgtPackage.copyBounded(stream, file)
            try { info = WgtPackage.inspect(file) } catch (e: Exception) { file.delete(); throw e }
            note = tr("ملف WGT جاهز للمراجعة قبل التثبيت", "WGT file ready to review before installation")
        }
    }
    private fun inputDialog(title: String, message: String, input: EditText, confirm: () -> Unit) {
        val dialog = android.app.Dialog(this)
        val panel = column().apply {
            layoutDirection = flowDirection; background = shape(card, border, 24)
            setPadding(dp(22), dp(17), dp(22), dp(18))
            addView(text(title, 21f).apply { typeface = mediumFont })
            addView(text(message, 13f, muted)); addView(input, LinearLayout.LayoutParams(-1, dp(48)))
            addView(button(tr("تثبيت وفتح", "Install and open")) { dialog.dismiss(); confirm() })
            addView(button(tr("إلغاء", "Cancel"), false) { input.text.clear(); dialog.dismiss() })
        }
        dialog.setContentView(panel); dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.show(); dialog.window?.setLayout(resources.displayMetrics.widthPixels - dp(40), -2)
    }

    private fun deviceName(ip: String, brand: String): String = found.firstOrNull { it.ip==ip && it.brand==brand }?.name?.takeIf { it.isNotBlank() }
        ?: (if(prefs.getString("tv_ip","")==ip && prefs.getString("tv_brand","")==brand) prefs.getString("tv_name","")?.takeIf { it.isNotBlank() } else null)
        ?: when(brand){"lg"->"LG webOS";"firetv"->"Fire TV";"android"->"Android TV / Google TV";else->"Samsung TV"}

    private fun deviceRow(ip: String, brand: String) = LinearLayout(this).apply {
        gravity=Gravity.CENTER_VERTICAL
        background=shape(palette.soft,if(ip==selectedIp)purple else border,18)
        setPadding(dp(14),dp(14),dp(12),dp(14))
        layoutParams=LinearLayout.LayoutParams(-1,-2).apply {bottomMargin=dp(10)}
        addView(stageIcon("tv",palette.link,29),LinearLayout.LayoutParams(dp(32),dp(32)).apply {marginEnd=dp(12)})
        addView(column().apply {
            addView(text(deviceName(ip,brand),17f).apply {tag="bridge-device-name-$ip";typeface=mediumFont;maxLines=2;ellipsize=android.text.TextUtils.TruncateAt.END})
            val model=found.firstOrNull {it.ip==ip&&it.brand==brand}?.model?:if(prefs.getString("tv_ip","")==ip)prefs.getString("tv_model","").orEmpty() else ""
            addView(text(listOf(when(brand){"lg"->"LG webOS";"firetv"->"Fire TV";"android"->"Android TV / Google TV";else->"Samsung Tizen"},model).filter {it.isNotBlank()}.joinToString(" · "),12f,muted).apply {textSize=12f})
            addView(text(ip,12f,muted).apply {textSize=12f;textDirection=View.TEXT_DIRECTION_LTR;gravity=if(isArabic)Gravity.RIGHT else Gravity.LEFT})
            addView(text(if(ip==selectedIp)tr("التلفزيون المختار","Selected TV") else tr("اضغط للاتصال","Tap to connect"),12f,palette.link).apply {textSize=12f})
        },LinearLayout.LayoutParams(0,-2,1f))
        if(ip==selectedIp)addView(stageIcon("check",palette.link,22),LinearLayout.LayoutParams(dp(24),dp(24)).apply {marginStart=dp(12)})
        setOnClickListener { if(busy){pendingTvPick=ip to brand;note=tr("تم اختيار التلفزيون، جاري الاتصال…","TV selected, connecting…");updateStatus()}else pair(ip,brand) }
    }

    private fun scan() = work(tr("جاري البحث عن التلفزيونات…", "Searching for TVs…"), after = {
        val picked = pendingTvPick; pendingTvPick = null
        if (picked != null) pair(picked.first, picked.second)
        val candidate = if (picked == null) TvDiscovery.chooseCandidate(found, selectedIp) else null
        if (candidate != null) {
            selectedIp = candidate.ip
            selectedBrand = candidate.brand
            render()
        }
    }) {
        val wm = applicationContext.getSystemService(android.net.wifi.WifiManager::class.java)
        val lock = wm.createMulticastLock("appbridge-scan")
        try { lock.acquire(); found = TvDiscovery.scan(localIp = mgr.localIp()); note = if (found.isEmpty()) tr("مفيش تلفزيون رد؛ تقدر تكتب IP يدويًا.", "No TVs responded. You can enter an IP address manually.") else tr("اختار التلفزيون من القائمة", "Choose your TV from the list") }
        finally { if (lock.isHeld) lock.release() }
    }

    private fun pair(ip: String, brand: String) {
        if (!ip.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}"))) { note = tr("اكتب IP صحيح للتلفزيون", "Enter a valid TV IP address"); updateStatus(); return }
        if (ip.split('.').any { (it.toIntOrNull() ?: 256) !in 0..255 }) { note = tr("اكتب IP صحيح للتلفزيون", "Enter a valid TV IP address"); updateStatus(); return }
        awaitingPhoneSetup = true; setupAutoArmed = false
        selectedIp = ip; selectedBrand = brand
        val name=deviceName(ip,brand)
        val model=found.firstOrNull {it.ip==ip&&it.brand==brand}?.model.orEmpty()
        prefs.edit().putString("tv_ip", ip).putString("tv_brand", brand).putString("tv_name",name).putString("tv_model",model).putBoolean("tv_auto_connect",true).apply()
        // LAN pairing and app selection need no shell/ADB privileges. Prepare
        // the independent app runtime only when the user starts an app.
        work(tr("جاري الربط بالتلفزيون…", "Connecting to TV…")) {
            mgr.selectTv(ip)
            note = tr("جاري الاتصال تلقائيًا… سيب Morph Bridge مفتوح على التلفزيون.", "Connecting automatically… Leave Morph Bridge open on TV.")
            step = 3
        }
    }

    private fun ensureRuntime(ready: () -> Unit) {
        val shell = ShizukuBackend(this)
        fun prepare() = work(tr("جاري تجهيز تشغيل التطبيقات…", "Preparing app playback…"), after = ready) {
            mgr.setBackend(shell)
            check(mgr.startIndependent()) { mgr.lastError ?: tr("تعذر تجهيز الشاشة المستقلة", "Could not prepare the independent display") }
            note = tr("جاهز لتشغيل التطبيقات", "Ready to run apps")
        }
        if (EmbeddedShellProvider.ready() || android.os.Build.VERSION.SDK_INT < 30 && shell.isAvailable()) prepare()
        else if (EmbeddedAdb.isPaired(this)) {
            work(tr("جاري الاتصال بالمساعد الداخلي…", "Connecting to the built-in helper…"), after = { ensureRuntime(ready) }) {
                val saved = getSharedPreferences("embedded_adb", MODE_PRIVATE).getInt("port", 0)
                EmbeddedAdb.start(this, EmbeddedAdb.connectionPort.takeIf { it > 0 } ?: saved)
            }
        }
        else {
            note = tr("جهّز الموبايل أول مرة، وبعدها ارجع واضغط اتصال", "Prepare your phone, then return and choose Connect"); updateStatus()
            startActivity(Intent(this, PhoneSetupActivity::class.java))
        }
    }

    private fun advancePhoneSetup() {
        if (!::mgr.isInitialized || busy || !mgr.tvConnected) return
        if (step != 3 && !(awaitingPhoneSetup && step in 1..3)) return
        if (awaitingPhoneSetup && (EmbeddedShellProvider.ready() || EmbeddedAdb.isPaired(this))) {
            awaitingPhoneSetup = false; step = 1; note = ""
            if (EmbeddedShellProvider.ready()) mgr.setBackend(ShizukuBackend(this))
            else TvPhoneSetup.resume(this)
            render(); return
        }
        if (!EmbeddedShellProvider.ready() && EmbeddedAdb.isPaired(this) && TvPhoneSetup.state in listOf("idle", "paired")) {
            awaitingPhoneSetup = true; TvPhoneSetup.resume(this)
        } else if (!EmbeddedShellProvider.ready() && mgr.tvPhoneSetupSupported && !setupAutoArmed && TvPhoneSetup.state == "idle") {
            setupAutoArmed = true; TvPhoneSetup.arm(this)
        }
    }
    private fun simplePhoneSetupPage() {
        awaitingPhoneSetup = true
        if (!mgr.tvConnected) {
            heading(tr("٢ · افتح Bridge", "2 · Open Bridge"), tr("افتح Bridge على التلفزيون", "Open Bridge on your TV"), tr("افتحه من اللانشر وسيبه ظاهر. أول ما يتصل هنكمل تلقائيًا.", "Open it from your TV launcher and leave it visible. We continue automatically when it connects."))
            content.addView(ProgressBar(this).apply { isIndeterminate=true }, LinearLayout.LayoutParams(dp(42),dp(42)).apply { gravity=Gravity.CENTER_HORIZONTAL;setMargins(0,dp(20),0,dp(16)) })
            content.addView(text(tr("في انتظار ردّ التلفزيون… بمجرد الاتصال هتظهر تطبيقاتك هنا تلقائيًا.", "Waiting for your TV… Your apps appear here automatically once connected."),16f,palette.link))
            content.addView(button(tr("رجوع للبحث", "Back to search"), false) { step = 2; render() })
            return
        }
        if (!mgr.tvPhoneSetupSupported) {
            heading(tr("٢ · تجهيز الموبايل", "2 · Phone setup"), tr("التلفزيون متصل ✓", "TV connected ✓"), tr("نسخة Bridge على التلفزيون محتاجة تحديث علشان تكتب الكود بالريموت.", "Update Bridge on your TV to enter the phone code with your remote."))
            content.addView(button(tr("طريقة بديلة للتلفزيون القديم", "Alternative for an older TV"), false) { startActivity(Intent(this, PhoneSetupActivity::class.java).putExtra("setupStage", 3).putExtra("notificationGuide", true)) })
            return
        }
        heading(tr("٢ · كود الموبايل", "2 · Phone code"), tr("اربط الموبايل بالكود", "Pair your phone"), tr("تجهيز بسيط أول مرة، من غير تطبيقات إضافية.", "A simple first-time setup. No extra apps needed."))
        instruction("1",tr("على الموبايل", "On your phone"),tr("التصحيح اللاسلكي ← إقران الجهاز باستخدام رمز. سيب نافذة الأرقام مفتوحة.", "Wireless debugging → Pair device with pairing code. Keep the code dialog open."))
        instruction("2",tr("على التلفزيون", "On your TV"),tr("اكتب نفس الـ٦ أرقام في Bridge واضغط اتصال. بعدها ارجع للموبايل؛ تطبيقاتك هتظهر تلقائيًا.", "Enter the same 6 digits in Bridge and choose Connect. Return to your phone; your apps open automatically."))
        val pairing = TvPhoneSetup.state == "pairing"
        if (pairing) content.addView(text(tr("بنكمل الاتصال تلقائيًا…", "Finishing the connection automatically…"), 17f, palette.link))
        if (TvPhoneSetup.state == "start_failed") content.addView(text(tr("الكود اتقبل، لكن الاتصال ما كملش. افتح التصحيح اللاسلكي من الزر تحت وسيبه شغّال.", "The code was accepted, but connection did not finish. Open Wireless debugging below and leave it enabled."), 15f, palette.danger))
        footer(tr("فتح خيارات المطوّر", "Open Developer options")) {
            if (EmbeddedAdb.isPaired(this)) TvPhoneSetup.resume(this) else TvPhoneSetup.arm(this)
            try { startActivity(Intent(android.provider.Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)) }
            catch (_: Exception) { startActivity(Intent(android.provider.Settings.ACTION_SETTINGS)) }
        }
        actionButton?.isEnabled = !pairing
        content.addView(button(tr("مش لاقي خيارات المطوّر؟", "Cannot find Developer options?"), false) { startActivity(Intent(this, PhoneSetupActivity::class.java).putExtra("setupStage", 1).putExtra("returnToAppsOnReady", true)) })
    }
    private fun runPage() {
        if (!mgr.tvConnected || !EmbeddedShellProvider.ready()) { simplePhoneSetupPage(); return }

        content.addView(text(tr("على التلفزيون", "On your TV"), 12f, palette.link))
        runHeading = text("", 29f).apply { typeface = mediumFont }.also { content.addView(it) }
        content.addView(text(tr("اختار تطبيق بالريموت، واستخدم موبايلك عادي.", "Choose an app with the remote and keep using your phone normally."), 15f, muted))
        space(12)
        content.addView(column().apply {
            background = shape(palette.soft, border, 21)
            setPadding(dp(14), dp(12), dp(14), dp(12))
            addView(text("▣  ${when (selectedBrand) { "lg" -> "LG webOS"; "android" -> "Android TV"; else -> "Samsung TV" }}", 18f))
            addView(text(tr("تطبيقاتك المختارة", "Your selected apps"), 12f, muted))
            for (row in mgr.appStore.selected(apps).chunked(4)) {
                addView(LinearLayout(this@HostActivity).apply {
                    gravity = Gravity.CENTER
                    for (entry in row) addView(column().apply {
                        gravity = Gravity.CENTER
                        addView(ImageView(this@HostActivity).apply {
                            catalog.bind(mgr.appStore, entry, this)
                        }, LinearLayout.LayoutParams(dp(43), dp(43)))
                        addView(text(entry.label, 10f).apply { maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END; gravity = Gravity.CENTER })
                        setPadding(dp(5), dp(10), dp(5), dp(3))
                        setOnClickListener { launchEntry(entry) }
                        contentDescription = tr("فتح ${entry.label} على التلفزيون", "Open ${entry.label} on TV")
                    }, LinearLayout.LayoutParams(0, -2, 1f))
                })
            }
        })
        space(14)
        val running = apps.find { it.packageName == mgr.runningPackage }
        content.addView(text(if (running != null) tr("${running.label} • شغّال على التلفزيون", "${running.label} • running on TV") else tr("اللانشر جاهز لاختيار تطبيق", "The launcher is ready. Choose an app."), 15f))
        content.addView(text(tr("سيب الموبايل متصل بالواي فاي، وكمّل استخدامه براحتك.", "Keep your phone on Wi-Fi and continue using it normally."), 13f, muted))
        content.addView(button(tr("دليل استخدام الريموت", "Remote control guide"), false) {
            showInfo(tr("التحكم من الريموت", "Remote controls"), tr("الأسهم: تحريك المؤشر\nضغطة قصيرة: حركة دقيقة\nOK: ضغط\nBack: رجوع\nBack مرتين بسرعة: اللانشر\nأزرار القنوات أو Page Up/Down: تمرير\nالأخضر: تمرير لأسفل\nالأصفر: التبديل بين الماوس والأسهم", "Arrows: move pointer\nShort press: precise movement\nOK: click\nBack: go back\nBack twice quickly: launcher\nChannel or Page Up/Down: scroll\nGreen: scroll down\nYellow: switch pointer/arrow mode"))
        })
        content.addView(button(if (mgr.runningPackage != null) tr("إيقاف التطبيق والعودة للانشر", "Stop app and return to launcher") else tr("تحديث التطبيقات على التلفزيون", "Refresh TV apps"), false) {
            work(tr("جاري تحديث التلفزيون…", "Refreshing TV…")) {
                if (mgr.runningPackage != null) mgr.stopApp()
                check(SessionService.ws?.push(mgr.pushApps()) == true) { tr("التلفزيون لسه مش متصل", "TV is not connected yet") }
                note = tr("اللانشر جاهز على التلفزيون", "Launcher ready on TV")
            }
        })
        footer(if (mgr.tvConnected) tr("＋  تعديل التطبيقات", "＋  Edit selected apps") else tr("رجوع للاتصال بالتلفزيون", "Back to TV connection")) {
            step = if (mgr.tvConnected) 1 else 2; render()
        }
    }

    private fun launchEntry(entry: AppStore.Entry) {
        if (busy) return
        if (!mgr.tvConnected) { note = tr("وصّل التلفزيون الأول", "Connect your TV first"); step = 2; render(); return }
        ensureRuntime { work(tr("جاري فتح ${entry.label}…", "Opening ${entry.label}…")) {
            val r = mgr.launchLocal(entry.packageName, entry.activityClass)
            check(r.code == 0 && mgr.lastError == null) { mgr.lastError ?: r.err }
            note = tr("${entry.label} شغّال على التلفزيون", "${entry.label} is running on TV")
        } }
    }

    private fun work(message: String, after: (() -> Unit)? = null, action: () -> Unit) {
        if (busy) return
        busy = true; note = message; updateStatus()
        Thread {
            var ok = false
            try { action(); ok = true } catch (t: Throwable) { val detail = t.message ?: tr("حصل خطأ في الاتصال", "Connection error"); note = if (!isArabic && detail.any { it in '\u0600'..'\u06ff' }) "This step did not finish. Check the TV connection and try again." else detail }
            runOnUiThread { busy = false; if (!isFinishing && !isDestroyed) { render(); if (ok) after?.invoke() } }
        }.start()
    }

    private fun diagnostics() {
        if (busy) return
        if (step != 4) lastMainStep = step
        step = 4; render()
    }
    private fun settingRow(title: String, subtitle: String, symbol: String, danger: Boolean = false, action: () -> Unit) = LinearLayout(this).apply {
        gravity = Gravity.CENTER_VERTICAL; setPadding(dp(14), dp(12), dp(14), dp(12))
        background = shape(); layoutParams = LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(9) }
        addView(text(symbol, 21f, if (danger) palette.danger else palette.link).apply {
            gravity = Gravity.CENTER; background = shape(if (danger) palette.dangerSoft else palette.soft, card, 12)
            layoutParams = LinearLayout.LayoutParams(dp(43), dp(43))
        })
        addView(column().apply {
            setPadding(dp(12), 0, dp(12), 0)
            addView(text(title, 15f, if (danger) palette.danger else ink).apply { typeface = mediumFont; setPadding(0, 0, 0, 0) })
            addView(text(subtitle, 11f, muted).apply { setPadding(0, dp(2), 0, 0) })
        }, LinearLayout.LayoutParams(0, -2, 1f))
        addView(text("‹", 25f, muted))
        isClickable = true; isFocusable = true; contentDescription = "$title. $subtitle"
        setOnClickListener { if (!busy) action() }
    }
    private fun settingsPage() {
        heading("Bridge", tr("إعدادات الاتصال والتشغيل", "Connection and playback settings"), tr("إعدادات المظهر واللغة تتبع تطبيق Morph TV.", "Appearance and language follow the Morph TV phone app."))
        content.addView(text(tr("العرض على التلفزيون", "TV display"), 12f, palette.link))
        content.addView(column().apply {
            background = shape(); setPadding(dp(15), dp(9), dp(15), dp(13))
            addView(Switch(this@HostActivity).apply {
                text = tr("التطبيقات على التلفزيون فقط", "Apps on TV only"); contentDescription = text
                typeface = mediumFont; textSize = 14f; setTextColor(ink); minimumHeight = dp(44)
                isChecked = mgr.keepAppsOnTv
                thumbTintList = android.content.res.ColorStateList.valueOf(purple)
                trackTintList = android.content.res.ColorStateList.valueOf(palette.soft)
                setOnCheckedChangeListener { _, enabled -> if (!busy) work(tr("تحديث إعداد الشاشة المستقلة…", "Updating independent display settings…")) { mgr.keepAppsOnTv = enabled; note = tr("تم حفظ إعداد العرض", "Display setting saved") } }
            }, LinearLayout.LayoutParams(-1, -2))
            addView(text(tr("يفتح التطبيق على الشاشة المستقلة ويخفي جلسة التلفزيون من التطبيقات الأخيرة على الموبايل. المعالجة بتفضل على الموبايل، وتقدر تستخدمه عادي. يُطبّق عند فتح التطبيق من التلفزيون من جديد.", "Opens apps on the independent display and hides the TV session from phone Recents. Processing remains on your phone, which you can keep using. Applies the next time an app opens from TV."), 11f, muted))
        })
        space(10)
        content.addView(text(tr("الاتصال والتشغيل", "Connection and playback"), 12f, palette.link))
        content.addView(settingRow(tr("تجهيز الموبايل", "Phone setup"), tr("المساعد المدمج • من غير تطبيق منفصل", "Built-in helper • no separate app"), "✓") {
            startActivity(Intent(this, PhoneSetupActivity::class.java))
        })
        content.addView(settingRow(tr("تفاصيل الاتصال", "Connection details"), if (mgr.tvConnected) tr("التلفزيون متصل وجاهز", "TV connected and ready") else tr("حالة الربط وبيانات الشبكة", "Connection status and network details"), "⌁") {
            showInfo(tr("تفاصيل الاتصال", "Connection details"), "${mgr.statusDetail()}\n${mgr.lastError ?: ""}\n\n${tr("ربط يدوي:", "Manual connection:")}\nPhone IP: ${mgr.localIp()}\nCode: ${mgr.pairingCode ?: tr("اضغط اتصال أولًا", "Choose Connect first")}\n\n${tr("لو المساعد وقف بعد إعادة تشغيل الموبايل، افتح تجهيز الموبايل وشغّله تاني.", "If the helper stops after restarting your phone, open Phone setup and start it again.")}")
        })
        content.addView(settingRow(tr("اختبار الصورة والصوت", "Test picture and sound"), tr("نغمة قصيرة تتسمع من التلفزيون فقط", "A short tone plays on TV only"), "♫") {
            if (!mgr.tvConnected) showInfo(tr("وصّل التلفزيون الأول", "Connect your TV first"), tr("ارجع لخطوة التلفزيون واضغط اتصال، وبعدها جرّب الاختبار.", "Return to the TV step and choose Connect, then try the test."))
            else work(tr("اختبار صوت التلفزيون…", "Testing TV sound…")) { mgr.testOutput(); note = tr("لازم تسمع نغمة الاختبار من التلفزيون فقط", "You should hear the test tone from TV only") }
        })
        space(7); content.addView(text(tr("الحماية", "Protection"), 12f, palette.link))
        content.addView(column().apply {
            background = shape(); setPadding(dp(15), dp(9), dp(15), dp(13))
            addView(Switch(this@HostActivity).apply {
                text = tr("منع الصفحات الخارجية", "Block external pages"); typeface = mediumFont; textSize = 14f; setTextColor(ink)
                setPadding(0, dp(5), 0, dp(5)); minimumHeight = dp(44)
                isChecked = mgr.blockExternalPages
                thumbTintList = android.content.res.ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(palette.accent, muted))
                trackTintList = android.content.res.ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(palette.soft, border))
                setOnCheckedChangeListener { _, enabled -> Thread { mgr.blockExternalPages = enabled }.start() }
            }, LinearLayout.LayoutParams(-1, -2))
            addView(text(tr("يقفل صفحات المتصفح المنبثقة على التلفزيون. عطّله مؤقتًا لو التطبيق محتاج تسجيل دخول من المتصفح.", "Blocks browser pop-ups on TV. Disable temporarily if an app needs browser sign-in."), 11f, muted))
        })
        space(14); content.addView(text(tr("التطبيق", "Application"), 12f, palette.link))
        content.addView(settingRow("morph-tv.com", tr("زور موقع Morph Bridge", "Visit Morph Bridge website"), "↗") { openWebsite() })
        content.addView(settingRow(tr("حول Morph Bridge", "About Morph Bridge"), tr("الإصدار ${packageManager.getPackageInfo(packageName,0).versionName}", "Version ${packageManager.getPackageInfo(packageName,0).versionName}"), "ⓘ") {
            showInfo("Morph Bridge", "Developed by Karim Aboushousha\n\nmorph-tv.com\n\n" + tr("الإصدار", "Version") + " 0.6.2")
        })
        content.addView(settingRow(tr("تثبيت تطبيق التلفزيون", "Install TV receiver"), tr("تثبيت أو تحديث النسخة من موبايلك", "Install or update from your phone"), "↓") { step = 2; render() })
        content.addView(settingRow(tr("رفع ملف WGT لسامسونج", "Upload a Samsung WGT file"), tr("اختار حزمة من الموبايل وثبّتها على التلفزيون", "Choose a package on your phone and install it on TV"), "＋") { chooseWgt() })
        content.addView(settingRow(tr("إيقاف البث", "Stop streaming"), tr("إنهاء تشغيل التطبيقات على التلفزيون", "Stop running apps on TV"), "■", true) {
            work(tr("جاري الإيقاف…", "Stopping…")) { mgr.stopApp(); mgr.stopStream(); note = tr("تم إيقاف البث", "Streaming stopped") }
        })
        footer(tr("رجوع للتطبيق", "Back to app")) { step = lastMainStep; render() }
    }
    private fun showInfo(title: String, message: String, confirmLabel: String = tr("تمام", "OK"), action: (() -> Unit)? = null) {
        val dialog = android.app.Dialog(this)
        val panel = column().apply {
            layoutDirection = flowDirection; background = shape(card, border, 24)
            setPadding(dp(22), dp(17), dp(22), dp(18))
            addView(text(title, 22f).apply { typeface = mediumFont })
            addView(ScrollView(this@HostActivity).apply {
                setBackgroundColor(android.graphics.Color.TRANSPARENT); defaultFocusHighlightEnabled = false
                isVerticalScrollBarEnabled = false
                addView(text(message, 14f, muted).apply { setLineSpacing(dp(4).toFloat(), 1f) })
            }, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(15) })
            addView(button(confirmLabel) { dialog.dismiss(); action?.invoke() })
            if (action != null) addView(button(tr("إلغاء", "Cancel"), false) { dialog.dismiss() })
        }
        dialog.setContentView(panel); dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.window?.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        dialog.window?.setDimAmount(.7f)
        dialog.window?.setLayout(resources.displayMetrics.widthPixels - dp(40), -2)
        dialog.show()
        dialog.window?.setLayout(resources.displayMetrics.widthPixels - dp(40), -2)
    }
    @Deprecated("Framework back callback for the target SDK")
    override fun onBackPressed() {
        when(step) {
            4 -> { step = lastMainStep; render() }
            5 -> { step = 2; render() }
            3 -> { step = 2; render() }
            2 -> finish()
            else -> finish()
        }
    }
    override fun onSaveInstanceState(outState: Bundle) {
        outState.putBoolean("setupAutoArmed", setupAutoArmed)
        outState.putBoolean("awaitingPhoneSetup", awaitingPhoneSetup)
        outState.putInt("step", step); outState.putString("query", query); super.onSaveInstanceState(outState)
        outState.putString("selectedIp", selectedIp); outState.putString("selectedBrand", selectedBrand)
        outState.putString("wgtTargetIp", wgtTargetIp)
        outState.putInt("lastMainStep", lastMainStep)
    }
    override fun onPause() { flowHandler.removeCallbacks(flowPoll); super.onPause() }
    override fun onDestroy() { flowHandler.removeCallbacks(flowPoll); adbDiscovery?.close(); catalog.close(); if (::mgr.isInitialized) { mgr.events = null; if(isFinishing&&!mgr.tvConnected&&mgr.runningPackage==null)stopService(Intent(this,SessionService::class.java)) }; super.onDestroy() }
}
