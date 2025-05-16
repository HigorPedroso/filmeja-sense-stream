
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ContentItem } from '@/types/movie';
import MovieCard from './MovieCard';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RandomWheel: React.FC = () => {
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [displayedContent, setDisplayedContent] = useState<ContentItem[]>([]);
  const [topContent, setTopContent] = useState<ContentItem[]>([]);
  const [rotationAngle, setRotationAngle] = useState(0);

  useEffect(() => {
    const fetchTopContent = async () => {
      try {
        // Fetch both top movies and TV shows
        const [moviesResponse, tvResponse] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR&page=1`)
        ]);

        const [moviesData, tvData] = await Promise.all([
          moviesResponse.json(),
          tvResponse.json()
        ]);

        // Filter for highly rated content (rating > 8.0)
        const topMovies = moviesData.results
          .filter((movie: any) => movie.vote_average > 8.0)
          .map((movie: any) => ({ ...movie, media_type: 'movie' }));

        const topTv = tvData.results
          .filter((tv: any) => tv.vote_average > 8.0)
          .map((tv: any) => ({ ...tv, media_type: 'tv', title: tv.name }));

        // Combine and shuffle the results
        const combined = [...topMovies, ...topTv]
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 20); // Keep top 20

        setTopContent(combined);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o conteúdo.',
          variant: 'destructive',
        });
      }
    };

    fetchTopContent();
  }, [toast]);

  const startSpinning = () => {
    setIsSpinning(true);
    setSelectedContent(null);
    
    // Select 8 random items for the wheel
    const wheelItems = Array.from({ length: 8 }, () => {
      const randomIndex = Math.floor(Math.random() * topContent.length);
      return topContent[randomIndex];
    });
    setDisplayedContent(wheelItems);

    // Calculate final rotation (multiple of 360 + random position)
    const totalSpins = 5; // Number of full rotations
    const finalAngle = (360 * totalSpins) + (Math.random() * 360);
    
    // Animate rotation
    setRotationAngle(0);
    setTimeout(() => {
      setRotationAngle(finalAngle);
      
      // Select winner after animation
      setTimeout(() => {
        const winningIndex = Math.floor((finalAngle % 360) / (360 / 8));
        setSelectedContent(wheelItems[winningIndex]);
        setIsSpinning(false);
        
        toast({
          title: 'Perfeito!',
          description: `Encontramos "${wheelItems[winningIndex].title}" - Nota: ${wheelItems[winningIndex].vote_average.toFixed(1)} ⭐`,
        });
      }, 3000);
    }, 100);
  };

  return (
    <div className="flex flex-col items-center p-8">
      <div className="relative w-[400px] h-[400px] mb-8">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: rotationAngle }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          {displayedContent.map((content, index) => {
            const angle = (index * 360) / 8;
            return (
              <motion.div
                key={content.id}
                className="absolute w-32 h-48 origin-bottom"
                style={{
                  transform: `rotate(${angle}deg) translateY(-160px)`,
                }}
              >
                <div className="relative w-32 h-48 transform -rotate-[${angle}deg]">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${content.poster_path}`}
                    alt={content.title}
                    className="w-full h-full object-cover rounded-lg border-2 border-filmeja-purple/50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg">
                    <div className="absolute bottom-0 p-2 text-white text-center w-full">
                      <p className="text-sm font-semibold truncate">{content.title}</p>
                      <p className="text-xs">{content.vote_average.toFixed(1)} ⭐</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Center pointer */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-16 bg-filmeja-purple/80 clip-triangle z-10" />
      </div>

      <Button
        onClick={startSpinning}
        disabled={isSpinning || topContent.length === 0}
        className="px-8 py-6 rounded-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white text-lg font-bold hover:opacity-90 transition-all"
      >
        {isSpinning ? (
          <Pause className="mr-2 animate-pulse" size={24} />
        ) : (
          <Play className="mr-2" size={24} />
        )}
        {isSpinning ? 'Girando...' : 'Girar Roleta'}
      </Button>

      {selectedContent && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center p-4 bg-filmeja-purple/20 rounded-lg"
        >
          <h3 className="text-xl font-bold text-white mb-2">{selectedContent.title}</h3>
          <p className="text-sm text-gray-300">
            {selectedContent.media_type === 'movie' ? 'Filme' : 'Série'} • {selectedContent.vote_average.toFixed(1)} ⭐
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Add this CSS to your global styles
const styles = `
  .clip-triangle {
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
`;

export default RandomWheel;
