import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrending, getRecommendationsByMood } from "@/lib/tmdb";
import { ContentItem, MoodType } from "@/types/movie";
import {
  Film,
  User,
  LogOut,
  BookOpen,
  Home,
  Star,
  Clock,
  Heart,
  Sparkles,
  X,
  Play, // Add this
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import trailerSound from "@/assets/sounds/trailer-whoosh.mp3"; // You'll need to add this sound file
import { Onboarding } from "@/components/Onboarding/Onboarding";
import { supabase } from "@/integrations/supabase/client";
import { ContentModal } from "@/components/ContentModal/ContentModal";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [moodRecommendations, setMoodRecommendations] = useState<ContentItem[]>(
    []
  );
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [moodRecommendation, setMoodRecommendation] = useState<any>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [isPremium, setIsPremium] = useState(mockUser.isPremium);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showMoodOverlay, setShowMoodOverlay] = useState(false);
  const [isTrailerAnimating, setIsTrailerAnimating] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const getMoodName = (mood: MoodType): string => {
    return moodNames[mood] || mood;
  };
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [genre, setGenre] = useState<{ id: number; name: string } | null>(null);

  const handleGenreSelect = (selectedGenre: { id: number; name: string }) => {
    setGenre(selectedGenre);
    fetchGenreRecommendation(selectedGenre);
  };

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

  const handleMoodSelect = (mood: string) => {
    setGenre(null);
    fetchMoodRecommendation(mood);
  };

  // Handle upgrade to premium
  const handleUpgradeToPremium = () => {
    // Here you would redirect to Stripe payment
    toast({
      title: "Redirecionando para pagamento",
      description: "Você será redirecionado para a página de pagamento",
    });
    // For demo purposes, let's toggle the premium status
    setIsPremium(true);
  };

  // Handle logout
  const handleLogout = () => {
    toast({
      title: "Saindo...",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/");
  };

  const [recommendationCount, setRecommendationCount] = useState(0);
  const [userContentPreference, setUserContentPreference] = useState<
    "movies" | "series" | null
  >(null);

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

  const fetchMoodRecommendation = async (mood: string) => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);

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
      const { data: { user } } = await supabase.auth.getUser();
  
      // Fetch watched content from Supabase
      const { data: watchedContent } = await supabase
        .from("watched_content")
        .select("tmdb_id, media_type")
        .eq("user_id", user?.id);
  
      // Fetch details for watched content
      const watchedDetails = await Promise.all(
        (watchedContent || []).map(async (item) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&language=pt-BR`
            );
            const data = await response.json();
            return {
              title: data.title || data.name,
              tmdbId: data.id,
              type: item.media_type
            };
          } catch (error) {
            console.error("Error fetching TMDB details:", error);
            return null;
          }
        })
      );
  
      const validWatchedContent = watchedDetails.filter(Boolean);
  
      // Determine content type
      const shouldFetchMovies = userContentPreference === "movies" ? recommendationCount < 2 : recommendationCount >= 2;
      const mediaType = shouldFetchMovies ? "movie" : "tv";
  
      // Get genres for the mood
      const genres = mediaType === "movie" ? moodToGenres[mood] : moodToGenresTV[mood];
      const genreNames = genres.map(id => genreCategories.flatMap(cat => cat.genres).find(g => g.id === id)?.name).filter(Boolean);
  
      // Generate Gemini prompt
      const prompt = `
      Você é um assistente que responde apenas em JSON válido. 
      O usuário está se sentindo "${moodNames[mood as MoodType]}" e gosta dos seguintes gêneros: ${genreNames.join(", ")}.
      O usuário já assistiu os seguintes títulos:
      ${JSON.stringify(validWatchedContent)}
  
      Forneça uma lista de 50 ${mediaType === "movie" ? "filmes" : "séries"} que são muito populares, bem avaliados e correspondem ao humor do usuário.
      NÃO INCLUA os títulos que o usuário já assistiu.
      Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc. 
      
      Responda no seguinte formato JSON:
      [
        { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv" }
      ]
      `;
  
      // Send to Gemini
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: prompt + "\nResponda apenas com o JSON, sem texto adicional." 
              }] 
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      );
  
      // Process Gemini response and continue with existing logic
      const geminiData = await geminiResponse.json();
      const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (!raw) throw new Error("Resposta vazia do Gemini");
  
      let suggestions = extractJsonFromResponse(raw) || [];
  
      const suggestionsWithCorrectIds = await Promise.all(
        suggestions.map(async (suggestion) => {
          try {
            const searchType = suggestion.tipo === "movie" ? "movie" : "tv";
            const searchResponse = await fetch(
              `https://api.themoviedb.org/3/search/${searchType}?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&query=${encodeURIComponent(suggestion.title)}&language=pt-BR`
            );
            const searchData = await searchResponse.json();
            
            if (searchData.results && searchData.results.length > 0) {
              return {
                ...suggestion,
                tmdbId: searchData.results[0].id,
              };
            }
            return suggestion;
          } catch (error) {
            console.error("Error searching TMDB:", error);
            return suggestion;
          }
        })
      );

      let content = null;
  let providers = null;
  let details, videos, similar;

  for (const suggestion of suggestionsWithCorrectIds) {
    try {
      const providerRes = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
      );
      const providerJson = await providerRes.json();
      const br = providerJson.results.BR;

      if (br && (br.flatrate?.length > 0 || br.free?.length > 0 || br.ads?.length > 0)) {
        [details, videos, similar] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/similar?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
        ]);

        content = suggestion;
        providers = br;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!content && suggestionsWithCorrectIds.length > 0) {
    content = suggestionsWithCorrectIds[0];
    [details, videos, similar] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
      ).then((r) => r.json()),
      fetch(
        `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
      ).then((r) => r.json()),
      fetch(
        `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}/similar?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
      ).then((r) => r.json()),
    ]);
  }

  if (!content) {
    throw new Error("No content found");
  }

  setMoodRecommendation({
    ...content,
    ...details,
    overview: details.overview || content.description,
    poster_path: content.imgUrl || details.poster_path,
    videos: videos.results,
    providers,
    similar: similar.results,
    mediaType,
  });

  setRecommendationCount((prev) => (prev + 1) % 3);
  setIsLoadingRecommendation(false);

    } catch (error) {
      console.error("Error fetching recommendation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível encontrar conteúdo disponível em streaming",
        variant: "destructive",
      });
      setShowRecommendationModal(false);
      setIsLoadingRecommendation(false);
    }
  };

  const fetchGenreRecommendation = async (genre: { id: number, name: string }) => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);
  
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
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch watched content from Supabase
      const { data: watchedContent } = await supabase
      .from("watched_content")
      .select("tmdb_id, media_type")
      .eq("user_id", user?.id);

    // Fetch details for each watched content from TMDB
    const watchedDetails = await Promise.all(
      (watchedContent || []).map(async (item) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=pt-BR`
          );
          const data = await response.json();
          return {
            title: data.title || data.name,
            tmdbId: data.id,
            type: item.media_type
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

      const watched = JSON.parse(localStorage.getItem("watchedMovies") || "[]");
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
        userContentPreference === "movies" ? recommendationCount < 2 : recommendationCount >= 2;
      const mediaType = shouldFetchMovies ? "movie" : "tv";

      // 2. Gerar prompt para o Gemini
      const prompt = `
    Você é um assistente que responde apenas em JSON válido. 
    O usuário já assistiu os seguintes títulos:
    ${JSON.stringify(validWatchedContent)}

    Forneça uma lista de 50 ${mediaType === "movie" ? "filmes" : "séries"} que são muito populares, bem avaliados e correspondem ao gênero: ${genre.name}. 
    NÃO INCLUA os títulos que o usuário já assistiu.
    Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc. 
    
    Responda no seguinte formato JSON:
    [
      { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv" }
    ]
    `;
  
      // 3. Enviar para o Gemini
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: prompt + "\nResponda apenas com o JSON, sem texto adicional." 
              }] 
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      );
  
      const geminiData = await geminiResponse.json();
      const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!raw) throw new Error("Resposta vazia do Gemini");

      let suggestions: { title: string; tmdbId: number; description: string, urlImg: string, tipo: string }[] = extractJsonFromResponse(raw) || [];

      if (suggestions.length === 0) {
        throw new Error("Gemini não retornou sugestões válidas.");
      }

      // Find correct TMDB IDs for suggestions
      const suggestionsWithCorrectIds = await Promise.all(
        suggestions.map(async (suggestion) => {
          try {
            const searchType = suggestion.tipo === "movie" ? "movie" : "tv";
            const searchResponse = await fetch(
              `https://api.themoviedb.org/3/search/${searchType}?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&query=${encodeURIComponent(suggestion.title)}&language=pt-BR`
            );
            const searchData = await searchResponse.json();
            
            if (searchData.results && searchData.results.length > 0) {
              // Check if user has already watched this content
              const { data: watchedData } = await supabase
                .from("watched_content")
                .select("*")
                .eq("user_id", user?.id)
                .eq("tmdb_id", searchData.results[0].id)
                .eq("media_type", searchType)
                .single();

              // If content has been watched, mark it
              return {
                ...suggestion,
                tmdbId: searchData.results[0].id,
                alreadyWatched: !!watchedData
              };
            }
            return suggestion;
          } catch (error) {
            console.error("Error searching TMDB:", error);
            return suggestion;
          }
        })
      );

      function fisherYatesShuffle<T>(array: T[]): T[] {
        const arr = [...array]; // cria uma cópia para não modificar o original
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); // índice aleatório entre 0 e i
          [arr[i], arr[j]] = [arr[j], arr[i]]; // troca os elementos de posição
        }
        return arr;
      }

      const unwatchedSuggestions = suggestionsWithCorrectIds.filter(s => !s.alreadyWatched);
      // Shuffle all suggestions before processing
      const shuffledSuggestions = fisherYatesShuffle(unwatchedSuggestions);

      // Try each suggestion until we find one that works
      let content = null;
      let providers = null;
      let details, videos, similar;

      for (const suggestion of shuffledSuggestions) {
        try {
          // Try to get providers
          const providerRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
          );
          const providerJson = await providerRes.json();
          const br = providerJson.results.BR;

          // Check if content is available
          if (br && (br.flatrate?.length > 0 || br.free?.length > 0 || br.ads?.length > 0)) {
            // Get additional details
            [details, videos, similar] = await Promise.all([
              fetch(
                `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
              ).then((r) => r.json()),
              fetch(
                `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
              ).then((r) => r.json()),
              fetch(
                `https://api.themoviedb.org/3/${mediaType}/${suggestion.tmdbId}/similar?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
              ).then((r) => r.json()),
            ]);

            content = suggestion;
            providers = br;
            break;
          }
        } catch (error) {
          console.error("Error checking content:", error);
          continue;
        }
      }

      if (!content && suggestions.length > 0) {
        // If no streaming content found, use the first suggestion as fallback
        content = suggestions[0];
        [details, videos, similar] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${content.tmdbId}/similar?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          ).then((r) => r.json()),
        ]);
      }

      if (!content) {
        throw new Error("Nenhum conteúdo encontrado");
      }

      setMoodRecommendation({
        ...content,
        ...details,
        overview: details.overview || content.description,
        videos: videos.results,
        providers,
        similar: similar.results,
        mediaType,
      });
  
      setRecommendationCount((prev) => (prev + 1) % 3);
    } catch (error) {
      console.error("Erro ao buscar recomendação:", error);
  
      toast({
        title: "Erro",
        description: "Não foi possível encontrar conteúdo disponível em streaming",
        variant: "destructive",
      });
  
      setShowRecommendationModal(false);
    }
  
    setIsLoadingRecommendation(false);
  };

  const markAsWatched = async (content: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para marcar como assistido",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("watched_content")
        .insert({
          user_id: user.id,
          tmdb_id: content.id || content.tmdbId,
          media_type: content.mediaType,
          title: content.title || content.name,
          watched_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conteúdo marcado como assistido!",
      });

      // Update local state to reflect the change
      setMoodRecommendation(prev => ({
        ...prev,
        alreadyWatched: true
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
  

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setHasCompletedOnboarding(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_preferences")
          .select()
          .eq("user_id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setHasCompletedOnboarding(!!data);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

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
      {!isPremium && (
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
      )}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 
        bg-gradient-to-b from-black via-filmeja-dark/95 to-black/95
        before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_100%_0%,rgba(120,0,255,0.15),transparent_50%)]
        after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_0%_100%,rgba(0,70,255,0.15),transparent_50%)]
        backdrop-blur-xl border-r border-white/[0.02]
        ${isExpanded ? "w-[280px]" : "w-[70px]"}`}
      >
        <div className="flex flex-col h-full px-4 relative z-10">
          {/* Rest of the sidebar content remains the same */}
          {/* Logo */}
          <div className="flex flex-col h-full px-2 relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-filmeja-purple/20 hover:bg-filmeja-purple/30 p-1"
            >
              {isExpanded ? "←" : "→"}
            </Button>
            {/* Logo */}
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

          {/* Navigation items */}
          <div className="flex-1">
            <nav className="space-y-1">
              <div className="pb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Início"
                >
                  <Home className="w-5 h-5" />
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium">Início</span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Novidades"
                >
                  <Clock className="w-5 h-5" />
                  {isExpanded && (
                    <span className="text-sm font-medium">Novidades</span>
                  )}
                </Button>
              </div>

              <div className="pb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Minha Lista"
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
                    <span className="text-sm font-medium">Recomendados</span>
                  )}
                </Button>
              </div>
            </nav>
          </div>

          {/* User section */}
          <div className="pb-8 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Minha Conta"
            >
              <User className="w-5 h-5" />
              {isExpanded && (
                <span className="text-sm font-medium">Minha Conta</span>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              onClick={handleLogout}
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
      <ImageBackground useSlideshow={true}>
        {/* Header with user info */}
        <header className="bg-black/30 backdrop-blur-sm p-4 sticky top-0 z-10">
          <div className="flex justify-end items-center">
            <div className="flex items-center space-x-3">
              <span className="text-white">{mockUser.name}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={mockUser.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Como você quer descobrir seu próximo filme?
          </h1>
          <p className="text-xl text-gray-200 mb-12 max-w-2xl drop-shadow-md">
            Escolha uma das opções abaixo e deixe-nos guiar você até o
            entretenimento perfeito
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <Button
              onClick={() => setShowMoodOverlay(true)}
              className="bg-filmeja-purple/20 hover:bg-filmeja-purple/40 border-2 border-filmeja-purple text-white px-8 py-4 rounded-xl backdrop-blur-sm transition-all"
            >
              <Heart className="w-5 h-5 mr-3" />
              Por Humor
            </Button>

            <Button
              onClick={() => setShowGenreModal(true)}
              className="bg-filmeja-blue/20 hover:bg-filmeja-blue/40 border-2 border-filmeja-blue text-white px-8 py-4 rounded-xl backdrop-blur-sm transition-all"
            >
              <Film className="w-5 h-5 mr-3" />
              Por Gênero
            </Button>

            <Button
              onClick={() =>
                document
                  .getElementById("aiSection")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-gradient-to-r from-filmeja-purple/20 to-filmeja-blue/20 hover:from-filmeja-purple/40 hover:to-filmeja-blue/40 border-2 border-white text-white px-8 py-4 rounded-xl backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-5 h-5 mr-3" />
              Converse com IA
            </Button>
          </div>
          {showMoodOverlay && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-filmeja-dark/90 p-8 rounded-2xl max-w-4xl w-full mx-4">
                <h2 className="text-2xl font-bold text-white mb-8">
                  Como você está se sentindo hoje?
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { mood: "happy", name: "Feliz", emoji: "😊" },
                    { mood: "sad", name: "Triste", emoji: "😢" },
                    { mood: "excited", name: "Animado", emoji: "🤩" },
                    { mood: "relaxed", name: "Relaxado", emoji: "😌" },
                    { mood: "romantic", name: "Romântico", emoji: "🥰" },
                    { mood: "scared", name: "Assustado", emoji: "😨" },
                    { mood: "thoughtful", name: "Pensativo", emoji: "🤔" },
                  ].map(({ mood, name, emoji }) => (
                    <Button
                      key={mood}
                      onClick={() => {
                        fetchMoodRecommendation(mood);
                        setShowMoodOverlay(false);
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-filmeja-purple/20 rounded-full transition-all duration-300 hover:scale-105"
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="text-white font-medium whitespace-nowrap">
                        {name}
                      </span>
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setShowMoodOverlay(false)}
                  className="mt-8 px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
        {showGenreModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-filmeja-dark/90 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    Escolha um Gênero
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowGenreModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
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
  onRequestNew={() => {
    // Check if the current recommendation is from genre or mood
    if (genre) {
      fetchGenreRecommendation(genre);
    } else {
      fetchMoodRecommendation(selectedMood || "happy");
    }
  }}
  selectedMood={selectedMood}
  onMarkAsWatched={markAsWatched}
/>
      </ImageBackground>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "ml-[280px]" : "ml-[70px]"
        }`}
      >
        {/* Main content area */}
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-8 text-white">
            Descubra filmes e séries para você
          </h1>

          {/* Recommendation system section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6 text-white drop-shadow-lg">
              Como você quer encontrar sua próxima série ou filme?
            </h2>

            <MoodCarousel />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Mood-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Por Humor
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Encontre filmes e séries que combinam com seu humor atual
                </p>
                <MoodSelector onMoodSelect={handleMoodSelect} />
              </div>

              {/* Genre-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Por Gênero
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Descubra novos títulos no seu gênero favorito
                </p>
                <GenreSelector />
              </div>

              {/* AI-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Via IA
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Deixe nossa IA encontrar o título perfeito para você
                </p>
                <AiRecommendationWidget />
              </div>
            </div>

            {/* Random wheel section */}
            <div className="glass-card p-6 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    Roleta Inteligente FilmeJá
                  </h3>
                  <p className="text-gray-300">
                    Não sabe o que assistir? Deixe nossa roleta escolher algo
                    especial para você baseado nas suas preferências!
                  </p>
                </div>
                <RandomWheel />
              </div>
            </div>
          </section>

          {/* Mood-based recommendations section */}
          {selectedMood && moodRecommendations.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Para quando você está {getMoodName(selectedMood)}
              </h2>
              <ContentCarousel title="" items={moodRecommendations} />
            </section>
          )}

          {/* Trending content section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-white">Em alta</h2>
            <ContentCarousel title="" items={trendingContent} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
