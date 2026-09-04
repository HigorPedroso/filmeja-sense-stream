import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import MoodSelection from "./pages/MoodSelection";
import ContentDetails from "./pages/ContentDetails";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Welcome, { WELCOME_SEEN_KEY } from "./pages/Welcome";
import RecommendationResult from "./pages/RecommendationResult";
import MoodSelectPage from "./pages/MoodSelectPage";
import GenreSelectPage from "./pages/GenreSelectPage";
import FilminChat from "./pages/FilminChat";
import FilminConversations from "./pages/FilminConversations";
import Premium from "./pages/Premium";
import { RecommendationResultProvider } from "./hooks/useRecommendationResult";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { FavoritesPage } from "./pages/FavoritesPage";
import { useState, useEffect } from "react";
import SuperDashboard from "./pages/SuperDashboard";
import { ProfilePage } from "./pages/Profile";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeleteAccountRequest from "./pages/DeleteAccountRequest";
import Contact from "./pages/Contact";
import { BlogPost } from "./pages/BlogPost";
import { BlogPostView } from "./pages/BlogPostView";
import { AdminRoute } from "./components/AdminRoute";
import BlogPage from "./pages/BlogPage";
import { HelmetProvider } from "react-helmet-async";
import { getUserFavorites } from "./lib/favorites";
import { useGoogleAds } from './hooks/useGoogleAds';
import { StoriesIndex } from "./pages/StoriesIndex";
import { AmpStoryPage } from "./pages/AmpStoryPage";
import { useCapacitorBackButton } from "./hooks/useCapacitorBackButton";
import { useRecommendationNavigation } from "./hooks/useRecommendationNavigation";
import { useDetailsBannerAd } from "./hooks/useDetailsBannerAd";
import { useTitleViewedTracking } from "./hooks/useTitleViewedTracking";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { StatusBarScrim } from "./components/StatusBarScrim";
import { NavigationBarScrim } from "./components/NavigationBarScrim";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "@capacitor-community/safe-area";
import { SplashScreen } from "@capacitor/splash-screen";
import { initializeAds } from "./lib/ads";
import { trackEvent } from "./lib/analytics/trackEvent";
import { initializePurchases } from "./lib/purchases";
import { useSyncPurchasesAuth } from "./hooks/useSyncPurchasesAuth";
import { useSyncProfileLanguage } from "./hooks/useSyncProfileLanguage";
import { useTranslation } from "react-i18next";

// Extend the Window interface to include fbq and _fbq
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}


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

  // Once per app launch (not per navigation) — fires as soon as auth
  // resolves; trackEvent() itself no-ops silently if there's no logged-in
  // user yet.
  useEffect(() => {
    trackEvent("app_opened");
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    SafeArea.setSystemBarsStyle({ style: "DARK" }).catch(() => {});
    SplashScreen.hide().catch(() => {});
    initializeAds();
    initializePurchases();
  }, []);

  useEffect(() => {
    // Facebook Pixel Script
    !(function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    // @ts-ignore
    window.fbq && window.fbq("init", "1904038070390906");
    // @ts-ignore
    window.fbq && window.fbq("track", "PageView");
  }, []);

  return (
    <>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <RecommendationResultProvider>
                  <AppContent favoriteItems={favoriteItems} />
                </RecommendationResultProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
      {/* Facebook Pixel noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1282172123633625&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
};

const AppContent = ({ favoriteItems }) => {
  const { t } = useTranslation();
  useGoogleAds(); // Move the hook here, inside Router context
  useCapacitorBackButton();
  useRecommendationNavigation();
  useDetailsBannerAd();
  useTitleViewedTracking();
  usePushNotifications();
  useSyncPurchasesAuth();
  useSyncProfileLanguage();

  // On the native app, open straight into the user's dashboard instead of the
  // marketing landing page — but the very first time ever (before login),
  // show the welcome intro first. Gated purely on-device (see Welcome.tsx),
  // same reasoning as the taste-preferences questionnaire's gate: this has
  // nothing to do with the user's account, only with this install.
  const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY) === "true";
  const homeElement = Capacitor.isNativePlatform() ? (
    hasSeenWelcome ? (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ) : (
      <Welcome />
    )
  ) : (
    <Index />
  );

  return (
    <>
      <StatusBarScrim />
      <NavigationBarScrim />
      <Routes>
      <Route path="/" element={homeElement} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/mood" element={<MoodSelection />} />
      <Route path="/details/:type/:id" element={<ContentDetails />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/excluir-conta" element={<DeleteAccountRequest />} />
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
        path="/recomendacao"
        element={
          <ProtectedRoute>
            <RecommendationResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mood-select"
        element={
          <ProtectedRoute>
            <MoodSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/genre-select"
        element={
          <ProtectedRoute>
            <GenreSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/filmin-ia"
        element={
          <ProtectedRoute>
            <FilminConversations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/filmin-ia/:conversationId"
        element={
          <ProtectedRoute>
            <FilminChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <Premium />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage
              title={t("dashboard.sections.myList")}
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

      <Route path="/blog/:slug" element={<BlogPostView />} />
      <Route path="/stories" element={<StoriesIndex />} />
      <Route path="/stories/:slug" element={<AmpStoryPage />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
