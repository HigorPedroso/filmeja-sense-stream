
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ContentItem } from '@/types/movie';
import MovieCard from './MovieCard';
import { Dice6 } from 'lucide-react';

// Mock recommendation for the wheel
const mockRecommendations: ContentItem[] = [
  {
    id: 123456,
    title: 'A Origem',
    overview: 'Dom Cobb é um ladrão com a rara habilidade de roubar segredos do inconsciente durante o estado de sono.',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    release_date: '2010-07-22',
    vote_average: 8.4,
    media_type: 'movie',
    genre_ids: [28, 878, 12]
  },
  {
    id: 234567,
    title: 'Stranger Things',
    overview: 'Quando um garoto desaparece, a cidade toda participa nas buscas. Mas o que encontram são segredos, forças sobrenaturais e uma menina.',
    poster_path: '/4yycSPnchdNAZirGkmCYQwTd3cr.jpg',
    backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    release_date: '2016-07-15',
    vote_average: 8.6,
    media_type: 'tv',
    genre_ids: [18, 9648, 10765]
  },
  {
    id: 345678,
    title: 'Cidade de Deus',
    overview: 'Buscapé é um jovem pobre, negro, sensível e bastante amedrontado, que cresce em um universo de muita violência.',
    poster_path: '/lscMn3B1Wi1uUVvKWUB28qR6Kx.jpg',
    backdrop_path: '/lxD5ak7BOoinRNehOCA85CQ8ubr.jpg',
    release_date: '2002-08-31',
    vote_average: 8.5,
    media_type: 'movie',
    genre_ids: [18, 80]
  }
];

const RandomWheel: React.FC = () => {
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const handleSpin = () => {
    setIsSpinning(true);
    setSelectedContent(null);
    
    // Simulate wheel spinning with a timeout
    toast({
      title: 'A roleta está girando!',
      description: 'Descobrindo o título perfeito para você...',
    });
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * mockRecommendations.length);
      const selected = mockRecommendations[randomIndex];
      setSelectedContent(selected);
      setIsSpinning(false);
      
      toast({
        title: 'Encontramos!',
        description: `Que tal assistir "${selected.title}"?`,
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {selectedContent ? (
        <div className="flex flex-col items-center">
          <div className="w-36 h-56 mb-4 relative">
            <MovieCard item={selectedContent} size="small" />
          </div>
          <Button
            onClick={handleSpin}
            variant="outline"
            className="bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white border-none mt-2"
          >
            <Dice6 className="mr-2" /> Girar Novamente
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSpin}
          disabled={isSpinning}
          className="px-8 py-6 rounded-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white text-lg font-bold hover:opacity-90 transition-all"
        >
          <Dice6 className={`mr-2 ${isSpinning ? 'animate-spin' : ''}`} size={24} />
          {isSpinning ? 'Girando...' : 'Girar Roleta'}
        </Button>
      )}
    </div>
  );
};

export default RandomWheel;
