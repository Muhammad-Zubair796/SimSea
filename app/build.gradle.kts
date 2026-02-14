plugins {
    // These plugins are essential for a Kotlin/Android app
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)

    // Keeping these lines from your original file:
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.example.sealhorse"
    compileSdk = 36 // Recommended latest stable API level

    defaultConfig {
        applicationId = "com.example.sealhorse"
        minSdk = 24 // Supports Android 7.0 and above (88%+ of devices)
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    // Ensure compatibility with modern Kotlin
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }

    // Keeping this block as you had it, even though we're focusing on views
    buildFeatures {
        compose = true
    }
}

dependencies {
    // --- ESSENTIAL DEPENDENCIES FOR VIEW-BASED APPS ---
    // 1. Appcompat: REQUIRED for AppCompatActivity and the entire view system.
    implementation("androidx.appcompat:appcompat:1.7.1")
    // 2. Core KTX: Provides necessary Kotlin extensions (like 'by viewModels()', 'lifecycleScope', etc.)
    implementation("androidx.core:core-ktx:1.17.0")
    // 3. ConstraintLayout: REQUIRED because your activity_main.xml uses it.
    implementation("androidx.constraintlayout:constraintlayout:2.2.1")

    // --- Original Dependencies (Keeping them for completeness) ---
    implementation(libs.androidx.core.ktx) // Duplicates line 2, but often pre-generated
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation("com.airbnb.android:lottie:6.4.0")

    // --- Testing Dependencies ---
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}