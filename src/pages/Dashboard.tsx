import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrending } from "@/lib/tmdb";
import { ContentItem, MoodType } from "@/types/movie";
import {
  Film,
  User,
  LogOut,
  Home,
  Star,
  Clock,
  Heart,
  Sparkles,
  X,
  Play,
  Lock,
  Crown,
  Loader2,
  Info,
  Mail, // Add this
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentCarousel from "@/components/ContentCarousel";
import VideoBackground from "@/components/VideoBackground";
import { useToast } from "@/hooks/use-toast";
import MoodSelector from "@/components/MoodSelector";
import GenreSelector from "@/components/GenreSelector";
import AiRecommendationWidget from "@/components/AiRecommendationWidget";
import RandomWheel from "@/components/RandomWheel";
import MoodCarousel from "@/components/MoodCarousel";
import ImageBackground from "@/components/ImageBackground";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import trailerSound from "@/assets/sounds/trailer-whoosh.mp3"; // You'll need to add this sound file
import { Onboarding } from "@/components/Onboarding/Onboarding";
import { supabase } from "@/integrations/supabase/client";
import { ContentModal } from "@/components/ContentModal/ContentModal";
import { AiChat } from "@/components/AiChat/AiChat";
import {
  ContentSuggestion,
  fetchMoodRecommendation as fetchMoodRecommendationService,
  shuffleArray,
  DAILY_FREE_LIMIT,
} from "@/lib/recommendations/fetchMoodRecommendation";
import { showInterstitialAd } from "@/lib/ads";
import { refundDailyView } from "@/lib/recommendations/refundDailyView";
import SpinnerWheel from "@/components/SpinnerWheel";
import { getUserFavorites, FavoriteItem } from "@/lib/favorites";
import StreamingServices from "@/components/StreamingServices";
import { RecommendedByAI } from "@/components/RecommendedByAI/RecommendedByAI";
import HeaderDashboard from "@/components/HeaderDashboard";
import PremiumPaymentModal from "@/components/PremiumPaymentModal";
import TopTrendingList from "@/components/TopMovies/TopMovies";
import { useSearchParams } from "react-router-dom";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { fetchContentWithProviders, searchContentByTitle, pickBestTitleMatch } from "@/lib/utils/tmdb";
import { extractJsonFromResponse } from "@/utils/jsonParser";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { SignupModal } from "@/components/modals/SignupModal";
import { useGoogleAdsPageView } from "@/hooks/useGoogleAds";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock user data - in a real app, this would come from authentication
const mockUser = {
  name: "Gabriel Costa",
  avatar: "https://i.pravatar.cc/150?img=3",
  isPremium: false, // Toggle this to test premium vs non-premium UI
};

const moodNames: Record<MoodType, string> = {
  happy: "feliz",
  sad: "triste",
  excited: "animado",
  relaxed: "relaxado",
  romantic: "romântico",
  scared: "assustado",
  thoughtful: "pensativo",
};

const moodToGenres: Record<string, number[]> = {
  happy: [35, 10402, 12, 16], // Comedy, Musical, Adventure, Animation
  sad: [18, 36, 10749], // Drama, History, Romance
  excited: [28, 878, 10770], // Action, Sci-Fi, TV Movie
  relaxed: [99, 10751], // Documentary, Family
  romantic: [10749, 10402], // Romance, Musical
  scared: [27, 53, 9648], // Horror, Thriller, Mystery
  thoughtful: [18, 878, 9648, 99], // Drama, Sci-Fi, Mystery, Documentary
};

const moodToGenresTV: Record<string, number[]> = {
  happy: [35, 10762, 16], // Comedy, Kids, Animation
  sad: [18, 10768, 10749], // Drama, War & Politics, Romance
  excited: [10759, 9648, 10765], // Action & Adventure, Mystery, Sci-Fi & Fantasy
  relaxed: [99, 10751], // Documentary, Family
  romantic: [10749, 10766], // Romance, Soap
  scared: [9648, 80, 10765], // Mystery, Crime, Sci-Fi & Fantasy (substitui Horror)
  thoughtful: [18, 99, 9648], // Drama, Documentary, Mystery
};

const genreCategories = [
  {
    name: "Ação e Aventura",
    icon: "🎬",
    genres: [
      { id: 28, name: "Ação", color: "bg-red-500/20" },
      { id: 12, name: "Aventura", color: "bg-orange-500/20" },
      { id: 53, name: "Thriller", color: "bg-yellow-500/20" },
    ],
  },
  {
    name: "Drama e Emoção",
    icon: "🎭",
    genres: [
      { id: 18, name: "Drama", color: "bg-blue-500/20" },
      { id: 10749, name: "Romance", color: "bg-pink-500/20" },
      { id: 10751, name: "Família", color: "bg-green-500/20" },
    ],
  },
  {
    name: "Fantasia e Ficção",
    icon: "✨",
    genres: [
      { id: 14, name: "Fantasia", color: "bg-purple-500/20" },
      { id: 878, name: "Ficção Científica", color: "bg-indigo-500/20" },
      { id: 16, name: "Animação", color: "bg-cyan-500/20" },
    ],
  },
  {
    name: "Outros Gêneros",
    icon: "🎪",
    genres: [
      { id: 35, name: "Comédia", color: "bg-yellow-400/20" },
      { id: 27, name: "Terror", color: "bg-red-900/20" },
      { id: 9648, name: "Mistério", color: "bg-violet-500/20" },
    ],
  },
];

const moodEmojis: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  relaxed: "😌",
  romantic: "🥰",
  thoughtful: "🤔",
  energetic: "⚡",
  nostalgic: "🌟",
  adventurous: "🌎",
  mysterious: "🔍",
};

