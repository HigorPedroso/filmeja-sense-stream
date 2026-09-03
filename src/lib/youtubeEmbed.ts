import { Capacitor } from "@capacitor/core";

const isIOS = Capacitor.getPlatform() === "ios";

// A Supabase Edge Function (supabase/functions/youtube-embed) that serves a
// tiny HTML page embedding the real YouTube iframe, from a real public
// domain.
const YOUTUBE_PROXY_BASE = "https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/youtube-embed";

// Builds a YouTube embed iframe src. `qs` is a raw, already-encoded query
// string (e.g. "autoplay=1" or "listType=search&list=<encoded>&autoplay=1").
//
// iOS only: since a July 2025 YouTube change, embeds now require the
// `origin` param to match a real, publicly resolvable domain — WKWebView's
// own origin (Capacitor's `https://localhost`) is rejected outright, which
// is what causes error 153 ("video player configuration error") on iOS.
// Routing through this Edge Function proxy — served from a real domain —
// gives the nested YouTube iframe a legitimate origin/referrer. Android's
// WebView already sends proper referrers for a direct embed and is left
// untouched.
export function buildYoutubeEmbedUrl(videoId: string | null, qs = ""): string {
  if (!isIOS) {
    const path = videoId ? `/embed/${videoId}` : "/embed";
    return qs ? `https://www.youtube.com${path}?${qs}` : `https://www.youtube.com${path}`;
  }

  const videoParam = videoId ? `v=${encodeURIComponent(videoId)}&` : "";
  const embedQsParam = qs ? `embed_qs=${encodeURIComponent(qs)}` : "";
  return `${YOUTUBE_PROXY_BASE}?${videoParam}${embedQsParam}`;
}
