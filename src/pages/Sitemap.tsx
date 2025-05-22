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
        
        // Set XML content type
        document.contentType = 'application/xml';
        
        // Write XML directly to document
        document.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
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
</urlset>`);

        // Prevent any additional HTML from being added
        document.close();
      } catch (error) {
        console.error('Error generating sitemap:', error);
      }
    };

    generateSitemap();
  }, []);

  return null;
};