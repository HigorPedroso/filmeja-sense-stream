import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function StoriesIndex() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStories() {
      try {
        setLoading(true);
        
        // Buscar todos os posts (sem filtro has_story)
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStories();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-filmeja-dark p-6 flex justify-center items-center">
        <Loader2 className="h-10 w-10 text-filmeja-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Web Stories | Filmeja</title>
        <meta name="description" content="Confira os últimos Web Stories do Filmeja com dicas e notícias sobre filmes e séries." />
      </Helmet>
      
      <div className="min-h-screen bg-filmeja-dark p-6">
        <h1 className="text-3xl font-bold text-white mb-8">Web Stories</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stories.map((story) => (
            <Link 
              to={`/stories/${story.slug}`} 
              key={story.id}
              className="aspect-[9/16] relative rounded-lg overflow-hidden group"
            >
              <img 
                src={story.cover_image || 'https://filmeja.com.br/placeholder.jpg'} 
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex flex-col justify-end p-3">
                <h3 className="text-white font-medium text-sm">{story.title}</h3>
                <div className="flex items-center mt-2">
                  <span className="bg-filmeja-primary text-white text-xs px-2 py-1 rounded-full">
                    Web Story
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {stories.length === 0 && (
          <p className="text-white text-center mt-10">Nenhum story disponível no momento.</p>
        )}
      </div>
    </>
  );
}