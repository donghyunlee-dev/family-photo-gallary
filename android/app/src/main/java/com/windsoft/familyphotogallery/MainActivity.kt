package com.windsoft.familyphotogallery

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.windsoft.familyphotogallery.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
  private lateinit var binding: ActivityMainBinding

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)

    with(binding.webView.settings) {
      javaScriptEnabled = true
      domStorageEnabled = true
      loadWithOverviewMode = true
      useWideViewPort = true
      builtInZoomControls = false
      displayZoomControls = false
      mediaPlaybackRequiresUserGesture = false
    }

    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
      WebSettingsCompat.setAlgorithmicDarkeningAllowed(binding.webView.settings, false)
    }

    binding.webView.webViewClient = GalleryWebViewClient()
    binding.webView.loadUrl(BuildConfig.WEB_APP_URL)

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (binding.webView.canGoBack()) {
            binding.webView.goBack()
          } else {
            finish()
          }
        }
      }
    )
  }

  override fun onDestroy() {
    binding.webView.destroy()
    super.onDestroy()
  }

  private inner class GalleryWebViewClient : WebViewClient() {
    override fun shouldOverrideUrlLoading(
      view: WebView?,
      request: WebResourceRequest?
    ): Boolean = false

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
      binding.loadingIndicator.visibility = View.VISIBLE
    }

    override fun onPageFinished(view: WebView?, url: String?) {
      binding.loadingIndicator.visibility = View.GONE
    }
  }
}
