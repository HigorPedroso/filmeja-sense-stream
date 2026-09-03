import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// iOS/WKWebView error 153 fix: since July 2025 YouTube requires the embed's
// `origin` param to match a real, publicly resolvable domain — the app's own
// origin (Capacitor's `https://localhost`) is rejected outright. This proxy
// page is served from the real Supabase Functions domain, so the YouTube
// iframe nested inside it gets a legitimate origin/referrer. The app loads
// this page in an iframe (instead of embedding youtube-nocookie.com
// directly) only on iOS; Android already works and is untouched.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const videoId = url.searchParams.get("v");
  const embedQs = url.searchParams.get("embed_qs") || "";

  const origin = Deno.env.get("SUPABASE_URL") ?? url.origin;
  const embedPath = videoId ? `/embed/${encodeURIComponent(videoId)}` : "/embed";
  const params = new URLSearchParams(embedQs);
  params.set("origin", origin);
  const embedSrc = `https://www.youtube-nocookie.com${embedPath}?${params.toString()}`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head>
<body>
<iframe src="${embedSrc}" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
