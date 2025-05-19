import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Heart, Star, User } from "lucide-react";

export function MobileSidebar() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-filmeja-dark/95 border-t border-white/[0.02] backdrop-blur-xl md:hidden z-50">
      <nav className="flex justify-around items-center py-3 px-4">
        <Button variant="ghost" className="text-gray-300" title="Início" onClick={() => navigate('/dashboard')}>
          <Home className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          className="text-gray-300" 
          title="Minha Lista" 
          onClick={() => navigate('/favorites')}
        >
          <Heart className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          className="text-gray-300"
          title="Recomendados"
        >
          <Star className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          className="text-gray-300" 
          title="Minha Conta" 
          onClick={() => navigate('/profile')}
        >
          <User className="w-5 h-5" />
        </Button>
      </nav>
    </div>
  );
}