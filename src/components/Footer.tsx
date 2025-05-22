
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-filmeja-dark/50 border-t border-white/10 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FilmeJá</h3>
            <p className="text-sm text-gray-400">
              Recomendações inteligentes para você
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-sm text-gray-400 hover:text-filmeja-purple">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-400 hover:text-filmeja-purple">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-sm text-gray-400 hover:text-filmeja-purple">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-sm text-gray-400 hover:text-filmeja-purple">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre</h3>
            <p className="text-sm text-gray-400">
              O FilmeJá é um serviço de recomendação baseado em inteligência artificial. Não armazenamos, transmitimos ou disponibilizamos filmes ou séries. As sugestões redirecionam para plataformas licenciadas como Netflix, Prime Video, Disney+, etc.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} FilmeJá. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
