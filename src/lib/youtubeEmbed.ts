import { Capacitor } from "@capacitor/core";

const isIOS = Capacitor.getPlatform() === "ios";

// public/youtube-embed.html — a static page (served from the real
// filmeja.com.br domain via Netlify) embedding the real YouTube iframe.
// A Supabase Edge Function was tried first, but Supabase forces HTML
// responses on the shared *.supabase.co domain down to Content-Type:
// text/plain with a locked-down CSP (an anti-phishing platform
// restriction), so the browser rendered the proxy page as raw text
// instead of an iframe. A static file on our own real domain has no such
// restriction.
const YOUTUBE_PROXY_BASE = "https://filmeja.com.br/youtube-embed.html";

// Builds a YouTube embed iframe src. `qs` is a raw, already-encoded query
// string (e.g. "autoplay=1" or "listType=search&list=<encoded>&autoplay=1").
//
// iOS only: since a July 2025 YouTube change, embeds now require the
// `origin` param to match a real, publicly resolvable domain — WKWebView's
// own origin (Capacitor's `https://localhost`) is rejected outright, which
// is what causes error 153 ("video player configuration error") on iOS.
// Routing through this proxy page — served from a real domain — gives the
// nested YouTube iframe a legitimate origin/referrer. Android's WebView
// already sends proper referrers for a direct embed and is left untouched.
export function buildYoutubeEmbedUrl(videoId: string | null, qs = ""): string {
  if (!isIOS) {
    const path = videoId ? `/embed/${videoId}` : "/embed";
    return qs ? `https://www.youtube.com${path}?${qs}` : `https://www.youtube.com${path}`;
  }

  const videoParam = videoId ? `v=${encodeURIComponent(videoId)}&` : "";
  const embedQsParam = qs ? `embed_qs=${encodeURIComponent(qs)}` : "";
  return `${YOUTUBE_PROXY_BASE}?${videoParam}${embedQsParam}`;
}
