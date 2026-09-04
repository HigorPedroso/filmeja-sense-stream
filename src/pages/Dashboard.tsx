import React, { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
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
import { getLocalDateString } from "@/lib/utils/date";
import { trackEvent } from "@/lib/analytics/trackEvent";
import SpinnerWheel from "@/components/SpinnerWheel";
import { getUserFavorites, FavoriteItem } from "@/lib/favorites";
import StreamingServices from "@/components/StreamingServices";
import { RecommendedByAI } from "@/components/RecommendedByAI/RecommendedByAI";
import HeaderDashboard from "@/components/HeaderDashboard";
import PremiumPaymentModal from "@/components/PremiumPaymentModal";
import TopTrendingList from "@/components/TopMovies/TopMovies";
import { useSearchParams, useLocation } from "react-router-dom";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { fetchContentWithProviders, searchContentByTitle, pickBestTitleMatch, describeAiRecommendationError } from "@/lib/utils/tmdb";
import { extractJsonFromResponse } from "@/utils/jsonParser";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { SignupModal } from "@/components/modals/SignupModal";
import { useGoogleAdsPageView } from "@/hooks/useGoogleAds";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { lightImpact } from "@/lib/haptics";
import {
  moodNames,
  moodEmojis,
  moodToGenres,
  moodToGenresTV,
  genreCategories,
} from "@/lib/recommendations/moodGenreData";
import { translateAuthError } from "@/lib/errors/translateAuthError";
import { getTmdbLanguage, getTmdbRegion } from "@/lib/tmdbLanguage";
import { callGeminiForText } from "@/lib/geminiClient";

// Mock user data - in a real app, this would come from authentication
const mockUser = {
  name: "Gabriel Costa",
  avatar: "https://i.pravatar.cc/150?img=3",
  isPremium: false, // Toggle this to test premium vs non-premium UI
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isTrailerAnimating, setIsTrailerAnimating] = useState(false);
  // Display-only — the raw `moodNames` import (Portuguese) is still what
  // feeds the AI prompt and analytics elsewhere in this file; this is
  // purely for the "for when you're feeling X" heading below.
  const getMoodName = (mood: MoodType): string => {
    return t(`mood.${mood}.name`, { defaultValue: moodNames[mood] || mood });
  };
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
              title: t("dashboard.toasts.welcomeAnonymous.title"),
              description: t("dashboard.toasts.welcomeAnonymous.description"),
              duration: 6000,
            });
          }
        }
      } catch (error) {
        console.error("Error checking anonymous user status:", error);
      }
    };

    checkAnonymousUser();
    // t() reads the current language at call time regardless of closure —
    // adding it here would just re-run this auth check on every language
    // switch for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handleGenreSelect = (selectedGenre: { id: number; name: string }) => {
    lightImpact();
    setGenre(selectedGenre);
    trackEvent("genre_selected", { genreId: selectedGenre.id, genreName: selectedGenre.name });
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
              `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=${getTmdbLanguage()}`
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
          }&language=${getTmdbLanguage()}&page=1`
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
          title: t("dashboard.toasts.trendingError.title"),
          description: t("dashboard.toasts.trendingError.description"),
          variant: "destructive",
        });
      }
    };

    fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } else {
        toast({
          title: t("dashboard.toasts.recommendationError.title"),
          description: t("dashboard.toasts.recommendationError.description"),
          variant: "destructive",
        });
      }
    });
  };

  // MoodSelectPage / GenreSelectPage are real pages (not modals — see their
  // own comments for why), so a selection made there arrives back here as
  // router state instead of a direct function call. Clearing the state
  // (replace, no new history entry) stops the same selection re-firing on
  // a later back/forward through this exact history entry.
  //
  // Dashboard remounting fresh (re-fetching trending, watch history, etc.)
  // used to flash the full home screen for a moment before the daily-limit
  // check resolved and either opened the recommendation or the paywall —
  // reads as "it went back to home" even though it's just on the way
  // through. isProcessingSelection swaps that flash for a plain spinner
  // instead, cleared once we know which of the two outcomes it was.
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);

  useEffect(() => {
    const state = location.state as { selectMood?: string; selectGenre?: { id: number; name: string } } | null;
    if (!state?.selectMood && !state?.selectGenre) return;

    setIsProcessingSelection(true);

    if (state.selectMood) {
      setSelectedMood(state.selectMood as MoodType);
      trackEvent("mood_selected", { mood: state.selectMood, moodName: moodNames[state.selectMood as MoodType] });
      handleMoodSelect(state.selectMood);
    } else if (state.selectGenre) {
      handleGenreSelect(state.selectGenre);
    }

    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (isProcessingSelection && (showRecommendationModal || showPaymentModal)) {
      setIsProcessingSelection(false);
    }
  }, [isProcessingSelection, showRecommendationModal, showPaymentModal]);

  const handleFirst = async () => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);
    try {
      const onboardingData = localStorage.getItem("onboarding_data");
      if (!onboardingData) {
        throw new Error("Onboarding data not found");
      }

      const onboardingPrefs = JSON.parse(onboardingData);

      // Gemini's own `description` field never reaches the UI (the real
      // TMDB `overview`, fetched in the user's language, overwrites it
      // below) — this prompt's language only affects the model's own
      // reasoning/search quality, not what gets displayed.
      const onboardingTmdbLang = getTmdbLanguage();
      const onboardingPromptLang: "en" | "es" | "pt" =
        onboardingTmdbLang === "en-US" ? "en" : onboardingTmdbLang === "es-MX" ? "es" : "pt";

      const prompt = onboardingPromptLang === "en" ? `
