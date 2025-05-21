import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setLoading(false);
          return;
        }

        console.log('Fetched user:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log('Current user:', currentUser);
  console.log('User email:', currentUser?.email);

  if (!currentUser?.email || currentUser.email !== 'higor533@gmail.com') {
    console.log('Access denied. Redirecting...');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};