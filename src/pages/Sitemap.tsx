import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Sitemap = () => {
  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('slug, updated_at')
          .eq('status', 'published');

        const baseUrl = window.location.origin;
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${posts?.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

        // Create response with proper headers
        const response = new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': xml.length.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        });

        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

      } catch (error) {
        console.error('Error generating sitemap:', error);
      }
    };

    generateSitemap();
  }, []);

  return null;
};