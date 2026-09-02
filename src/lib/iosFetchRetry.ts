import { Capacitor } from "@capacitor/core";

// iOS/WKWebView has a long-standing bug (still present through iOS 18) where
// a fetch() issued right as the page/WebView becomes visible — exactly what
// happens on a cold app launch, which is why this only ever shows up on the
// very first login of a session — fails immediately with a generic
// `TypeError: Load failed`, even though the network is fine and the very
// next attempt succeeds. There's nothing to fix on our end; the documented
// workaround is to retry once after a short delay. Scoped to iOS only —
// Android/web never hit this failure mode, so their fetch is untouched.
//
// Must be imported before anything else in the app gets a chance to call
// fetch (Supabase, TMDB, Gemini, ...), so this patches the global directly
// as a side effect rather than exporting something to call later.
if (Capacitor.getPlatform() === "ios") {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      return await originalFetch(...args);
    } catch (error) {
      const isLoadFailed = error instanceof TypeError && /load failed/i.test(error.message);
      if (!isLoadFailed) throw error;

      await new Promise((resolve) => setTimeout(resolve, 400));
      return originalFetch(...args);
    }
  };
}