You are a movie and TV show recommendation assistant.
Reply **only with valid JSON** containing a list of 8 recommendations that **must** meet the criteria below:

1. Available on major streaming platforms (Netflix, Prime Video, Disney+, HBO Max, Star+)
2. Rated higher than 8 on TMDb
3. Released in 2020 or later
4. Type: ${onboardingPrefs.content_type}
5. Must match at least ONE of the following genres: ${onboardingPrefs.genres.join(
        ", "
      )}

Required format:
[
  {
    "title": "Title name",
    "tmdbId": 12345,
    "description": "Short description, up to 250 characters",
    "tipo": "movie" or "tv",
    "releaseYear": 2021
  }
]

"releaseYear" is the title's real release year — important for telling remakes/reboots that reuse the same name apart.
Your response must contain ONLY the JSON array. No text before or after.
` : onboardingPromptLang === "es" ? `
Eres un asistente de recomendación de películas y series.
Responde **solo en JSON válido** con una lista de 8 recomendaciones que **obligatoriamente** cumplan los siguientes criterios:

1. Disponibles en las principales plataformas de streaming (Netflix, Prime Video, Disney+, HBO Max, Star+)
2. Con calificación mayor a 8 en TMDb
3. Estrenadas en 2020 o después
4. Del tipo: ${onboardingPrefs.content_type}
5. Deben coincidir con AL MENOS UNO de los siguientes géneros: ${onboardingPrefs.genres.join(
        ", "
      )}

Formato obligatorio:
[
  {
    "title": "Nombre del título",
    "tmdbId": 12345,
    "description": "Descripción breve, hasta 250 caracteres",
    "tipo": "movie" o "tv",
    "releaseYear": 2021
  }
]

"releaseYear" es el año real de estreno del título — importante para diferenciar remakes/reboots que usan el mismo nombre.
Tu respuesta debe contener SOLO el array JSON. Ningún texto antes o después.
` : `
Você é um assistente de recomendação de filmes e séries.
Responda **apenas em JSON válido** com uma lista de 8 recomendações que **obrigatoriamente** cumpram os critérios abaixo:

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
    "tipo": "movie" ou "tv",
    "releaseYear": 2021
  }
]

