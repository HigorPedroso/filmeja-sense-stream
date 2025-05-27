import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingSection = () => {
  return (
    <section className="py-24 px-4 bg-filmeja-dark/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Escolha seu plano
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Comece gratuitamente ou desbloqueie todos os recursos com o plano premium
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
            <p className="text-gray-400 mb-6">Experimente os recursos básicos</p>
            <div className="text-3xl font-bold text-white mb-8">
              R$ 0<span className="text-lg font-normal text-gray-400">/mês</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Recomendações básicas
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                5 recomendações por dia
              </li>
              <li className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Acesso ao catálogo básico
              </li>
            </ul>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white">
              Começar Grátis
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="bg-filmeja-purple/20 backdrop-blur-sm border border-filmeja-purple/30 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-filmeja-purple text-white text-xs px-3 py-1 rounded-full">
              Recomendado
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
            <p className="text-gray-300 mb-6">Acesso completo a todos os recursos</p>
            <div className="text-3xl font-bold text-white mb-8">
              R$ 9,99<span className="text-lg font-normal text-gray-400">/mês</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-200">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Recomendações personalizadas com IA
              </li>
              <li className="flex items-center text-gray-200">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Recomendações ilimitadas
              </li>
              <li className="flex items-center text-gray-200">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Acesso ao catálogo completo
              </li>
              <li className="flex items-center text-gray-200">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Suporte prioritário
              </li>
              <li className="flex items-center text-gray-200">
                <Check className="h-5 w-5 text-filmeja-purple mr-2" />
                Sem anúncios
              </li>
            </ul>
            <Button className="w-full bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
              Assinar Premium
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;