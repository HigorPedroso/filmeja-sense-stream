
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Pequeno atraso para garantir que o estado de autenticação seja verificado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Se ainda estiver carregando, mostra um spinner
  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-filmeja-dark">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-filmeja-purple"></div>
      </div>
    );
  }
  
  // Se não houver sessão, redireciona para a página de login
  if (!session) {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  // Se houver sessão, renderiza o conteúdo protegido
  return <>{children}</>;
}
