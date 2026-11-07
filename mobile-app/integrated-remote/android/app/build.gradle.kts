import java.util.Properties
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}
val hostVersion = Properties().apply { file("../host-version.properties").inputStream().use { load(it) } }
android {
    namespace = "local.cleartv.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = JavaVersion.VERSION_17.toString() }
    defaultConfig {
        applicationId = "local.cleartv.mobile"
        minSdk = 26
        targetSdk = 30
        versionCode = hostVersion.getProperty("code").toInt()
        versionName = hostVersion.getProperty("name")
    }
    sourceSets.getByName("main") {
        java.srcDirs("../../../src", "../../../../android-tv/src")
        assets.srcDirs("../../../build/assets")
        res.srcDirs("../../../res")
    }
    buildTypes.getByName("release") { isMinifyEnabled = false; isShrinkResources = false }
    // Preserve the host LAN/player compatibility target for this local preview.
    lint { disable += "ExpiredTargetSdkVersion" }
    packaging { jniLibs { useLegacyPackaging = true } }
}
dependencies {
    implementation(project(":morph-bridge"))
    implementation(files("../../../../android-tv/libs/wireguard/tunnel-1.0.20260102.aar"))
    implementation(files("../../../build/jsch-android.jar", "../../../../.tools/qr/core-3.5.3.jar"))
    implementation("androidx.media3:media3-exoplayer:1.9.3")
    implementation("androidx.media3:media3-exoplayer-hls:1.9.3")
    implementation("androidx.media3:media3-exoplayer-dash:1.9.3")
    implementation("androidx.media3:media3-ui:1.9.3")
}
flutter { source = "../.." }
