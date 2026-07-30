import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Converte conteúdo para slides AMP
function convertContentToAmpSlides(content: string) {
  const paragraphs = content
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .slice(0, 6);
  
  return paragraphs.map((paragraph, index) => {
    // Extrair imagens do conteúdo se houver
    const hasImage = paragraph.includes('![') && paragraph.includes('](');
    let imageUrl = 'https://filmeja.com.br/default-background.jpg';
    let text = paragraph;
    
    if (hasImage) {
      const imgStart = paragraph.indexOf('![');
      const imgEnd = paragraph.indexOf(')', imgStart);
      const urlStart = paragraph.indexOf('](', imgStart) + 2;
      
      imageUrl = paragraph.substring(urlStart, imgEnd);
      text = paragraph.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    }
    
    return {
      id: `slide-${index + 1}`,
      imageUrl,
      content: text.length > 200 ? text.substring(0, 197) + '...' : text
    };
  });
}

// Gera HTML AMP completo
function generateAmpHtml(post: any, slides: any[]) {
  return `<!doctype html>
    <html amp lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
        <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
        <title>${post.title}</title>
        <link rel="canonical" href="https://filmeja.com.br/blog/${post.slug}">
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
        <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
        <style amp-custom>
          amp-story-page {
            background-color: #000;
          }
          h1, h2 {
            font-weight: bold;
            color: white;
            line-height: 1.2;
          }
          p {
            color: white;
            font-size: 1rem;
            line-height: 1.5;
          }
          .cta-button {
            background-color: #FF3E3E;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
          }
          .overlay {
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 24px;
            box-sizing: border-box;
          }
        </style>
        
        <script type="application/ld+json">
          {
            "@context": "http://schema.org",
            "@type": "NewsArticle",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://filmeja.com.br/stories/${post.slug}"
            },
            "headline": "${post.title}",
            "image": [
              "${post.cover_image}"
            ],
            "datePublished": "${post.created_at}",
            "dateModified": "${post.updated_at || post.created_at}",
            "publisher": {
              "@type": "Organization",
              "name": "Filmeja",
              "logo": {
                "@type": "ImageObject",
                "url": "https://filmeja.com.br/logo-small.png"
              }
            }
          }
        </script>
      </head>
      <body>
        <amp-story standalone
          title="${post.title}"
          publisher="Filmeja"
          publisher-logo-src="https://filmeja.com.br/logo-small.png"
          poster-portrait-src="${post.cover_image}">
          
          ${slides.map(slide => `
            <amp-story-page id="${slide.id}">
              <amp-story-grid-layer template="fill">
                <amp-img src="${slide.imageUrl}"
                  width="720" height="1280"
                  layout="responsive"
                  alt="${slide.title || post.title}">
                </amp-img>
              </amp-story-grid-layer>
              
              <amp-story-grid-layer template="vertical" class="overlay">
                ${slide.title ? `<h1>${slide.title}</h1>` : ''}
                ${slide.content ? `<p>${slide.content}</p>` : ''}
                ${slide.ctaUrl ? `<a href="${slide.ctaUrl}" class="cta-button">${slide.ctaText || 'Saiba mais'}</a>` : ''}
              </amp-story-grid-layer>
            </amp-story-page>
          `).join('')}
          
          <amp-story-bookend layout="nodisplay">
            <script type="application/json">
              {
                "bookendVersion": "v1.0",
                "shareProviders": [
                  "facebook",
                  "twitter",
                  "whatsapp"
                ],
                "components": [
                  {
                    "type": "heading",
                    "text": "Mais no Filmeja"
                  },
                  {
                    "type": "small",
                    "title": "Leia o artigo completo",
                    "url": "https://filmeja.com.br/blog/${post.slug}"
                  }
                ]
              }
            </script>
          </amp-story-bookend>
        </amp-story>
      </body>
    </html>`;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split("/").pop() || "";

    // Cria um client do Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Busca o post pelo slug
    const { data: post, error } = await supabaseClient
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !post) {
      return new Response(
        JSON.stringify({
          error: "Post not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prepara os slides
    const slides = [
      {
        id: "cover",
        imageUrl: post.cover_image,
        title: post.title,
        content: "Deslize para ler mais",
      },
      ...convertContentToAmpSlides(post.content),
      {
        id: "end",
        imageUrl: post.cover_image,
        title: "Quer saber mais?",
        content: "Acesse o artigo completo no Filmeja",
        ctaUrl: `https://filmeja.com.br/blog/${post.slug}`,
        ctaText: "Ler Artigo Completo",
      },
    ];

    // Gera o HTML AMP
    const ampHtml = generateAmpHtml(post, slides);

    // Retorna o HTML AMP
    return new Response(ampHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate AMP story" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});