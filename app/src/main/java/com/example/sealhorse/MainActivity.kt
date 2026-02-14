package com.example.sealhorse

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.os.Handler // <--- REQUIRED for delay logic
import android.os.Looper // <--- REQUIRED for delay logic
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    // --- DECLARE NEW VIEWS ---
    private lateinit var webView: WebView
    private lateinit var splashScreenLayout: LinearLayout

    // --- STATE TRACKING FOR MINIMUM TIME LOGIC ---
    private var isWebViewLoaded = false // Tracks when WebView finishes loading
    private var isMinTimePassed = false // Tracks when the 5-second minimum is over
    private val MIN_SPLASH_TIME = 5000L // 5 seconds minimum display time
    private val handler = Handler(Looper.getMainLooper()) // Handler for the timer

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        splashScreenLayout = findViewById(R.id.splashScreenLayout)

        // 1. Configure Full Screen (Hides status bars and navigation bar)
        hideSystemUI()

        // 2. Configure WebView settings (Omitted for brevity, but yours are correct)
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        webSettings.cacheMode = WebSettings.LOAD_NO_CACHE
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH)

        // --- START THE MINIMUM 5-SECOND TIMER HERE ---
        handler.postDelayed({
            isMinTimePassed = true
            hideSplashScreenIfReady() // Check if the WebView is also ready
        }, MIN_SPLASH_TIME)

        // 3. SET THE WEBVIEW CLIENT AND CHECK LOADING STATE
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                isWebViewLoaded = true // WebView is loaded
                hideSplashScreenIfReady() // Check if minimum time has also passed
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                // If the load errors, we should still proceed to hide the splash after the minimum time
                super.onReceivedError(view, request, error)
                isWebViewLoaded = true // Treat load failure as 'finished' for hiding purposes
                hideSplashScreenIfReady()
            }
        }

        // 4. Load the local HTML game file from the assets folder
        webView.loadUrl("file:///android_asset/index.html")

        // 5. Disable scrollbars
        webView.scrollBarStyle = WebView.SCROLLBARS_OUTSIDE_OVERLAY
        webView.isScrollbarFadingEnabled = false
    }

    /**
     * Checks if both conditions (Web Content Loaded AND Minimum Time Passed) are met.
     */
    private fun hideSplashScreenIfReady() {
        if (isWebViewLoaded && isMinTimePassed) {
            // Hide the splash screen with a short visual delay (300ms)
            splashScreenLayout.postDelayed({
                splashScreenLayout.visibility = View.GONE
            }, 300)
        }
    }


    /**
     * Handles the physical or virtual Back button press.
     */
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Exit the application
            super.onBackPressed()
        }
    }


    /**
     * Function to hide status bar and navigation bar (Full Screen/Immersive Mode)
     */
    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // ... (your existing hideSystemUI logic)
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            // ... (your existing hideSystemUI logic for older versions)
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN)
        }
    }
}