
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-filmeja-dark">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-filmeja-purple"></div>
    </div>;
  }
  
  if (!session) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
}
