import { supabase } from '../integrations/supabase/client';

export async function generateSitemap() {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published');

    const baseUrl = window.location.origin;

    const staticUrls = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/explore', priority: '0.8', changefreq: 'daily' },
      { url: '/blog', priority: '0.8', changefreq: 'daily' },
      { url: '/mood', priority: '0.7', changefreq: 'weekly' },
      { url: '/faq', priority: '0.5', changefreq: 'monthly' },
      { url: '/termos', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacidade', priority: '0.5', changefreq: 'monthly' },
      { url: '/contato', priority: '0.5', changefreq: 'monthly' }
    ];

    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
${posts?.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

    const blob = new Blob([xmlString], { type: 'application/xml' });
    return new Response(blob, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}