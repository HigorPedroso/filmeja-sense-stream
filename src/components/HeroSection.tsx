
import React from 'react';
import { Button } from '@/components/ui/button';
import VideoBackground from './VideoBackground';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <VideoBackground>
      <div className="container mx-auto flex flex-col justify-center h-full px-4 md:px-6">
        <div className="max-w-3xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Descubra o que assistir <span className="text-filmeja-purple">agora!</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Recomendações personalizadas de filmes e séries baseadas no seu humor.
            Encontre o conteúdo perfeito para o seu momento em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
                Começar agora
              </Button>
            </Link>
            <Link to="/mood">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Testar gratuitamente
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-300 mt-4">
            Apenas R$ 9,99/mês. Cancele quando quiser.
          </p>
        </div>
      </div>
    </VideoBackground>
  );
};

export default HeroSection;
