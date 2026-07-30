import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AmpStoryProps {
  slug: string;
}

export const AmpStory: React.FC<AmpStoryProps> = ({ slug }) => {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [ampHtml, setAmpHtml] = useState<string>('');

  useEffect(() => {
    async function fetchPostAndGenerateAmp() {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Buscar os dados do post
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (error || !data) {
          console.error('Erro ao buscar post:', error);
          return;
        }
        
        setPost(data);
        
        // Gerar HTML AMP válido
        const html = generateAmpHtml(data);
        setAmpHtml(html);
        
        // Inserir o HTML no documento
        const ampContainer = document.getElementById('amp-story-container');
        if (ampContainer) {
          ampContainer.innerHTML = html;
        }
      } catch (err) {
        console.error('Erro ao gerar AMP story:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPostAndGenerateAmp();
  }, [slug]);
  
  // Função para gerar HTML AMP válido com visual de streaming
  function generateAmpHtml(post: any) {
    // Dividir o conteúdo em blocos estruturais
    const contentBlocks = parseContentIntoBlocks(post.content);
    
    // Analisar se há imagens no conteúdo
    const contentImages = extractImagesFromContent(post.content);
    
    // Gerar classificações fictícias para o post (para aparência de streaming)
    const rating = Math.floor(Math.random() * 2) + 4; // 4 ou 5 estrelas
    const ratingCount = Math.floor(Math.random() * 900) + 100; // Entre 100-999 avaliações
    const year = new Date().getFullYear();
    
    // Extrair tags/categorias do post ou gerar ficticias
    const categories = post.tags ? post.tags.split(',').slice(0, 3) : ['Drama', 'Ação', 'Streaming'];
    
    // Criar slides com base nos blocos de conteúdo
    const slides = contentBlocks.map((block, index) => {
      // Gerar um ID realmente único para cada página
      const uniquePageId = `page-${block.type}-${index}-${Date.now().toString().slice(-4)}`;
      
      // Escolher uma imagem adequada para este slide
      const slideImage = contentImages[index % contentImages.length] || post.cover_image;
      
      // Gerar o HTML do slide com base no tipo de bloco
      if (block.type === 'heading') {
        return `
          <amp-story-page id="${uniquePageId}">
            <amp-story-grid-layer template="fill">
              <amp-img src="${slideImage}"
                width="720" height="1280"
                layout="responsive"
                alt="${block.content}">
              </amp-img>
            </amp-story-grid-layer>
            <amp-story-grid-layer template="vertical" class="bottom">
              <div class="content streaming-card">
                <div class="streaming-badge">DESTAQUE</div>
                <h2>${block.content}</h2>
                <div class="streaming-meta">
                  <span class="rating">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span>
                  <span class="year">${year}</span>
                </div>
              </div>
            </amp-story-grid-layer>
          </amp-story-page>
        `;
      }
      
      if (block.type === 'subheading') {
        return `
          <amp-story-page id="${uniquePageId}">
            <amp-story-grid-layer template="fill">
              <div class="gradient-bg"></div>
              <amp-img src="${slideImage}"
                width="720" height="1280"
                layout="responsive"
                alt="${block.content}">
              </amp-img>
            </amp-story-grid-layer>
            <amp-story-grid-layer template="vertical" class="bottom">
              <div class="content streaming-card-alt">
                <h3>${block.content}</h3>
                <div class="streaming-tags">
                  ${categories.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              </div>
            </amp-story-grid-layer>
          </amp-story-page>
        `;
      }
      
      if (block.type === 'list') {
        // Processar itens da lista
        const listItems = block.content.map((item: string, i: number) => 
          `<li><span class="list-number">${i+1}</span>${item}</li>`
        ).join('');
        
        return `
          <amp-story-page id="${uniquePageId}">
            <amp-story-grid-layer template="fill">
              <div class="dark-overlay"></div>
              <amp-img src="${slideImage}"
                width="720" height="1280"
                layout="responsive"
                alt="Lista de itens">
              </amp-img>
            </amp-story-grid-layer>
            <amp-story-grid-layer template="vertical" class="center">
              <div class="content streaming-list-card">
                <ul class="streaming-list">
                  ${listItems}
                </ul>
              </div>
            </amp-story-grid-layer>
          </amp-story-page>
        `;
      }
      
      // Padrão para parágrafos - com visual de cartão de streaming
      return `
        <amp-story-page id="${uniquePageId}">
          <amp-story-grid-layer template="fill">
            <div class="blur-bg"></div>
            <amp-img src="${slideImage}"
              width="720" height="1280"
              layout="responsive"
              alt="Imagem do slide ${index + 1}">
            </amp-img>
          </amp-story-grid-layer>
          <amp-story-grid-layer template="vertical" class="bottom">
            <div class="content streaming-content-card">
              <p>${block.content}</p>
              ${index % 3 === 0 ? `<div class="streaming-indicator">
                <div class="dot"></div>AGORA EM ALTA
              </div>` : ''}
            </div>
          </amp-story-grid-layer>
        </amp-story-page>
      `;
    });
    
    return `
      <!doctype html>
      <html amp lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <script async src="https://cdn.ampproject.org/v0.js"></script>
          <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
          <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
          <title>${post.title} - Web Story</title>
          <link rel="canonical" href="https://filmeja.com.br/blog/${post.slug}">
          <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
          <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
          <style amp-custom>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&display=swap');
            
            body, html {
              font-family: 'Montserrat', sans-serif;
            }
            
            amp-story-page { 
              background-color: #000; 
            }
            
            /* Estilos de Streaming */
            .blur-bg {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0,0,0,0.4);
              z-index: 1;
            }
            
            .dark-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9));
              z-index: 1;
            }
            
            .gradient-bg {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, #000 0%, transparent 70%);
              z-index: 1;
            }
            
            /* Cards estilo streaming */
            .streaming-card {
              color: white;
              background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.3) 100%);
              padding: 40px 24px;
              font-size: 18px;
              border-top-left-radius: 20px;
              border-top-right-radius: 20px;
              position: relative;
            }
            
            .streaming-card-alt {
              color: white;
              background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 80%);
              padding: 32px 24px;
              border-radius: 12px 12px 0 0;
              margin: 0 12px;
              border-top: 3px solid #FF3E3E;
            }
            
            .streaming-content-card {
              color: white;
              background: linear-gradient(to top, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.8) 100%);
              padding: 24px;
              border-radius: 16px 16px 0 0;
              margin: 0 12px;
              box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
            }
            
            .streaming-list-card {
              color: white;
              background: rgba(0,0,0,0.75);
              padding: 24px;
              border-radius: 16px;
              margin: 20px;
              box-shadow: 0 4px 30px rgba(0,0,0,0.5);
              border-left: 4px solid #FF3E3E;
            }
            
            /* Tipografia */
            h1, h2, h3 { 
              color: white;
              font-weight: 700;
              line-height: 1.2;
              margin: 0 0 12px 0;
              letter-spacing: -0.5px;
            }
            
            h1 { font-size: 36px; font-weight: 900; }
            h2 { font-size: 30px; }
            h3 { font-size: 26px; }
            
            p { 
              color: white; 
              margin-bottom: 12px; 
              font-size: 18px;
              line-height: 1.6;
            }
            
            /* Posicionamento */
            .bottom { align-content: end; }
            .center { align-content: center; justify-content: center; }
            
            /* Elementos visuais de streaming */
            .streaming-meta {
              display: flex;
              align-items: center;
              margin-top: 12px;
              font-size: 16px;
              color: #ccc;
            }
            
            .rating {
              color: #FF3E3E;
              margin-right: 16px;
              letter-spacing: 2px;
            }
            
            .year {
              display: inline-block;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 14px;
            }
            
            .streaming-badge {
              position: absolute;
              top: -12px;
              left: 24px;
              background: #FF3E3E;
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            
            .streaming-tags {
              display: flex;
              flex-wrap: wrap;
              margin-top: 12px;
              gap: 8px;
            }
            
            .tag {
              display: inline-block;
              background: rgba(255,255,255,0.15);
              color: white;
              padding: 4px 10px;
              border-radius: 16px;
              font-size: 12px;
            }
            
            .streaming-indicator {
              display: flex;
              align-items: center;
              margin-top: 16px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #FF3E3E;
              font-weight: 500;
            }
            
            .dot {
              width: 8px;
              height: 8px;
              background-color: #FF3E3E;
              border-radius: 50%;
              margin-right: 6px;
            }
            
            /* Listas estilo streaming */
            .streaming-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            .streaming-list li {
              color: white;
              font-size: 18px;
              margin-bottom: 16px;
              display: flex;
              align-items: flex-start;
              line-height: 1.4;
            }
            
            .list-number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 28px;
              height: 28px;
              background: #FF3E3E;
              border-radius: 50%;
              margin-right: 12px;
              font-weight: bold;
              flex-shrink: 0;
            }
            
            /* Botões estilo streaming */
            .streaming-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background-color: #FF3E3E;
              color: white;
              padding: 14px 24px;
              border-radius: 4px;
              font-weight: 600;
              text-decoration: none;
              margin-top: 24px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-size: 14px;
            }
            
            .streaming-button-icon {
              margin-left: 8px;
              font-size: 20px;
              line-height: 1;
            }
          </style>
        </head>
        <body>
          <amp-story standalone
            title="${post.title}"
            publisher="Filmeja"
            publisher-logo-src="https://filmeja.com.br/logo.png"
            poster-portrait-src="${post.cover_image}">
            
            <!-- Página de capa com estilo streaming -->
            <amp-story-page id="cover">
              <amp-story-grid-layer template="fill">
                <amp-img src="${post.cover_image}"
                  width="720" height="1280"
                  layout="responsive"
                  alt="${post.title}">
                </amp-img>
              </amp-story-grid-layer>
              <amp-story-grid-layer template="vertical" class="bottom">
                <div class="streaming-card">
                  <h1>${post.title}</h1>
                  <p>${post.meta_description || 'Filmeja - Cinema e Streaming'}</p>
                  <div class="streaming-meta">
                    <span class="rating">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span>
                    <span class="year">${year}</span>
                  </div>
                  <div class="streaming-tags">
                    ${categories.map(tag => `<span class="tag">${tag}</span>`).join('')}
                  </div>
                </div>
              </amp-story-grid-layer>
            </amp-story-page>
            
            <!-- Slides de conteúdo -->
            ${slides.join('')}
            
            <!-- Página final estilo streaming -->
            <amp-story-page id="last">
              <amp-story-grid-layer template="fill">
                <div class="dark-overlay"></div>
                <amp-img src="${post.cover_image}"
                  width="720" height="1280"
                  layout="responsive"
                  alt="Leia o artigo completo">
                </amp-img>
              </amp-story-grid-layer>
              <amp-story-grid-layer template="vertical" class="center">
                <div class="streaming-list-card" style="text-align: center;">
                  <h2 style="margin-bottom: 20px;">Disponível no Filmeja</h2>
                  <p>Leia o artigo completo e descubra mais detalhes sobre "${post.title}"</p>
                  <a href="https://filmeja.com.br/blog/${post.slug}" class="streaming-button">
                    Ver artigo completo
                    <span class="streaming-button-icon">▶</span>
                  </a>
                </div>
              </amp-story-grid-layer>
            </amp-story-page>
            
            <amp-story-bookend layout="nodisplay">
              <script type="application/json">
                {
                  "bookendVersion": "v1.0",
                  "shareProviders": [
                    "facebook",
                    "twitter",
                    "whatsapp",
                    "system"
                  ],
                  "components": [
                    {
                      "type": "heading",
                      "text": "Recomendado para você"
                    },
                    {
                      "type": "small",
                      "title": "Leia o artigo completo",
                      "url": "https://filmeja.com.br/blog/${post.slug}"
                    },
                    {
                      "type": "small",
                      "title": "Explorar mais Web Stories",
                      "url": "https://filmeja.com.br/stories"
                    }
                  ]
                }
              </script>
            </amp-story-bookend>
          </amp-story>
        </body>
      </html>
    `;
  }
  
  // Função para analisar o conteúdo markdown em blocos estruturados com mais granularidade
  function parseContentIntoBlocks(content: string) {
    const lines = content.split('\n');
    const blocks = [];
    let currentListItems = [];
    let inList = false;
    
    console.log(`Total de linhas no conteúdo: ${lines.length}`);
    
    // Primeira passagem - extrai blocos por tipo
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Finaliza uma lista anterior se necessário
      if (inList && !line.startsWith('- ') && !line.startsWith('* ') && !line.startsWith('+ ')) {
        blocks.push({
          type: 'list',
          content: currentListItems
        });
        currentListItems = [];
        inList = false;
      }
      
      // Pula linhas vazias
      if (!line) continue;
      
      // Detecta cabeçalhos H2
      if (line.startsWith('## ')) {
        blocks.push({
          type: 'heading',
          content: line.substring(3).trim()
        });
        continue;
      }
      
      // Detecta cabeçalhos H3
      if (line.startsWith('### ')) {
        blocks.push({
          type: 'subheading',
          content: line.substring(4).trim()
        });
        continue;
      }
      
      // Detecta itens de lista
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        // Remove o marcador e espaços
        const itemText = line.substring(2).trim()
          .replace(/!\[.*?\]\(.*?\)/g, '') // Remove imagens markdown
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Remove links markdown
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove negrito
          .replace(/\*(.*?)\*/g, '$1'); // Remove itálico
        
        currentListItems.push(itemText);
        inList = true;
        continue;
      }
      
      // Parágrafo padrão - dividir parágrafos longos em múltiplos slides
      if (!inList) {
        // Processa o texto para remover markdown
        const cleanText = line
          .replace(/!\[.*?\]\(.*?\)/g, '') // Remove imagens markdown
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Remove links markdown
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove negrito
          .replace(/\*(.*?)\*/g, '$1'); // Remove itálico
        
        // Se o texto for longo, dividir em múltiplos blocos para mais slides
        if (cleanText.length > 100) {
          // Divide o texto em sentenças
          const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
          
          if (sentences.length > 1) {
            // Agrupa sentenças em blocos de 1-2 sentenças por slide
            for (let j = 0; j < sentences.length; j += 2) {
              const sentenceGroup = sentences.slice(j, j + 2).join(' ');
              blocks.push({
                type: 'paragraph',
                content: sentenceGroup.trim()
              });
            }
          } else {
            blocks.push({
              type: 'paragraph',
              content: cleanText
            });
          }
        } else {
          blocks.push({
            type: 'paragraph',
            content: cleanText
          });
        }
      }
    }
    
    // Se terminar o loop ainda dentro de uma lista, adicione-a
    if (inList && currentListItems.length > 0) {
      blocks.push({
        type: 'list',
        content: currentListItems
      });
    }
    
    // Divide as listas longas em múltiplos slides
    const finalBlocks = [];
    
    blocks.forEach(block => {
      if (block.type === 'list' && block.content.length > 3) {
        // Divide a lista em grupos de 3 itens por slide
        for (let i = 0; i < block.content.length; i += 3) {
          finalBlocks.push({
            type: 'list',
            content: block.content.slice(i, i + 3)
          });
        }
      } else {
        finalBlocks.push(block);
      }
    });
    
    console.log(`Total de blocos gerados: ${finalBlocks.length}`);
    console.log('Tipos de blocos:', finalBlocks.map(b => b.type));
    
    // Garantir que temos pelo menos 10 slides (se o conteúdo permitir)
    if (finalBlocks.length < 10 && content.length > 500) {
      // Encontra o bloco de parágrafo mais longo para dividir
      const paragraphBlocks = finalBlocks.filter(b => b.type === 'paragraph');
      
      if (paragraphBlocks.length > 0) {
        // Ordena os blocos do mais longo para o mais curto
        paragraphBlocks.sort((a, b) => b.content.length - a.content.length);
        
        // Divide o parágrafo mais longo em partes menores
        const longestBlock = paragraphBlocks[0];
        const blockIndex = finalBlocks.indexOf(longestBlock);
        
        if (blockIndex !== -1 && longestBlock.content.length > 150) {
          // Remove o bloco original
          finalBlocks.splice(blockIndex, 1);
          
          // Divide em partes menores
          const parts = [];
          const words = longestBlock.content.split(' ');
          const wordsPerPart = Math.floor(words.length / 3);
          
          for (let i = 0; i < words.length; i += wordsPerPart) {
            parts.push({
              type: 'paragraph',
              content: words.slice(i, i + wordsPerPart).join(' ')
            });
          }
          
          // Insere as partes no lugar do bloco original
          finalBlocks.splice(blockIndex, 0, ...parts);
        }
      }
    }
    
    console.log(`Blocos finais após otimização: ${finalBlocks.length}`);
    return finalBlocks;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-filmeja-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-filmeja-primary animate-spin" />
        <span className="ml-2 text-white">Carregando Web Story...</span>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-filmeja-dark p-6 text-white">
        <h1 className="text-2xl font-bold">Story não encontrado</h1>
        <p>Não foi possível encontrar o Web Story solicitado.</p>
      </div>
    );
  }
  
  // Servimos uma página que carrega o AMP dentro de um iframe
  // Isso permite que o AMP seja carregado corretamente
  return (
    <>
      <Helmet>
        <title>{post.title} - Web Story | Filmeja</title>
      </Helmet>
      
      <div className="h-screen w-screen bg-black">
        <iframe
          srcDoc={ampHtml}
          className="w-full h-full border-none"
          title={`Web Story: ${post.title}`}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      
      <div id="amp-story-container" style={{ display: 'none' }}></div>
    </>
  );
};

// Função para extrair imagens do conteúdo markdown
function extractImagesFromContent(content: string) {
  const images: string[] = [];
  const regex = /!\[.*?\]\((.*?)\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  return images;
}