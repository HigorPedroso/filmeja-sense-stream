import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Sitemap = () => {
  useEffect(() => {
    const generateSitemap = async () => {
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
          </url>
          ${posts?.map(post => `
            <url>
              <loc>${baseUrl}/blog/${post.slug}</loc>
              <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.7</priority>
            </url>
          `).join('')}
        </urlset>`;

      // Set the content type and send the XML
      const blob = new Blob([xml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      window.location.href = url;
    };

    generateSitemap();
  }, []);

  return null;
};