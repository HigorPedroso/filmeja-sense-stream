
import React from 'react';
import { Heart, Search, UserRound } from 'lucide-react';

const features = [
  {
    title: 'Recomendações por Humor',
    description: 'Conte como está se sentindo e receba sugestões perfeitas para o seu humor.',
    icon: <Heart className="h-10 w-10 text-filmeja-purple" />
  },
  {
    title: 'Onde Assistir',
    description: 'Saiba exatamente em quais plataformas de streaming seus filmes favoritos estão disponíveis.',
    icon: <Search className="h-10 w-10 text-filmeja-purple" />
  },
  {
    title: 'Perfil Personalizado',
    description: 'Receba recomendações cada vez melhores baseadas em suas preferências anteriores.',
    icon: <UserRound className="h-10 w-10 text-filmeja-purple" />
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-filmeja-dark">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Por que usar o FilmeJá?</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Descubra filmes e séries que combinam perfeitamente com o seu momento, 
            sem perder horas escolhendo o que assistir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 rounded-lg hover:border-filmeja-purple transition-colors"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
