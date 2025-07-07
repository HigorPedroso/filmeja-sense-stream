
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = {
  free: [
    '10 recomendações por dia',
    'Até 50 recomendações por mês',
    'Detalhes essenciais sobre filmes e séries',
    'Onde assistir (links para streamings)',
  ],
  premium: [
    'Acesso ilimitado ao Filmin.AI',
    'Recomendações baseadas no humor',
    'Detalhes essenciais sobre filmes e séries',
    'Onde assistir (links para streamings)',
    'Sem anúncios',
    'Salve seus favoritos',
    'Histórico de visualizações',
  ]
};

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-filmeja-dark/50 to-filmeja-dark">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Escolha seu plano</h2>
          <p className="text-lg text-gray-300">
            Comece gratuitamente ou desbloqueie todos os recursos com o plano premium.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="border border-white/10 bg-filmeja-dark/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg transform hover:scale-105 transition-transform">
            <div className="bg-white/10 text-white p-6">
              <h3 className="text-2xl font-bold text-center">Plano Gratuito</h3>
              <div className="text-center mt-4">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-white/80 ml-1">/mês</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1">
                      <Check className="h-5 w-5 text-white/70" />
                    </div>
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/signup">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
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
                {features.premium.map((feature, index) => (
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
