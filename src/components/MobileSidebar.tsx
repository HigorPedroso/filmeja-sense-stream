import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Heart, Star, User, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AiChat } from "./AiChat/AiChat";
import { supabase } from "@/integrations/supabase/client";
import { ContentModal } from "@/components/ContentModal/ContentModal"; // Add this import at the top
import PremiumPaymentModal from "@/components/PremiumPaymentModal"; // Add this import

export function MobileSidebar() {
  const navigate = useNavigate();
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userWatchedMovies, setUserWatchedMovies] = useState([]);
  const [userWatchedSeries, setUserWatchedSeries] = useState([]);
  const [moodRecommendation, setMoodRecommendation] = useState<any>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Check premium status
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();
        setIsPremium(!!profile?.is_premium);
      }
    };
    fetchUser();
  }, []);

  const fetchContentDetails = async (title: string, type?: "movie" | "tv") => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);

    try {
      // Try searching in both movies and TV shows if type is not specified
      const cleanTitle = title
        .replace(/^("|'|`)|("|'|`)$/g, "") // Remove quotes
        .replace(/^.*?recomendo\s+/i, "") // Remove "recomendo" and text before it
        .replace(/^.*?sugiro\s+/i, "") // Remove "sugiro" and text before it
        .split(".")[0] // Take only the first sentence
        .split("(")[0] // Remove anything in parentheses
        .trim();

      console.log("Searching for title:", cleanTitle);

      let searchResults = [];

      if (!type) {
        // Search in both movies and TV shows
        const [movieSearch, tvSearch] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&query=${encodeURIComponent(title)}&language=pt-BR`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&query=${encodeURIComponent(title)}&language=pt-BR`
          ).then((r) => r.json()),
        ]);

        searchResults = [
          ...(movieSearch.results || []).map((r) => ({
            ...r,
            mediaType: "movie",
          })),
          ...(tvSearch.results || []).map((r) => ({ ...r, mediaType: "tv" })),
        ];
      } else {
        // Search in specified type only
        const searchResponse = await fetch(
          `https://api.themoviedb.org/3/search/${type}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&query=${encodeURIComponent(title)}&language=pt-BR`
        );
        const searchData = await searchResponse.json();
        searchResults = (searchData.results || []).map((r) => ({
          ...r,
          mediaType: type,
        }));
      }

      // Sort by popularity and get the most relevant result
      const content = searchResults.sort(
        (a, b) => b.popularity - a.popularity
      )[0];

      if (!content) {
        throw new Error(`No results found for: ${title}`);
      }

      const contentType = content.mediaType || type || "movie";
      const contentId = content.id;

      // Fetch additional details
      const [details, videos, similar, providers] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/${contentType}/${contentId}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((r) => r.json()),
        fetch(
          `https://api.themoviedb.org/3/${contentType}/${contentId}/videos?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((r) => r.json()),
        fetch(
          `https://api.themoviedb.org/3/${contentType}/${contentId}/similar?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((r) => r.json()),
        fetch(
          `https://api.themoviedb.org/3/${contentType}/${contentId}/watch/providers?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }`
        ).then((r) => r.json()),
      ]);

      setMoodRecommendation({
        ...details,
        videos: videos.results,
        providers: providers.results?.BR,
        similar: similar.results,
        mediaType: contentType,
      });
    } catch (error) {
      console.error("Error fetching content details:", error);
      toast({
        title: "Conteúdo não encontrado",
        description: "Não foi possível encontrar o título especificado",
        variant: "destructive",
      });
      setShowRecommendationModal(false);
    }

    setIsLoadingRecommendation(false);
  };

  return (
    <>
    {showAiChat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                onClick={() => setShowAiChat(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <AiChat
              onShowContent={async (title, type) => {
                setShowAiChat(false);
                fetchContentDetails(title, type);
              }}
              watchedContent={[...userWatchedMovies, ...userWatchedSeries]}
              userAvatar={currentUser?.user_metadata?.avatar_url}
              userId={currentUser?.id}
            />
          </motion.div>
        </div>
      )}

      {moodRecommendation && (
        <ContentModal
          isOpen={showRecommendationModal}
          onOpenChange={setShowRecommendationModal}
          content={moodRecommendation}
          isLoading={isLoadingRecommendation}
          onMarkAsWatched={async (content) => {
            // You can implement this if needed
            console.log("Mark as watched:", content);
          }}
        />
      )}

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
          onClick={() => {
            if (!isPremium) {
              setShowPremiumModal(true);
            } else {
              setShowAiChat(true);
            }
          }}
        >
          <MessageSquare className="w-5 h-5" />
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

      <PremiumPaymentModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={() => {
          setIsPremium(true);
          setShowPremiumModal(false);
        }}
      />
    </div>
    
    </>
    
  );
}