// Cached at module scope so the onboarding check only runs once per app
// launch (right after the splash screen), not every time Dashboard remounts
// from navigating back to it. Resets naturally when the app is restarted.
let onboardingCheckCache: { hasCompletedOnboarding: boolean } | null = null;

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [moodRecommendations, setMoodRecommendations] = useState<ContentItem[]>(
    []
  );
  const {
    showRecommendationModal,
    setShowRecommendationModal,
    moodRecommendation,
    setMoodRecommendation,
    isLoadingRecommendation,
    setIsLoadingRecommendation,
  } = useRecommendationResult();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const isPremium = usePremiumStatus();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showMoodOverlay, setShowMoodOverlay] = useState(false);
  const [isTrailerAnimating, setIsTrailerAnimating] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    onboardingCheckCache?.hasCompletedOnboarding ?? false
  );
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(onboardingCheckCache === null);
  const getMoodName = (mood: MoodType): string => {
    return moodNames[mood] || mood;
  };
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [genre, setGenre] = useState<{ id: number; name: string } | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );
  const [topContent, setTopContent] = useState<ContentItem[]>([]);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [userWatchedMovies, setUserWatchedMovies] = useState<ContentItem[]>([]);
  const [userWatchedSeries, setUserWatchedSeries] = useState<ContentItem[]>([]);
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [onBoardingData, setOnBoardingData] = useState(false);
  const [dailyViews, setDailyViews] = useState(0);
  const [monthlyViews, setMonthlyViews] = useState(0);
  const [isAnonymousUser, setIsAnonymousUser] = useState(false);
  const [showSignupPromptModal, setShowSignupPromptModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState("");
  const { trackConversion } = useGoogleAdsPageView();
  const [showEmailConfirmationDialog, setShowEmailConfirmationDialog] =
    useState(false);

  const [userContentPreference, setUserContentPreference] = useState<
    "movies" | "series" | "both" | null
  >(null);

  useEffect(() => {
    const checkAnonymousUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if user is anonymous by looking at the provider
          const isAnon = user.is_anonymous;
          setIsAnonymousUser(isAnon);

          if (isAnon) {
            console.log("Anonymous user detected");
            handleFirst();

            toast({
              title: "Bem-vindo!",
              description:
                "Você está usando uma conta temporária. Crie uma conta para salvar suas preferências.",
              duration: 6000,
            });
          }
        }
      } catch (error) {
        console.error("Error checking anonymous user status:", error);
      }
    };

    checkAnonymousUser();
  }, [toast]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handleGenreSelect = (selectedGenre: { id: number; name: string }) => {
    setGenre(selectedGenre);
    fetchGenreRecommendation(selectedGenre);
  };

  useEffect(() => {
    const fetchWatchedContent = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: watchedContent } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", user.id);

        if (watchedContent) {
          const movies = [];
          const series = [];

          for (const item of watchedContent) {
            const response = await fetch(
              `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
            );
            const details = await response.json();

            if (item.media_type === "movie") {
              movies.push({ ...details, media_type: "movie", id: item.tmdb_id });
            } else {
              series.push({ ...details, media_type: "tv", id: item.tmdb_id });
            }
          }

          setUserWatchedMovies(movies);
          setUserWatchedSeries(series);
        }
      } catch (error) {
        console.error("Error fetching watched content:", error);
      }
    };

    fetchWatchedContent();
  }, []);

  useEffect(() => {
    const fetchTopContent = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR&page=1`
        );
        const data = await response.json();
        setTopContent(
          data.results.map((item: any) => ({
            ...item,
            media_type: "movie",
          }))
        );
      } catch (error) {
        console.error("Error fetching top content:", error);
      }
    };

    fetchTopContent();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const favorites = await getUserFavorites();
      setUserFavorites(favorites);
    };

    fetchFavorites();
  }, []);

  const handleFavoriteUpdate = async () => {
    const favorites = await getUserFavorites();
    setUserFavorites(favorites);
  };

  useEffect(() => {
    trackConversion("NejPCIvNgswaELyn48kD");
  });

  // Fetch trending content on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const content = await getTrending();
        setTrendingContent(content || []);
      } catch (error) {
        console.error("Error fetching trending content:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os conteúdos populares",
          variant: "destructive",
        });
      }
    };

    fetchTrending();
  }, [toast]);

  useEffect(() => {
    const saveOnboardingData = async () => {
      const onboardingData = localStorage.getItem("onboarding_data");

      if (onboardingData) {
        setOnBoardingData(true);
        try {
          const data = JSON.parse(onboardingData);
          const { error } = await supabase
            .from("user_preferences")
            .insert({
              user_id: data.user_id,
              genres: data.genres,
              content_type: data.content_type,
              languages: data.languages,
              watch_duration: data.watch_duration,
              watch_time: data.watch_time,
              created_at: new Date().toISOString(),
            })
            .select();
        } catch (error) {
          console.error("Error saving onboarding data:", error);
        }
      }
    };

    saveOnboardingData();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const handleMoodSelect = (mood: string) => {
    setGenre(null);
    fetchMoodRecommendationService({
      mood,
      moodNames,
      moodToGenres,
      moodToGenresTV,
      genreCategories,
      userContentPreference,
      recommendationCount,
      setIsLoadingRecommendation,
      setShowRecommendationModal,
      setMoodRecommendation,
    }).catch((error) => {
      if (error.type === "PREMIUM_REQUIRED") {
        setShowPaymentModal(true); // Go straight to the premium paywall
        setDailyViews(error.dailyViews);
        setMonthlyViews(error.monthlyViews);
        toast({
          title: "Limite Atingido",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a recomendação",
          variant: "destructive",
        });
      }
    });
  };

  const handleFirst = async () => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);
    try {
      const onboardingData = localStorage.getItem("onboarding_data");
      if (!onboardingData) {
        throw new Error("Onboarding data not found");
      }

      const onboardingPrefs = JSON.parse(onboardingData);

      const prompt = `
Você é um assistente de recomendação de filmes e séries. 
Responda **apenas em JSON válido** com uma lista de 2 recomendações que **obrigatoriamente** cumpram os critérios abaixo:

1. Estão disponíveis nas principais plataformas de streaming (Netflix, Prime Video, Disney+, HBO Max, Star+)
2. Têm avaliação maior que 8 no TMDb
3. Foram lançadas em 2020 ou depois
4. São do tipo: ${onboardingPrefs.content_type}
5. Devem corresponder a pelo menos UM dos seguintes gêneros: ${onboardingPrefs.genres.join(
        ", "
      )}

Formato obrigatório:
[
  {
    "title": "Nome do título",
    "tmdbId": 12345,
    "description": "Breve descrição com até 250 caracteres",
    "tipo": "movie" ou "tv"
  }
]

A resposta deve conter APENAS o array JSON. Nenhum texto antes ou depois.
`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      const geminiData = await geminiResponse.json();

      const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!raw) throw new Error("Empty response from Gemini");

      const parsedSuggestions = extractJsonFromResponse(raw) || [];
      // Ensure we're working with a properly typed array of ContentSuggestion objects
      const suggestions: ContentSuggestion[] = Array.isArray(parsedSuggestions)
        ? parsedSuggestions.map((suggestion) => ({
            title: String(suggestion.title || ""),
            tmdbId: Number(suggestion.tmdbId || 0),
            description: String(suggestion.description || ""),
            tipo: (suggestion.tipo === "tv" ? "tv" : "movie") as "movie" | "tv",
          }))
        : [];

      if (!suggestions || suggestions.length === 0) {
        throw new Error("No suggestions found");
      }

      const shuffledSuggestions = shuffleArray(suggestions);

      const suggestionsWithCorrectIds = await Promise.all(
        shuffledSuggestions.map(async (suggestion) => {
          try {
            const searchType = suggestion.tipo === "movie" ? "movie" : "tv";
            const searchResponse = await fetch(
              `https://api.themoviedb.org/3/search/${searchType}?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&query=${encodeURIComponent(suggestion.title)}&language=pt-BR`
            );
            const searchData = await searchResponse.json();

            const bestMatch = pickBestTitleMatch(searchData.results || [], suggestion.title);
            if (bestMatch) {
              return {
                ...suggestion,
                tmdbId: bestMatch.id,
              };
            }
            return suggestion;
          } catch (error) {
            console.error("Error searching TMDB:", error);
            return suggestion;
          }
        })
      );

      const availableContent = [];

      for (const suggestion of suggestionsWithCorrectIds) {
        try {
          const [details, videos, similar, providers] = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/videos?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&language=pt-BR`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/similar?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&language=pt-BR`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
            ).then((r) => r.json()),
          ]);

          if (providers.results?.BR?.flatrate) {
            availableContent.push({
              ...details,
              videos: videos.results,
              providers: providers.results?.BR,
              similar: similar.results,
              mediaType: suggestion.tipo,
            });

            if (availableContent.length >= 3) {
              const randomIndex = Math.floor(
                Math.random() * availableContent.length
              );
              setMoodRecommendation(availableContent[randomIndex]);
              break;
            }
          }
        } catch (error) {
          console.error("Error fetching content details:", error);
          continue;
        }
      }

      if (availableContent.length === 0) {
        throw new Error("Nenhum conteúdo disponível encontrado");
      }

      // Select a random recommendation
      const randomIndex = Math.floor(Math.random() * availableContent.length);
      const selectedContent = availableContent[randomIndex];

      setMoodRecommendation(selectedContent);

      localStorage.removeItem("onboarding_data");
    } catch (error) {
      // console.error("Error fetching recommendation:", error);
      // toast({
      //   title: "Erro",
      //   description: "Você já visualizou essa recomendação",
      //   variant: "destructive",
      // });
      setShowRecommendationModal(false);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowPaymentModal(true);
  };

  // Handle logout
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

  // Add this effect to fetch user preferences when component mounts
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("user_preferences")
          .select("content_type")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setUserContentPreference(
            data.content_type === "both"
              ? Math.random() > 0.5
                ? "movies"
                : "series"
              : data.content_type
          );
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, []);

  useEffect(() => {
    // Already checked earlier this app launch — skip re-running it (and
    // re-showing the loading spinner) just because Dashboard remounted.
    if (onboardingCheckCache !== null) {
      setHasCompletedOnboarding(onboardingCheckCache.hasCompletedOnboarding);
      setIsCheckingOnboarding(false);
      return;
    }

    const checkOnboardingStatus = async (): Promise<boolean> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return false;
        }

        // Check if user has visited before
        const { data: visits, error: visitsError } = await supabase
          .from("user_visits")
          .select("visit_count")
          .eq("user_id", user.id)
          .single();

        if (!visits) {
          // First visit - create record and skip onboarding
          const { error: insertError } = await supabase
            .from("user_visits")
            .insert({
              user_id: user.id,
              visit_count: 1,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating visit record:", insertError);
            return false;
          }

          return true; // Skip onboarding on first visit
        }

        // Update existing visit count
        const { error: updateError } = await supabase
          .from("user_visits")
          .upsert({
            user_id: user.id,
            visit_count: visits.visit_count + 1,
            updated_at: new Date().toISOString(),
          })
          .select();

        if (updateError) {
          console.error("Error updating visit count:", updateError);
        }

        // Show onboarding only on second visit when preferences don't exist
        if (visits.visit_count === 1) {
          const { data: preferences, error: prefError } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          return !!preferences;
        }

        return true;
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        return false;
      }
    };

    checkOnboardingStatus().then((completed) => {
      onboardingCheckCache = { hasCompletedOnboarding: completed };
      setHasCompletedOnboarding(completed);
      setIsCheckingOnboarding(false);
    });
  }, []);

  const fetchGenreRecommendation = async (genre: {
    id: number;
    name: string;
  }) => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Same source of truth as usePremiumStatus: profiles.is_premium.
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, is_premium")
        .eq("id", user.id)
        .single();

      if (!profile?.id) throw new Error("Profile not found");

      const isPremium = !!profile.is_premium;

      // Coin bookkeeping: if a coin is spent below but the fetch fails
      // afterward, we refund it in the catch block so a failed recommendation
      // doesn't cost the user one of their free daily queries.
      const today = new Date().toISOString().split("T")[0];
      let coinSpent = false;
      let dailyViewsBeforeSpend = 0;
      let monthlyViewsBeforeSpend = 0;

      if (!isPremium) {
        const { data: viewStats } = await supabase
          .from("user_recommendation_views")
          .select("daily_views, monthly_views, view_date")
          .eq("user_id", user.id)
          .order("view_date", { ascending: false })
          .limit(1)
          .single();

        // Only carry the count over if the last recorded view was today.
        const dailyViews = viewStats?.view_date === today ? (viewStats?.daily_views || 0) : 0;
        const monthlyViews = viewStats?.monthly_views || 0;

        // Só realiza o bloqueio se o usuário NÃO for premium
        if (dailyViews >= DAILY_FREE_LIMIT) {
          setShowPaymentModal(true); // Go straight to the premium paywall
          setDailyViews(dailyViews);
          setMonthlyViews(monthlyViews);
          setShowRecommendationModal(false);
          setIsLoadingRecommendation(false);

          toast({
            title: "Limite Atingido",
            description: `Você atingiu o limite de ${DAILY_FREE_LIMIT} recomendações gratuitas por dia. Assine o plano premium para continuar recebendo recomendações ilimitadas!`,
            variant: "destructive",
          });
          return; // Exit early
        }

        dailyViewsBeforeSpend = dailyViews;
        monthlyViewsBeforeSpend = monthlyViews;
        const newDailyViews = dailyViews + 1;

        await supabase.from("user_recommendation_views").upsert(
          {
            user_id: user.id,
            view_date: today,
            daily_views: newDailyViews,
            monthly_views: monthlyViews + 1,
          },
          {
            onConflict: ["user_id", "view_date"], // <- define os campos únicos
          }
        );
        coinSpent = true;

        // 1st free query of the day is ad-free; 2nd and 3rd show an
        // interstitial ad before the recommendation loads.
        if (newDailyViews >= 2) {
          await showInterstitialAd();
        }
      }

      function extractJsonFromResponse(text: string) {
        try {
          return JSON.parse(text);
        } catch {
          const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch?.[1]) {
            try {
              return JSON.parse(jsonMatch[1].trim());
            } catch {
              const arrayMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
              if (arrayMatch?.[0]) {
                try {
                  return JSON.parse(arrayMatch[0]);
                } catch {
                  console.error("Failed to parse array structure");
                }
              }
            }
          }

          const suggestions = [];
          const matches = text.matchAll(/{[^}]*"title"[^}]*"tmdbId"[^}]*}/g);
          for (const match of matches) {
            try {
              suggestions.push(JSON.parse(match[0]));
            } catch {
              continue;
            }
          }
          return suggestions;
        }
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: recentRecommendations, error: historyError } =
          await supabase
            .from("watch_history")
            .select("title")
            .eq("user_id", user?.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (historyError) {
          console.error("Error fetching watch history:", historyError);
        }

        const recentTitles =
          recentRecommendations?.map((item) => item.title) || [];

        const { data: watchedContent } = await supabase
          .from("watched_content")
          .select("tmdb_id, media_type")
          .eq("user_id", user?.id);

        const watchedDetails = await Promise.all(
          (watchedContent || []).map(async (item) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/${item.media_type}/${
                  item.tmdb_id
                }?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
              );
              const data = await response.json();
              return {
                title: data.title || data.name,
                tmdbId: data.id,
                type: item.media_type,
              };
            } catch (error) {
              console.error("Error fetching TMDB details:", error);
              return null;
            }
          })
        );

        const validWatchedContent = watchedDetails.filter(Boolean);

        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const watched = JSON.parse(
          localStorage.getItem("watchedMovies") || "[]"
        );
        const genreCount: Record<string, number> = {};
        watched.forEach((m: any) =>
          m.genres.forEach((g: string) => {
            genreCount[g] = (genreCount[g] || 0) + 1;
          })
        );

        const topGenres = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([g]) => g);

        const shouldFetchMovies =
          userContentPreference === "movies"
            ? recommendationCount < 2
            : recommendationCount >= 2;
        const mediaType = shouldFetchMovies ? "movie" : "tv";

        const currentYear = new Date().getFullYear();
        const minReleaseYear = currentYear - 5;

        const prompt = `
        Você é um assistente que responde apenas em JSON válido.
        O usuário já assistiu os seguintes títulos:
        ${JSON.stringify(validWatchedContent)}

        Últimas recomendações (não recomendar estes títulos também):
        ${JSON.stringify(recentTitles)}

        Forneça uma lista de 10 ${
          mediaType === "movie" ? "filmes" : "séries"
        } bem avaliados que correspondem ao gênero: ${genre.name}.
        IMPORTANTE: priorize lançamentos recentes — de ${minReleaseYear} até ${currentYear}. Evite indicar clássicos antigos ou títulos muito batidos; a lista deve parecer atual, não uma seleção de "os mais famosos de sempre".
        NÃO INCLUA os títulos que o usuário já assistiu ou que foram recomendados recentemente.
        Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc.

        Responda no seguinte formato JSON:
        [
          { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv", "releaseYear": 2024 }
        ]
        `;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
            import.meta.env.VITE_GEMINI_API_KEY
          }`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        prompt +
                        "\nResponda apenas com o JSON, sem texto adicional.",
                    },
                  ],
                },
              ],
              tools: [{ google_search: {} }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!raw) throw new Error("Resposta vazia do Gemini");

        let suggestions: {
          title: string;
          tmdbId: number;
          description: string;
          urlImg: string;
          tipo: string;
        }[] = extractJsonFromResponse(raw) || [];

        if (suggestions.length > 0) {
          const randomSuggestion =
            suggestions[Math.floor(Math.random() * suggestions.length)];
          await fetchContentDetails(
            randomSuggestion.title,
            randomSuggestion.tipo as "movie" | "tv"
          );
        } else {
          throw new Error("No suggestions found");
        }

        console.log("Sugestões geradas:", suggestions);
      } catch (error) {
        console.error("Erro ao buscar recomendação:", error);
        if (coinSpent) {
          await refundDailyView(user.id, today, dailyViewsBeforeSpend, monthlyViewsBeforeSpend);
        }
        toast({
          title: "Erro",
          description:
            "Não foi possível encontrar conteúdo disponível em streaming",
          variant: "destructive",
        });
        setShowRecommendationModal(false);
      } finally {
        setIsLoadingRecommendation(false);
      }
    } catch (error) {
      console.error("Erro ao buscar recomendação:", error);
      setIsLoadingRecommendation(false);
    }
  };

  const fetchContentDetails = async (title: string, type?: "movie" | "tv") => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);

    try {
      const item = await searchContentByTitle(title, type);
      await fetchContentWithProviders(item, {
        showToast: false,
        onContentFetched: setMoodRecommendation,
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

  const markAsWatched = async (content: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para marcar como assistido",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("watched_content").insert({
        user_id: user.id,
        tmdb_id: content.id || content.tmdbId,
        media_type: content.mediaType,
        title: content.title || content.name,
        watched_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conteúdo marcado como assistido!",
      });

      // Update local state to reflect the change
      setMoodRecommendation((prev) => ({
        ...prev,
        alreadyWatched: true,
      }));
    } catch (error) {
      console.error("Error marking content as watched:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como assistido",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setSignupError("");

    try {
      // Get the anonymous user's ID if they're logged in anonymously

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const isAnon = user.is_anonymous;

      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
            // If they were anonymous, link their preferences
            anonymous_id: isAnon ? user?.id : null,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      // if (data.user) {
      //   const { error: profileError } = await supabase.from("profiles").insert({
      //     id: data.user.id,
      //     full_name: signupName,
      //     created_at: new Date().toISOString(),
      //   });

      //   if (profileError) throw profileError;

      // If they had onboarding data, save it to their preferences
      //   const onboardingData = localStorage.getItem("onboarding_data");
      //   if (onboardingData) {
      //     const prefs = JSON.parse(onboardingData);
      //     const { error: prefError } = await supabase
      //       .from('user_preferences')
      //       .insert({
      //         user_id: data.user.id,
      //         genres: prefs.genres || [],
      //         content_type: prefs.content_type || "both",
      //         watch_duration: prefs.watch_duration || "1h+",
      //         watch_time: prefs.watch_time || "night",
      //       });

      //     if (prefError) console.error("Error saving preferences:", prefError);
      //     localStorage.removeItem("onboarding_data");
      //   }
      // }

      // Show email confirmation toast
      toast({
        title: "Conta criada com sucesso!",
        description:
          "Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada para ativar sua conta.",
        duration: 6000,
      });

      // Show email confirmation dialog
      setShowEmailConfirmationDialog(true);

      setShowSignupModal(false);
      setIsAnonymousUser(false);
      localStorage.removeItem("onboarding_data");
    } catch (error: any) {
      console.error("Signup error:", error);
      setSignupError(error.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleContentTypeChange = (newType: "movies" | "series") => {
    setContentType(newType);
  };

  const renderContentCard = (movie: {
    title: string;
    tmdbId: number;
    description: string;
    urlImg: string;
    tipo: string;
    alreadyWatched?: boolean;
  }) => {
    return (
      <div className="flex flex-col items-center justify-center">
        <img
          src={movie.urlImg}
          alt={movie.title}
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="mt-2">
          <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
          <p className="text-gray-300 text-sm">{movie.description}</p>
        </div>
        {movie.alreadyWatched && (
          <div className="mt-2">
            <span className="text-green-500 text-sm">Assistido</span>
          </div>
        )}
      </div>
    );
  };

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-filmeja-dark flex items-center justify-center">
        <div className="animate-spin">
          <Film className="w-8 h-8 text-filmeja-purple" />
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-filmeja-dark overflow-x-hidden">
      {/* Premium overlay */}
      {/* {!isPremium && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-30 flex flex-col items-center justify-center">
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Acesso Bloqueado
            </h2>
            <p className="text-gray-200 mb-6">
              Ative seu acesso premium por apenas R$9,99 para desbloquear todas
              as funcionalidades do FilmeJá!
            </p>
            <Button
              onClick={handleUpgradeToPremium}
              className="bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white hover:opacity-90 transition-all px-6 py-2 text-lg"
            >
              Ativar Acesso Premium
            </Button>
          </div>
        </div>
      )} */}
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        onLogout={handleLogout}
      />

      <MobileSidebar />

      <ImageBackground
        useSlideshow={true}
        heightClassName="h-[70vh] min-h-[560px] md:h-[80vh] md:min-h-[600px]"
      >
        <div className="flex flex-col h-full">
          <HeaderDashboard user={mockUser} />
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 md:absolute md:inset-0 md:py-0">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 md:mb-12 drop-shadow-lg leading-tight">
              Como você quer descobrir seu próximo filme ou série?
            </h1>

          <div className="flex flex-col gap-3 w-full max-w-sm md:max-w-3xl md:grid md:grid-cols-3 md:gap-4">
            {[
              {
                key: "mood",
                icon: Heart,
                title: "Por Humor",
                subtitle: "Deixe seu clima guiar a escolha",
                color: "purple" as const,
                locked: false,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else {
                    setShowMoodOverlay(true);
                  }
                },
              },
              {
                key: "genre",
                icon: Film,
                title: "Por Gênero",
                subtitle: "Explore por categoria favorita",
                color: "blue" as const,
                locked: false,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else {
                    setShowGenreModal(true);
                  }
                },
              },
              {
                key: "ai",
                icon: Sparkles,
                title: "Filmin.IA",
                subtitle: "Converse e receba sugestões na hora",
                color: "gradient" as const,
                locked: !isPremium,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else if (!isPremium) {
                    toast({
                      title: "Recurso Premium",
                      description:
                        "O Filmin.IA é exclusivo para assinantes premium. Assine para liberar o chat completo!",
                    });
                    setShowPaymentModal(true); // Go straight to the premium paywall
                  } else if (isMobile) {
                    navigate("/filmin-ia");
                  } else {
                    setShowAiChat(true);
                  }
                },
              },
            ].map((action) => (
              <motion.button
                key={action.key}
                onClick={action.onClick}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center gap-4 md:flex-col md:items-start md:gap-4 w-full text-left bg-filmeja-dark/80 hover:bg-filmeja-dark/95 border border-white/15 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-lg shadow-black/20 transition-colors touch-manipulation"
              >
                <div
                  className={`relative flex-shrink-0 w-12 h-12 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${
                    action.color === "purple"
                      ? "bg-filmeja-purple/30"
                      : action.color === "blue"
                      ? "bg-filmeja-blue/30"
                      : "bg-gradient-to-br from-filmeja-purple/60 to-filmeja-blue/60"
                  }`}
                >
                  <action.icon
                    className={`w-6 h-6 md:w-5 md:h-5 ${
                      action.color === "purple"
                        ? "text-filmeja-purple"
                        : action.color === "blue"
                        ? "text-filmeja-blue"
                        : "text-white"
                    }`}
                  />
                  {action.locked && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-filmeja-dark border border-white/20 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{action.title}</h3>
                  <p className="text-sm text-gray-400 truncate md:whitespace-normal">
                    {action.subtitle}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 md:hidden" />
              </motion.button>
            ))}
          </div>
          </div>
        </div>
        {showGenreModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-filmeja-dark/90 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-filmeja-dark/90 py-2">
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Escolha um Gênero
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowGenreModal(false)}
                    className="text-gray-400 hover:text-white p-2 -mr-2"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {genreCategories.map((category) => (
                    <div key={category.name} className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {category.genres.map((genre) => (
                          <motion.button
                            key={genre.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleGenreSelect(genre);
                              setShowGenreModal(false);
                            }}
                            className={`${genre.color} p-4 rounded-xl text-left transition-all
                           hover:bg-opacity-30 border border-white/10 backdrop-blur-sm
                           group relative overflow-hidden`}
                          >
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                           translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"
                            />
                            <span className="text-white font-medium">
                              {genre.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <ContentModal
          isOpen={showRecommendationModal}
          onOpenChange={setShowRecommendationModal}
          content={moodRecommendation}
          isLoading={isLoadingRecommendation}
          onRequestNew={async () => {
            if (genre) {
              await fetchGenreRecommendation(genre);
            } else if (selectedMood) {
              await handleMoodSelect(selectedMood);
            }
          }}
          selectedMood={selectedMood}
          onMarkAsWatched={async (content) => {
            await markAsWatched(content);
            // After marking as watched, automatically fetch next recommendation
            if (genre) {
              await fetchGenreRecommendation(genre);
            } else if (selectedMood) {
              await handleMoodSelect(selectedMood);
            }
          }}
        />

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
                onShowContent={(title, type) => {
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

        {showMoodOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-filmeja-dark/90 to-black/90 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8 md:mb-10">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Como você está se sentindo hoje? ✨
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base">
                      Escolha seu humor e deixe-nos encontrar o filme perfeito
                      para você
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMoodOverlay(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  {Object.entries(moodNames).map(([mood, name]) => (
                    <motion.button
                      key={mood}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedMood(mood as MoodType);
                        handleMoodSelect(mood);
                        setShowMoodOverlay(false);
                      }}
                      className="p-4 rounded-xl transition-all
        bg-white/5 hover:bg-white/10 border border-white/10
        backdrop-blur-sm group relative overflow-hidden
        hover:border-filmeja-purple/50 hover:shadow-lg hover:shadow-filmeja-purple/20
        min-h-[64px] flex items-center"
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-2xl flex-shrink-0">
                          {moodEmojis[mood] || "🎬"}
                        </span>
                        <span className="text-white font-medium text-base md:text-lg truncate">
                          {name}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <PremiumPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            // isPremium now comes from usePremiumStatus's realtime subscription,
            // which picks up the change as soon as the webhook updates the row.
            setShowPaymentModal(false);
            toast({
              title: "Bem-vindo ao Premium!",
              description: "Seu acesso premium foi ativado com sucesso.",
            });
          }}
        />

        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />

        <SignupPromptModal
          isOpen={showSignupPromptModal}
          onClose={() => setShowSignupPromptModal(false)}
          onCreateAccount={() => {
            setShowSignupPromptModal(false);
            setShowSignupModal(true);
          }}
          onContinueWithoutAccount={() => {
            setShowSignupPromptModal(false);
            setShowMoodOverlay(false);
          }}
        />

        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSubmit={handleSignup}
          signupName={signupName}
          setSignupName={setSignupName}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          signupError={signupError}
          isSigningUp={isSigningUp}
        />
      </ImageBackground>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "md:ml-[280px]" : "md:ml-[70px]"
        }`}
      >
        {/* Main content area */}
        <main className="p-6 pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))] md:pb-6">
          <TopTrendingList
            type="movie"
            title="Top 10 Filmes da Semana"
            content={trendingContent
              ?.filter((item) => item.media_type === "movie")
              ?.slice(0, 10)}
            onItemClick={async (item) => {
              if (isAnonymousUser) {
                setShowSignupPromptModal(true);
              } else {
                setShowRecommendationModal(true);

                try {
                  await fetchContentWithProviders(item, {
                    onLoadingChange: setIsLoadingRecommendation,
                    onContentFetched: setMoodRecommendation,
                  });
                } catch {
                  setShowRecommendationModal(false);
                }
              }
            }}
          />

          <TopTrendingList
            type="tv"
            title="Top 10 Séries da Semana"
            content={trendingContent
              ?.filter((item) => item.media_type === "tv")
              ?.slice(0, 10)}
            onItemClick={async (item) => {
              if (isAnonymousUser) {
                setShowSignupPromptModal(true);
              } else {
                setShowRecommendationModal(true);

                try {
                  await fetchContentWithProviders(item, {
                    onLoadingChange: setIsLoadingRecommendation,
                    onContentFetched: setMoodRecommendation,
                  });
                } catch {
                  setShowRecommendationModal(false);
                }
              }
            }}
          />

          {/* <RecommendedByAI 
            watchedContent={[...userWatchedMovies, ...userWatchedSeries]}
            onItemClick={(item) => {
              setMoodRecommendation(item);
              setShowRecommendationModal(true);
            }}
          /> */}

          {userFavorites.length > 0 && (
            <TopTrendingList
              type="movie"
              title="Minha lista"
              showFavorites={true}
              favoriteContent={userFavorites}
              onItemClick={async (item) => {
                // Check if user is anonymous
                if (isAnonymousUser) {
                  setShowSignupPromptModal(true);
                } else {
                  setShowRecommendationModal(true);
                  try {
                    await fetchContentWithProviders(item, {
                      onLoadingChange: setIsLoadingRecommendation,
                      onContentFetched: setMoodRecommendation,
                    });
                  } catch {
                    setShowRecommendationModal(false);
                  }
                }
              }}
              onFavoriteUpdate={handleFavoriteUpdate}
            />
          )}

          {userWatchedMovies.length > 0 && (
            <TopTrendingList
              type="movie"
              title="Filmes Que Você Já Assistiu"
              showWatched={true}
              watchedContent={userWatchedMovies}
              onItemClick={async (item) => {
                setShowRecommendationModal(true);
                try {
                  await fetchContentWithProviders(item, {
                    onLoadingChange: setIsLoadingRecommendation,
                    onContentFetched: setMoodRecommendation,
                  });
                } catch {
                  setShowRecommendationModal(false);
                }
              }}
            />
          )}

          {userWatchedSeries.length > 0 && (
            <TopTrendingList
              type="tv"
              title="Séries Que Você Já Assistiu"
              showWatched={true}
              watchedContent={userWatchedSeries}
              onItemClick={async (item) => {
                setShowRecommendationModal(true);
                try {
                  await fetchContentWithProviders(item, {
                    onLoadingChange: setIsLoadingRecommendation,
                    onContentFetched: setMoodRecommendation,
                  });
                } catch {
                  setShowRecommendationModal(false);
                }
              }}
            />
          )}

          <StreamingServices />

          {/* Mood-based recommendations section */}
          {selectedMood && moodRecommendations.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Para quando você está {getMoodName(selectedMood)}
              </h2>
              <ContentCarousel title="" items={moodRecommendations} />
            </section>
          )}

          <Dialog
            open={showEmailConfirmationDialog}
            onOpenChange={setShowEmailConfirmationDialog}
          >
            <DialogContent className="bg-gradient-to-br from-filmeja-dark to-black border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Mail className="w-6 h-6 text-filmeja-purple" />
                  Verifique seu e-mail
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <p>
                  Enviamos um link de confirmação para{" "}
                  <span className="font-medium text-filmeja-purple">
                    {signupEmail}
                  </span>
                  .
                </p>
                <p>
                  Por favor, verifique sua caixa de entrada e clique no link
                  para ativar sua conta.
                </p>
                <div className="bg-filmeja-purple/10 border border-filmeja-purple/20 rounded-lg p-4 text-sm">
                  <p className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-filmeja-purple flex-shrink-0 mt-0.5" />
                    <span>
                      Se não encontrar o e-mail, verifique sua pasta de spam ou
                      lixo eletrônico.
                    </span>
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setShowEmailConfirmationDialog(false)}
                  className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue"
                >
                  Entendi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

interface AiRecommendationWidgetProps {
  user: {
    name: string;
    avatar: string;
    isPremium: boolean;
  };
}
