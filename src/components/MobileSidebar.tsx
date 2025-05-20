
import React, { useState } from "react";
import { 
  Menu,
  X,
  Home,
  Film,
  UserCircle,
  Heart,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast({
        title: "Saindo...",
        description: "Você foi desconectado com sucesso",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="md:hidden">
      {/* Menu button */}
      <Button
        onClick={toggleMenu}
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-filmeja-dark/70 backdrop-blur-md rounded-full"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={toggleMenu}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed right-0 top-0 bottom-0 w-64 z-50 bg-filmeja-dark border-l border-white/10"
            >
              <div className="flex flex-col h-full p-5">
                <div className="flex-1 py-8">
                  <nav className="space-y-6">
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                      onClick={toggleMenu}
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-lg">Início</span>
                    </Link>

                    <Link
                      to="/explore"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                      onClick={toggleMenu}
                    >
                      <Film className="h-5 w-5" />
                      <span className="text-lg">Explorar</span>
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                      onClick={toggleMenu}
                    >
                      <UserCircle className="h-5 w-5" />
                      <span className="text-lg">Perfil</span>
                    </Link>

                    <Link
                      to="/favorites"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                      onClick={toggleMenu}
                    >
                      <Heart className="h-5 w-5" />
                      <span className="text-lg">Favoritos</span>
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
                      onClick={toggleMenu}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-lg">Configurações</span>
                    </Link>
                  </nav>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="flex items-center space-x-3 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-lg">Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
