
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getContentDetails } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { ContentDetails as ContentDetailsType } from '@/types/movie';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ContentDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [content, setContent] = useState<ContentDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadContentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!id || !type || (type !== 'movie' && type !== 'tv')) {
          throw new Error('Invalid content type or ID');
        }
        
        const details = await getContentDetails(Number(id), type as 'movie' | 'tv');
        setContent(details);
      } catch (err) {
        console.error('Failed to load content details:', err);
        setError('Não foi possível carregar os detalhes do conteúdo');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContentDetails();
  }, [id, type]);
  
  const getImageUrl = (path: string, size = 'original') => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-filmeja-dark flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 md:py-28">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="h-96 w-64 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4 rounded-md" />
              <Skeleton className="h-6 w-1/4 rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !content) {
    return (
      <div className="min-h-screen bg-filmeja-dark flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 md:py-28 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Conteúdo não encontrado</h1>
          <p className="text-gray-300">{error || "Este título não está disponível no momento."}</p>
        </div>
        <Footer />
      </div>
    );
  }
  
  const releaseYear = content.release_date 
    ? new Date(content.release_date).getFullYear() 
    : '';
  
  return (
    <div className="min-h-screen bg-filmeja-dark flex flex-col">
      <Navbar />
      
      <div 
        className="relative w-full h-[70vh] min-h-[500px] bg-cover bg-center"
        style={{ backgroundImage: `url(${getImageUrl(content.backdrop_path)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-filmeja-dark via-filmeja-dark/90 to-transparent" />
        
        <div className="container mx-auto px-4 relative h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row items-start gap-8 w-full">
            <div className="shrink-0 w-48 md:w-64 rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={getImageUrl(content.poster_path)} 
                alt={content.title}
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {content.title}
                </h1>
                <span className="text-lg text-gray-300">({releaseYear})</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="bg-yellow-500/20 px-2 py-1 rounded flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="text-white">{content.vote_average.toFixed(1)}</span>
                </div>
                {content.media_type === 'movie' && content.runtime && (
                  <div className="text-gray-300">
                    {content.runtime} minutos
                  </div>
                )}
                {content.media_type === 'tv' && content.number_of_seasons && (
                  <div className="text-gray-300">
                    {content.number_of_seasons} temporadas
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {content.genres.map(genre => (
                    <span key={genre.id} className="bg-filmeja-purple/20 text-white px-2 py-1 rounded text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Sinopse</h2>
                <p className="text-gray-300">{content.overview}</p>
              </div>
              
              {content.streaming_providers.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-3">Disponível em</h2>
                  <div className="flex flex-wrap gap-3">
                    {content.streaming_providers.map(provider => (
                      <a 
                        key={provider.provider_id}
                        href="#" 
                        className="block bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
                        title={provider.provider_name}
                      >
                        <img 
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                          alt={provider.provider_name}
                          className="h-10 w-10"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                {content.trailer_key && (
                  <Button 
                    className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white"
                    onClick={() => {
                      const element = document.getElementById('trailer-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Assistir Trailer
                  </Button>
                )}
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Heart className="h-4 w-4 mr-2" />
                  Adicionar aos Favoritos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {content.trailer_key && (
        <div id="trailer-section" className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Trailer</h2>
            <div className="aspect-video max-w-4xl mx-auto">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${content.trailer_key}`}
                title={`${content.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ContentDetails;
