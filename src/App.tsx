import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import MoodSelection from "./pages/MoodSelection";
import ContentDetails from "./pages/ContentDetails";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { FavoritesPage } from "./pages/FavoritesPage";
import { getUserFavorites } from "@/lib/favorites";
import { useState, useEffect } from "react";
import SuperDashboard from "./pages/SuperDashboard";
import { ProfilePage } from "./pages/Profile";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import { BlogPost } from "./pages/BlogPost";
import { BlogPostView } from "./pages/BlogPostView";
import { AdminRoute } from "./components/AdminRoute";
import BlogPage from "./pages/BlogPage";
import { HelmetProvider } from "react-helmet-async";
import { Sitemap } from "./pages/Sitemap";


const queryClient = new QueryClient();

const App = () => {
  const [favoriteItems, setFavoriteItems] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const favorites = await getUserFavorites();
      setFavoriteItems(favorites);
    };

    fetchFavorites();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/mood" element={<MoodSelection />} />
                <Route path="/details/:type/:id" element={<ContentDetails />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage
                        title="Minha lista"
                        items={favoriteItems}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                {/* SuperDashboard admin routes */}
                <Route
                  path="/super"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/users"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/analytics"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/recommendations"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/calendar"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/messages"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/finances"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/settings"
                  element={
                    <AdminRoute>
                      <SuperDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/blog/new"
                  element={
                    <AdminRoute>
                      <BlogPost />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/super/blog/edit/:id"
                  element={
                    <AdminRoute>
                      <BlogPost />
                    </AdminRoute>
                  }
                />

                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/blog/:slug" element={<BlogPostView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
