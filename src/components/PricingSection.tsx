
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  'Recomendações baseadas no humor',
  'Onde assistir (links para streamings)',
  'Informações detalhadas de filmes e séries',
  'Sem anúncios',
  'Salve seus favoritos',
  'Histórico de visualizações',
];

const PricingSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-filmeja-dark/50 to-filmeja-dark">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Preço simples</h2>
          <p className="text-lg text-gray-300">
            Sem complicações, apenas um plano com tudo que você precisa.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="border border-filmeja-purple/30 bg-filmeja-dark/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg transform hover:scale-105 transition-transform">
            <div className="bg-filmeja-purple text-white p-6">
              <h3 className="text-2xl font-bold text-center">Plano Premium</h3>
              <div className="text-center mt-4">
                <span className="text-4xl font-bold">R$ 9,99</span>
                <span className="text-white/80 ml-1">/mês</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1">
                      <Check className="h-5 w-5 text-filmeja-purple" />
                    </div>
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/signup">
                <Button className="w-full bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
                  Comece agora
                </Button>
              </Link>
              
              <p className="text-center text-gray-400 text-sm mt-4">
                Cancele quando quiser. Sem contratos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
