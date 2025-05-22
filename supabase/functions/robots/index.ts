import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://filmesja.com/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});