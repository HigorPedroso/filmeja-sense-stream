import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Home, Clock, Heart, Star, User, LogOut } from "lucide-react";

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  onLogout: () => void;
}

export function Sidebar({ isExpanded, setIsExpanded, onLogout }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 
        bg-gradient-to-b from-black via-filmeja-dark/95 to-black/95
        before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_100%_0%,rgba(120,0,255,0.15),transparent_50%)]
        after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_0%_100%,rgba(0,70,255,0.15),transparent_50%)]
        backdrop-blur-xl border-r border-white/[0.02]
        hidden md:block
        ${isExpanded ? "w-[280px]" : "w-[70px]"}`}
    >
      <div className="flex flex-col h-full px-4 relative z-10">
        <div className="flex flex-col h-full px-2 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-filmeja-purple/20 hover:bg-filmeja-purple/30 p-1"
          >
            {isExpanded ? "←" : "→"}
          </Button>
          
          <div className="py-8 flex justify-center">
            {isExpanded ? (
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-filmeja-purple to-filmeja-blue bg-clip-text text-transparent">
                FilmeJá
              </h1>
            ) : (
              <Film className="w-6 h-6 text-filmeja-purple" />
            )}
          </div>
        </div>

        <div className="flex-1">
          <nav className="space-y-1">
            <div className="pb-4">
              <Button
                variant="ghost"
                className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Início"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="w-5 h-5" />
                {isExpanded && (
                  <span className="ml-3 text-sm font-medium">Início</span>
                )}
              </Button>

              {/* <Button
                variant="ghost"
                className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Novidades"
              >
                <Clock className="w-5 h-5" />
                {isExpanded && (
                  <span className="text-sm font-medium">Novidades</span>
                )}
              </Button> */}
            </div>

            <div className="pb-4">
              <Button
                variant="ghost"
                className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Minha Lista"
                onClick={() => navigate('/favorites')}
              >
                <Heart className="w-5 h-5" />
                {isExpanded && (
                  <span className="text-sm font-medium">Minha Lista</span>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Recomendados"
              >
                <Star className="w-5 h-5" />
                {isExpanded && (
                  <span className="text-sm font-medium">Converse com Filmin.AI</span>
                )}
              </Button>
            </div>
          </nav>
        </div>

        <div className="pb-8 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Minha Conta"
            onClick={() => navigate('/profile')}
          >
            <User className="w-5 h-5" />
            {isExpanded && (
              <span className="text-sm font-medium">Minha Conta</span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 group-hover:text-filmeja-purple transition-colors" />
            {isExpanded && (
              <span className="text-sm font-medium group-hover:text-filmeja-purple transition-colors">
                Sair
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}