
import React from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className="min-h-screen bg-filmeja-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Assine o FilmeJá
          </h1>
          
          <div className="text-center mb-8">
            <p className="text-gray-300 mb-4">
              Apenas R$9,99/mês para ter as melhores recomendações de filmes e séries baseadas no seu humor.
            </p>
            <span className="text-sm text-gray-400">
              Cancele quando quiser, sem compromisso.
            </span>
          </div>
          
          <Button className="w-full bg-filmeja-purple hover:bg-filmeja-purple/90 text-white mb-4">
            Continuar com Stripe
          </Button>
          
          <p className="text-xs text-gray-400 text-center mt-6">
            Ao assinar, você concorda com nossos <Link to="/termos" className="text-filmeja-purple hover:underline">Termos de Uso</Link> e <Link to="/privacidade" className="text-filmeja-purple hover:underline">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
