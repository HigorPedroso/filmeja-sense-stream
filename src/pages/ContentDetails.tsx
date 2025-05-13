
import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getContentDetails } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const ContentDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  
  // In a real implementation, this would be fetched with React Query
  let content;
  
  try {
    content = getContentDetails(Number(id));
  } catch (error) {
    return <div>Content not found</div>;
  }
  
  const getImageUrl = (path: string, size = 'original') => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };
  
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
              
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-yellow-500/20 px-2 py-1 rounded flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="text-white">{content.vote_average.toFixed(1)}</span>
                </div>
                <div className="text-gray-300">
                  {content.media_type === 'movie' 
                    ? `${content.runtime} minutos`
                    : `${content.number_of_seasons} temporadas`}
                </div>
                <div className="flex gap-1">
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
              
              <div className="flex flex-wrap gap-3">
                <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
                  Assistir Trailer
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Heart className="h-4 w-4 mr-2" />
                  Adicionar aos Favoritos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {content.trailer_key && (
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
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ContentDetails;
