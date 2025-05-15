
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !transparent
          ? 'bg-filmeja-dark shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-white font-bold text-xl">FilmeJá</span>
        </Link>

        {/* Desktop navigation */}
        {!isMobile && (
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/' ? 'font-medium' : ''
              }`}
            >
              Início
            </Link>
            <Link
              to="/explore"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/explore' ? 'font-medium' : ''
              }`}
            >
              Explore
            </Link>
            <Link
              to="/mood"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/mood' ? 'font-medium' : ''
              }`}
            >
              Humor
            </Link>
            <Link
              to="/dashboard"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/dashboard' ? 'font-medium' : ''
              }`}
            >
              Dashboard
            </Link>
            
            <div className="relative group">
              <button className="text-white hover:text-primary transition-colors flex items-center">
                Mais <ChevronDown className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="py-1">
                  <Link
                    to="/about"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sobre Nós
                  </Link>
                  <Link
                    to="/blog"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Blog
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Contato
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login/Signup button */}
        <div className="flex items-center space-x-4">
          <Link to="/signup">
            <Button
              variant="default"
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white"
              size="sm"
            >
              {location.pathname === '/signup' ? 'Criar Conta' : 'Entrar'}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          {isMobile && (
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobile && isMenuOpen && (
        <div className="bg-filmeja-dark py-4 px-6 absolute w-full animate-fade-in">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/' ? 'font-medium' : ''
              }`}
            >
              Início
            </Link>
            <Link
              to="/explore"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/explore' ? 'font-medium' : ''
              }`}
            >
              Explore
            </Link>
            <Link
              to="/mood"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/mood' ? 'font-medium' : ''
              }`}
            >
              Humor
            </Link>
            <Link
              to="/dashboard"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/dashboard' ? 'font-medium' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/about' ? 'font-medium' : ''
              }`}
            >
              Sobre Nós
            </Link>
            <Link
              to="/blog"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/blog' ? 'font-medium' : ''
              }`}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className={`text-white hover:text-primary transition-colors ${
                location.pathname === '/contact' ? 'font-medium' : ''
              }`}
            >
              Contato
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
