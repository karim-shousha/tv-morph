import java.security.MessageDigest

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

val verifyBridgeRuntimeAssets by tasks.registering {
    val runtime = file("src/main/assets/scrcpy-server-v5.0.1")
    inputs.file(runtime)
    doLast {
        check(runtime.isFile) { "Missing Bridge independent-display runtime asset" }
        val digest = MessageDigest.getInstance("SHA-256").digest(runtime.readBytes())
            .joinToString("") { "%02x".format(it.toInt() and 0xff) }
        check(digest == "764eb6f79811d5211fe9df341120882ba9994c7a61b897d7bf3fb662e53bc536") {
            "Unexpected Bridge independent-display runtime asset"
        }
    }
}
tasks.named("preBuild").configure { dependsOn(verifyBridgeRuntimeAssets) }

android {
    namespace = "tv.appbridge.phase0"
    compileSdk = 34
    defaultConfig { minSdk = 29 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("dev.rikka.shizuku:api:13.1.5")
    implementation("dev.rikka.shizuku:provider:13.1.5")
    // The Morph TV host already packages this exact JSch API for TV installation.
    compileOnly(files("../build/jsch-android.jar"))
    implementation("com.github.MuntashirAkon:libadb-android:3.1.1")
    implementation("org.conscrypt:conscrypt-android:2.5.3")
    testImplementation("junit:junit:4.13.2")
}
