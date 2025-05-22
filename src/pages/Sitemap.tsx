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

        const baseUrl = 'https://filmeja.com';
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${posts?.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        document.documentElement.innerHTML = xmlDoc.documentElement.outerHTML;
        document.contentType = 'application/xml';
      } catch (error) {
        console.error('Error generating sitemap:', error);
      }
    };

    generateSitemap();
  }, []);

  return null;
};