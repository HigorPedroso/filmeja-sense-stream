
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-filmeja-dark flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-9xl font-bold text-filmeja-purple mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-6">Página não encontrada</h2>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Parece que a página que você está procurando não existe ou foi movida.
          </p>
          <Link to="/">
            <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
              Voltar para o início
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
