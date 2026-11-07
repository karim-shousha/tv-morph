plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
    namespace = "com.morphtv.bridge.receiver"
    compileSdk = 34
    buildFeatures { buildConfig = true }
    defaultConfig { applicationId = "com.morphtv.bridge.receiver"; minSdk = 26; targetSdk = 34; versionCode = 352; versionName = "1.1.325" }
    buildTypes { getByName("release") { signingConfig = signingConfigs.getByName("debug"); isMinifyEnabled = false; isDebuggable = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
