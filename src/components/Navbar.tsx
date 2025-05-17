
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, User, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navbarClass = transparent && !scrolled
    ? 'bg-transparent transition-colors duration-300'
    : 'bg-filmeja-dark/95 backdrop-blur-sm shadow-md transition-colors duration-300';

  // For demo purposes, let's consider all logged-in users as admins
  const isAdmin = !!session;

  return (
    <header className={`fixed w-full top-0 left-0 z-50 ${navbarClass}`}>
      <div className="container mx-auto flex items-center justify-between py-4">
        <Link to="/" className="text-2xl font-bold text-filmeja-purple flex items-center">
          <span className="mr-1">Filme</span>
          <span className="text-white">Já</span>
        </Link>

        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-white hover:text-filmeja-purple transition-colors">
            Início
          </Link>
          <Link to="/mood" className="text-white hover:text-filmeja-purple transition-colors">
            Por Humor
          </Link>
          <Link to="/blog" className="text-white hover:text-filmeja-purple transition-colors">
            Blog
          </Link>
          {isAdmin && (
            <Link to="/super" className="text-white hover:text-filmeja-purple transition-colors flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {session ? (
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:text-filmeja-purple">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button variant="ghost" size="icon" className="text-white hover:text-filmeja-purple">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Link to={session ? "/dashboard" : "/signup"}>
            <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
              {session ? 'Dashboard' : 'Começar'}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