"releaseYear" é o ano de lançamento real do título — importante para diferenciar remakes/refilmagens que usam o mesmo nome.
A resposta deve conter APENAS o array JSON. Nenhum texto antes ou depois.
`;

      const raw = await callGeminiForText(prompt);

      const parsedSuggestions = extractJsonFromResponse(raw) || [];
      // Ensure we're working with a properly typed array of ContentSuggestion objects
      const suggestions: ContentSuggestion[] = Array.isArray(parsedSuggestions)
        ? parsedSuggestions.map((suggestion) => ({
            title: String(suggestion.title || ""),
            tmdbId: Number(suggestion.tmdbId || 0),
            description: String(suggestion.description || ""),
            tipo: (suggestion.tipo === "tv" ? "tv" : "movie") as "movie" | "tv",
            releaseYear: Number(suggestion.releaseYear) || undefined,
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
              }&query=${encodeURIComponent(suggestion.title)}&language=${getTmdbLanguage()}`
            );
            const searchData = await searchResponse.json();

            const bestMatch = pickBestTitleMatch(searchData.results || [], suggestion.title, suggestion.releaseYear);
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
              }?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=${getTmdbLanguage()}`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/videos?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&language=${getTmdbLanguage()}`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/similar?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&language=${getTmdbLanguage()}`
            ).then((r) => r.json()),
            fetch(
              `https://api.themoviedb.org/3/${suggestion.tipo}/${
                suggestion.tmdbId
              }/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
            ).then((r) => r.json()),
          ]);

          if (providers.results?.[getTmdbRegion()]?.flatrate) {
            availableContent.push({
              ...details,
              videos: videos.results,
              providers: providers.results?.[getTmdbRegion()],
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
        title: t("dashboard.toasts.loggingOut.title"),
        description: t("dashboard.toasts.loggingOut.description"),
      });

      navigate("/");
    } catch (error) {
      toast({
        title: t("dashboard.toasts.logoutError.title"),
        description: t("dashboard.toasts.logoutError.description"),
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

  const fetchGenreRecommendation = async (genre: {
    id: number;
    name: string;
  }) => {
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
      const today = getLocalDateString();
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

        // Só realiza o bloqueio se o usuário NÃO for premium. Nothing has
        // opened yet at this point (the loading UI only opens below, once
        // we know the user isn't blocked) — go straight to the paywall,
        // nothing to navigate away from first. (Opening the loading UI any
        // earlier meant navigating to the recommendation screen and then
        // immediately back out to the paywall on this exact path — those
        // two navigations could race and drop the paywall entirely.)
        if (dailyViews >= DAILY_FREE_LIMIT) {
          setShowPaymentModal(true); // Go straight to the premium paywall
          setDailyViews(dailyViews);
          setMonthlyViews(monthlyViews);
          return;
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

        // Now that the user is confirmed not blocked, open the loading UI —
        // before the interstitial ad and the recommendation fetch below,
        // which together can take a while.
        setIsLoadingRecommendation(true);
        setShowRecommendationModal(true);

        // 1st free query of the day is ad-free; 2nd and 3rd show an
        // interstitial ad before the recommendation loads.
        if (newDailyViews >= 2) {
          await showInterstitialAd();
        }
      } else {
        setIsLoadingRecommendation(true);
        setShowRecommendationModal(true);
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
                }?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=${getTmdbLanguage()}`
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
        // The genre id/name pair passed through navigation state stays the
        // original Portuguese business value (see GenreSelectPage.tsx) —
        // this is purely the display name for the *current* UI language,
        // used only so the prompt reads as one consistent language instead
        // of mixing an English sentence with a Portuguese genre word.
        const genreDisplayName = t(`genre.${genre.id}`, { defaultValue: genre.name });
        const tmdbLang = getTmdbLanguage();
        const promptLang: "en" | "es" | "pt" = tmdbLang === "en-US" ? "en" : tmdbLang === "es-MX" ? "es" : "pt";

        const prompt = promptLang === "en" ? `
        You are an assistant that responds only in valid JSON.
        The user has already watched the following titles:
        ${JSON.stringify(validWatchedContent)}

        Recent recommendations (do not recommend these titles again):
        ${JSON.stringify(recentTitles)}

        Provide a list of 15 well-rated ${
          mediaType === "movie" ? "movies" : "TV shows"
        } that match the genre: ${genreDisplayName}.
        IMPORTANT: prioritize recent releases — from ${minReleaseYear} to ${currentYear}. Avoid old classics or overused picks; the list should feel current, not a "most famous of all time" selection.
        DO NOT INCLUDE titles the user has already watched or that were recently recommended.
        Must be available on major streaming services: Netflix, Max, Amazon Prime Video, Disney, etc.

        Respond in the following JSON format:
        [
          { "title": "Title", "tmdbId": 12345, "description": "Movie or show description", "imgUrl": "image url", "tipo": "movie or tv", "releaseYear": 2024 }
        ]
        ` : promptLang === "es" ? `
        Eres un asistente que responde solo en JSON válido.
        El usuario ya vio los siguientes títulos:
        ${JSON.stringify(validWatchedContent)}

        Recomendaciones recientes (no recomiendes estos títulos de nuevo):
        ${JSON.stringify(recentTitles)}

        Dame una lista de 15 ${
          mediaType === "movie" ? "películas" : "series"
        } bien calificadas que coincidan con el género: ${genreDisplayName}.
        IMPORTANTE: prioriza estrenos recientes — de ${minReleaseYear} a ${currentYear}. Evita clásicos antiguos o elecciones muy repetidas; la lista debe sentirse actual, no una selección de "los más famosos de todos los tiempos".
        NO INCLUYAS títulos que el usuario ya vio o que fueron recomendados recientemente.
        Debe estar disponible en los principales servicios de streaming: Netflix, Max, Amazon Prime Video, Disney, etc.

        Responde en el siguiente formato JSON:
        [
          { "title": "Título", "tmdbId": 12345, "description": "Descripción de la película o serie", "imgUrl": "url de la imagen", "tipo": "movie o tv", "releaseYear": 2024 }
        ]
        ` : `
        Você é um assistente que responde apenas em JSON válido.
        O usuário já assistiu os seguintes títulos:
        ${JSON.stringify(validWatchedContent)}

        Últimas recomendações (não recomendar estes títulos também):
        ${JSON.stringify(recentTitles)}

        Forneça uma lista de 15 ${
          mediaType === "movie" ? "filmes" : "séries"
        } bem avaliados que correspondem ao gênero: ${genreDisplayName}.
        IMPORTANTE: priorize lançamentos recentes — de ${minReleaseYear} até ${currentYear}. Evite indicar clássicos antigos ou títulos muito batidos; a lista deve parecer atual, não uma seleção de "os mais famosos de sempre".
        NÃO INCLUA os títulos que o usuário já assistiu ou que foram recomendados recentemente.
        Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc.

        Responda no seguinte formato JSON:
        [
          { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv", "releaseYear": 2024 }
        ]
        `;

        const promptSuffix =
          promptLang === "en"
            ? "\nRespond only with the JSON, no additional text."
            : promptLang === "es"
              ? "\nResponde únicamente con el JSON, sin texto adicional."
              : "\nResponda apenas com o JSON, sem texto adicional.";

        const raw = await callGeminiForText(prompt + promptSuffix);

        const suggestions: {
          title: string;
          tmdbId: number;
          description: string;
          urlImg: string;
          tipo: string;
          releaseYear?: number;
        }[] = extractJsonFromResponse(raw) || [];

        if (suggestions.length === 0) {
          throw new Error("No suggestions found");
        }

        // Try candidates in random order until one actually has region
        // streaming availability, instead of picking a single random title
        // and giving up outright if just that one isn't available — that
        // threw away the other candidates Gemini already gave us for free.
        let found = false;
        for (const candidate of shuffleArray(suggestions)) {
          try {
            const item = await searchContentByTitle(
              candidate.title,
              candidate.tipo as "movie" | "tv",
              candidate.releaseYear
            );
            await fetchContentWithProviders(item, {
              showToast: false,
              requireRegionAvailability: true,
              onContentFetched: (fetchedContent) => {
                setMoodRecommendation(fetchedContent);
                trackEvent("recommendation_generated", {
                  source: "genre",
                  tmdbId: fetchedContent.id,
                  title: fetchedContent.title || fetchedContent.name,
                });
              },
            });
            found = true;
            break;
          } catch (candidateError) {
            console.error("Genre candidate unavailable:", candidate.title, candidateError);
          }
        }

        if (!found) {
          throw new Error("Nenhum conteúdo disponível encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar recomendação:", error);
        if (coinSpent) {
          await refundDailyView(user.id, today, dailyViewsBeforeSpend, monthlyViewsBeforeSpend);
        }
        toast({
          title: t("dashboard.toasts.genreRecommendationError.title"),
          description: t("dashboard.toasts.genreRecommendationError.description"),
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

  const fetchContentDetails = async (title: string, type?: "movie" | "tv", releaseYear?: number) => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);

    try {
      const item = await searchContentByTitle(title, type, releaseYear);
      await fetchContentWithProviders(item, {
        showToast: false,
        requireRegionAvailability: true,
        onContentFetched: (fetchedContent) => {
          setMoodRecommendation(fetchedContent);
          trackEvent("recommendation_generated", {
            source: genre ? "genre" : "filmin_ia",
            tmdbId: fetchedContent.id,
            title: fetchedContent.title || fetchedContent.name,
          });
        },
      });
    } catch (error) {
      console.error("Error fetching content details:", error);
      toast({ ...describeAiRecommendationError(error), variant: "destructive" });
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
          title: t("dashboard.toasts.watchedRequiresLogin.title"),
          description: t("dashboard.toasts.watchedRequiresLogin.description"),
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
        title: t("dashboard.toasts.watchedSuccess.title"),
        description: t("dashboard.toasts.watchedSuccess.description"),
      });

      // Update local state to reflect the change
      setMoodRecommendation((prev) => ({
        ...prev,
        alreadyWatched: true,
      }));
    } catch (error) {
      console.error("Error marking content as watched:", error);
      toast({
        title: t("dashboard.toasts.watchedError.title"),
        description: t("dashboard.toasts.watchedError.description"),
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
        title: t("dashboard.toasts.signupSuccess.title"),
        description: t("dashboard.toasts.signupSuccess.description"),
        duration: 6000,
      });

      // Show email confirmation dialog
      setShowEmailConfirmationDialog(true);

      setShowSignupModal(false);
      setIsAnonymousUser(false);
      localStorage.removeItem("onboarding_data");
    } catch (error: any) {
      console.error("Signup error:", error);
      setSignupError(translateAuthError(error, t("dashboard.toasts.signupErrorFallback")));
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

  if (isProcessingSelection) {
    return (
      <div className="min-h-screen bg-filmeja-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Film className="w-8 h-8 text-filmeja-purple" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-filmeja-dark">
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
              {t("dashboard.heroTitle")}
            </h1>

          <div className="flex flex-col gap-3 w-full max-w-sm md:max-w-3xl md:grid md:grid-cols-3 md:gap-4">
            {[
              {
                key: "mood",
                icon: Heart,
                title: t("dashboard.actions.mood.title"),
                subtitle: t("dashboard.actions.mood.subtitle"),
                color: "purple" as const,
                locked: false,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else {
                    navigate("/mood-select");
                  }
                },
              },
              {
                key: "genre",
                icon: Film,
                title: t("dashboard.actions.genre.title"),
                subtitle: t("dashboard.actions.genre.subtitle"),
                color: "blue" as const,
                locked: false,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else {
                    navigate("/genre-select");
                  }
                },
              },
              {
                key: "ai",
                icon: Sparkles,
                title: t("dashboard.actions.ai.title"),
                subtitle: t("dashboard.actions.ai.subtitle"),
                color: "gradient" as const,
                locked: !isPremium,
                onClick: () => {
                  if (isAnonymousUser) {
                    setShowSignupPromptModal(true);
                  } else if (!isPremium) {
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
                conversationId="desktop"
                onShowContent={(title, type, releaseYear) => {
                  setShowAiChat(false);
                  fetchContentDetails(title, type, releaseYear);
                }}
                watchedContent={[...userWatchedMovies, ...userWatchedSeries]}
                userId={currentUser?.id}
                userName={currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name}
              />
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
              title: t("dashboard.toasts.premiumWelcome.title"),
              description: t("dashboard.toasts.premiumWelcome.description"),
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
            title={t("dashboard.sections.topMoviesWeek")}
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
            title={t("dashboard.sections.topSeriesWeek")}
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
              title={t("dashboard.sections.myList")}
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
              title={t("dashboard.sections.moviesWatched")}
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
              title={t("dashboard.sections.seriesWatched")}
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
                {t("dashboard.sections.forWhenYouAre", { mood: getMoodName(selectedMood) })}
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
                  {t("dashboard.emailConfirmDialog.title")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <p>
                  <Trans
                    i18nKey="dashboard.emailConfirmDialog.sentTo"
                    values={{ email: signupEmail }}
                    components={{ email: <span className="font-medium text-filmeja-purple" /> }}
                  />
                </p>
                <p>{t("dashboard.emailConfirmDialog.checkInbox")}</p>
                <div className="bg-filmeja-purple/10 border border-filmeja-purple/20 rounded-lg p-4 text-sm">
                  <p className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-filmeja-purple flex-shrink-0 mt-0.5" />
                    <span>{t("dashboard.emailConfirmDialog.spamNote")}</span>
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setShowEmailConfirmationDialog(false)}
                  className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue"
                >
                  {t("dashboard.emailConfirmDialog.gotIt")}
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
