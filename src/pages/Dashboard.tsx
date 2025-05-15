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
import trailerSound from '@/assets/sounds/trailer-whoosh.mp3'; // You'll need to add this sound file

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
  const getMoodName = (mood: MoodType): string => {
    return moodNames[mood] || mood;
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

  // Handle mood selection
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    try {
      const recommendations = await getRecommendationsByMood(mood);
      setMoodRecommendations(recommendations || []);
      toast({
        title: `Recomendações para quando você está ${getMoodName(mood)}`,
        description: "Confira nossa seleção especial!",
      });
    } catch (error) {
      console.error("Error fetching mood recommendations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as recomendações de humor",
        variant: "destructive",
      });
    }
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

  const fetchMoodRecommendation = async (mood: string) => {
    setIsLoadingRecommendation(true);
    setShowRecommendationModal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const genres = moodToGenres[mood].join(",");
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const randomSort = [
        'popularity.desc',
        'vote_average.desc',
        'vote_count.desc',
        'primary_release_date.desc'
      ][Math.floor(Math.random() * 4)];

      // Fetch multiple pages to increase the pool of movies
      const moviePromises = [1, 2, 3].map(page =>
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&with_genres=${genres}&sort_by=${randomSort}&page=${page}&vote_count.gte=100&language=pt-BR&with_original_language=en|pt|es|fr`
        ).then(res => res.json())
      );

      const movieResults = await Promise.all(moviePromises);
      const allMovies = movieResults.flatMap(result => result.results);
      
      // Shuffle all movies
      const shuffledMovies = allMovies.sort(() => Math.random() - 0.5);
      
      // Find a movie with any type of availability (not just flatrate)
      let movie = null;
      let providers = null;
      
      for (const potentialMovie of shuffledMovies) {
        const providerResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${
            potentialMovie.id
          }/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const providerData = await providerResponse.json();
        
        // Check for any type of availability in Brazil
        if (providerData.results.BR && 
           (providerData.results.BR.flatrate?.length > 0 || 
            providerData.results.BR.free?.length > 0 || 
            providerData.results.BR.ads?.length > 0)) {
          movie = potentialMovie;
          providers = providerData.results.BR;
          break;
        }
      }
  
      // If still no movie found, just use the first movie without provider check
      if (!movie && shuffledMovies.length > 0) {
        movie = shuffledMovies[0];
      }
  
      if (!movie) {
        throw new Error("No movies found for this mood");
      }
  
      // Fetch additional movie details
      const [details, videos, similar] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((res) => res.json()),
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((res) => res.json()),
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/similar?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        ).then((res) => res.json()),
      ]);
  
      setMoodRecommendation({
        ...movie,
        ...details,
        videos: videos.results,
        providers: providers,
        similar: similar.results,
      });
    } catch (error) {
      console.error("Error fetching mood recommendation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível encontrar um filme disponível em streaming",
        variant: "destructive",
      });
      setShowRecommendationModal(false);
    }
    setIsLoadingRecommendation(false);
  };

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
        className={`fixed top-0 left-0 h-full transition-all duration-300 z-20 
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
              onClick={() =>
                document
                  .getElementById("genreSection")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
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
        {showRecommendationModal && (
          <Dialog
            open={showRecommendationModal}
            onOpenChange={setShowRecommendationModal}
          >
            <DialogContent className="sm:max-w-5xl bg-filmeja-dark/95 border-filmeja-purple/20">
              {isLoadingRecommendation ? (
                <div className="relative">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Poster and Quick Info Skeleton */}
                    <div className="md:w-1/3">
                      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
                      <div className="mt-4 space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column - Details Skeleton */}
                    <div className="md:w-2/3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-64" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>

                      {/* Rating Skeleton */}
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton
                              key={i}
                              className="w-4 h-4 rounded-full"
                            />
                          ))}
                        </div>
                        <Skeleton className="h-4 w-32" />
                      </div>

                      {/* Genres Skeleton */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-6 w-20 rounded-full" />
                        ))}
                      </div>

                      {/* Overview Skeleton */}
                      <div className="space-y-2 mb-6">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full" />
                        ))}
                      </div>

                      {/* Streaming Providers Skeleton */}
                      <div className="mb-6">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <div className="flex flex-wrap gap-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Skeleton className="w-6 h-6 rounded-full" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons Skeleton */}
                      <div className="flex flex-wrap gap-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-32" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                moodRecommendation && (
                  <div className="relative">
                    {/* Background Image with Blur */}
                    <div
                      className="absolute inset-0 opacity-20 blur-md"
                      style={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/original${moodRecommendation.backdrop_path})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Column - Poster and Quick Info */}
                        <div className="md:w-1/3">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${moodRecommendation.poster_path}`}
                            alt={moodRecommendation.title}
                            className="rounded-lg w-full object-cover shadow-xl"
                          />

                          {/* Quick Stats */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>Lançamento:</span>
                              <span>
                                {new Date(
                                  moodRecommendation.release_date
                                ).getFullYear()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>Duração:</span>
                              <span>{moodRecommendation.runtime} minutos</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>Idioma:</span>
                              <span>
                                {moodRecommendation.original_language.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Details */}
                        <div className="md:w-2/3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-2xl font-bold text-white mb-1">
                                {moodRecommendation.title}
                              </h2>
                              {moodRecommendation.title !==
                                moodRecommendation.original_title && (
                                <p className="text-sm text-gray-400 mb-2">
                                  {moodRecommendation.original_title}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < moodRecommendation.vote_average / 2
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-white">
                              {moodRecommendation.vote_average.toFixed(1)}
                            </span>
                            <span className="text-gray-400 text-sm">
                              ({moodRecommendation.vote_count} avaliações)
                            </span>
                          </div>

                          {/* Genres */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {moodRecommendation.genres?.map((genre: any) => (
                              <span
                                key={genre.id}
                                className="px-3 py-1 bg-white/10 rounded-full text-sm text-white"
                              >
                                {genre.name}
                              </span>
                            ))}
                          </div>

                          {/* Overview */}
                          <p className="text-gray-300 mb-6">
                            {moodRecommendation.overview}
                          </p>

                          {/* Streaming Providers */}
                          {moodRecommendation.providers?.flatrate && (
                            <div className="mb-6">
                              <h3 className="text-white font-semibold mb-2">
                                Disponível em:
                              </h3>
                              <div className="flex flex-wrap gap-3">
                                {moodRecommendation.providers.flatrate.map(
                                  (provider: any) => (
                                    <div
                                      key={provider.provider_id}
                                      className="flex items-center bg-white/10 rounded-full px-3 py-1"
                                    >
                                      <img
                                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        className="w-6 h-6 rounded-full mr-2"
                                      />
                                      <span className="text-sm text-white">
                                        {provider.provider_name}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <Button
                              className="bg-filmeja-purple hover:bg-filmeja-purple/90"
                              onClick={() => {
                                /* Add watch/details navigation */
                              }}
                            >
                              Assistir Agora
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/20 hover:bg-white/10"
                              onClick={() =>
                                fetchMoodRecommendation(selectedMood || "happy")
                              }
                            >
                              Outra Sugestão
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/20 hover:bg-white/10"
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Favoritar
                            </Button>
                          </div>

                          {/* Trailer Section */}
                          {moodRecommendation.videos?.length > 0 && (
  <>
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        className="mt-6 bg-[#E50914] hover:bg-[#F40D17] text-white flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-600/20"
        onClick={async () => {
          setIsTrailerAnimating(true);
          await new Promise(resolve => setTimeout(resolve, 2000));
          setShowTrailerModal(true);
          setIsTrailerAnimating(false);
        }}
        disabled={isTrailerAnimating}
      >
        {isTrailerAnimating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Play className="w-5 h-5" />
          </motion.div>
        ) : (
          <Play className="w-5 h-5" />
        )}
        Ver Trailer
      </Button>
    </motion.div>

    <AnimatePresence>
      {showTrailerModal && (
        <Dialog
          open={showTrailerModal}
          onOpenChange={setShowTrailerModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <DialogContent className="max-w-7xl bg-[#0F0F0F]/95 backdrop-blur-xl border-none p-0 font-inter">
              <div className="relative">
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                  {moodRecommendation.providers?.flatrate && (
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2">
                      <span className="text-white text-sm">Disponível em:</span>
                      <div className="flex -space-x-2">
                        {moodRecommendation.providers.flatrate.map((provider: any) => (
                          <img
                            key={provider.provider_id}
                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-8 h-8 rounded-full border-2 border-black"
                            title={provider.provider_name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    className="rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 text-white"
                    onClick={() => setShowTrailerModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent"
                  >
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {moodRecommendation.title}
                    </h2>
                    {moodRecommendation.title !== moodRecommendation.original_title && (
                      <p className="text-sm text-gray-400">
                        {moodRecommendation.original_title}
                      </p>
                    )}
                  </motion.div>

                  <div className="aspect-video w-full bg-black">
                    {moodRecommendation.videos[0]?.key ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${moodRecommendation.videos[0].key}?autoplay=1&rel=0`}
                        title="Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.8, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Play className="w-16 h-16 text-red-600" />
                          <p className="text-white mt-4 text-center">
                            Carregando trailer...
                          </p>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  </>
)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </DialogContent>
          </Dialog>
        )}
      </ImageBackground>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "ml-[280px]" : "ml-[70px]"
        }`}
      >
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
