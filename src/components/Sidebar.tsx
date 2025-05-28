import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, Home, Clock, Heart, Star, User, LogOut } from "lucide-react";
import { MessageSquare } from "lucide-react"; // Add this import at the top with other icons
import { AiChat } from "@/components/AiChat/AiChat";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { ContentModal } from "@/components/ContentModal/ContentModal";
import { fetchContentWithProviders } from "@/lib/utils/tmdb";
import { getContentDetails } from "../lib/tmdb";
import { toast } from "@/hooks/use-toast";
import PremiumPaymentModal from "@/components/PremiumPaymentModal"; // Import the modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Sparkles } from "lucide-react";
import { SignupPromptModal } from "./modals/SignupPromptModal";
import { SignupModal } from "./modals/SignupModal";

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  onLogout: () => void;
}

export function Sidebar({ isExpanded, setIsExpanded, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userWatchedMovies, setUserWatchedMovies] = useState([]);
  const [userWatchedSeries, setUserWatchedSeries] = useState([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [moodRecommendation, setMoodRecommendation] = useState<any>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isAnonymousUser, setIsAnonymousUser] = useState(false);
  const [showSignupPromptModal, setShowSignupPromptModal] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Check if user is anonymous
      if (user) {
        const isAnon = user.is_anonymous;
        setIsAnonymousUser(isAnon);

        // Check premium status
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

  const handleLogoutOrSignup = async () => {
    if (isAnonymousUser) {
      // Show signup modal for anonymous users
      setShowSignupPromptModal(true);
    } else {
      // Regular logout for normal users
      onLogout();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setSignupError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: "Enviamos um link de confirmação para o seu e-mail.",
      });

      setShowSignupModal(false);
    } catch (error: any) {
      setSignupError(error.message);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 
        bg-gradient-to-b from-black via-filmeja-dark/95 to-black/95
        before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_100%_0%,rgba(120,0,255,0.15),transparent_50%)]
        after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_0%_100%,rgba(0,70,255,0.15),transparent_50%)]
        backdrop-blur-xl border-r border-white/[0.02]
        hidden md:block
        ${isExpanded ? "w-[280px]" : "w-[70px]"}`}
      >
        <div className="flex flex-col h-full px-4 relative z-10">
          <div className="flex flex-col h-full px-2 relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-filmeja-purple/20 hover:bg-filmeja-purple/30 p-1"
            >
              {isExpanded ? "←" : "→"}
            </Button>

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

          <div className="flex-1">
            <nav className="space-y-1">
              <div className="pb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Início"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="w-5 h-5" />
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium">Início</span>
                  )}
                </Button>

                {/* <Button
                variant="ghost"
                className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Novidades"
              >
                <Clock className="w-5 h-5" />
                {isExpanded && (
                  <span className="text-sm font-medium">Novidades</span>
                )}
              </Button> */}
              </div>

              <div className="pb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Minha Lista"
                  onClick={() => {
                    if (isAnonymousUser) {
                      setShowSignupPromptModal(true);
                    } else {
                      navigate("/favorites");
                    }
                  }}
                >
                  <Heart className="w-5 h-5" />
                  {isExpanded && (
                    <span className="text-sm font-medium">Minha Lista</span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Chat com IA"
                  onClick={() => {
                    if (isAnonymousUser) {
                      setShowSignupPromptModal(true);
                    } else if (!isPremium) {
                      setShowPremiumModal(true);
                    } else {
                      setShowAiChat(true);
                    }
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  {isExpanded && (
                    <span className="text-sm font-medium">
                      Converse com Filmin.AI
                    </span>
                  )}
                </Button>
              </div>

              {/* Premium Modal */}
              <PremiumPaymentModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                onSuccess={() => {
                  setIsPremium(true);
                  setShowPremiumModal(false);
                }}
              />
            </nav>
          </div>

          <div className="pb-8 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Minha Conta"
              onClick={() => {
                if (isAnonymousUser) {
                  setShowSignupPromptModal(true);
                } else {
                  navigate("/profile")
                }
              }}
            >
              <User className="w-5 h-5" />
              {isExpanded && (
                <span className="text-sm font-medium">Minha Conta</span>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-center py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              onClick={handleLogoutOrSignup}
            >
              {isAnonymousUser ? (
                <>
                  <LogOut className="w-5 h-5 group-hover:text-filmeja-purple transition-colors" />
                  {isExpanded && (
                    <span className="text-sm font-medium group-hover:text-filmeja-purple transition-colors">
                      Criar Conta
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 group-hover:text-filmeja-purple transition-colors" />
                  {isExpanded && (
                    <span className="text-sm font-medium group-hover:text-filmeja-purple transition-colors">
                      Sair
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
        <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
          <DialogContent className="bg-gradient-to-br from-filmeja-dark to-black border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-filmeja-purple" />
                Crie sua conta
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Salve suas preferências e continue descobrindo filmes e séries
                incríveis!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <p>
                Você está usando uma conta temporária. Crie uma conta permanente
                para:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Salvar suas preferências e histórico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Criar sua lista de favoritos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Receber recomendações personalizadas</span>
                </li>
              </ul>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowSignupModal(false);
                  navigate("/signup");
                }}
                className="flex-1 bg-gradient-to-r from-filmeja-purple to-filmeja-blue"
              >
                Criar minha conta
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSignupModal(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Continuar como visitante
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SignupPromptModal
          isOpen={showSignupPromptModal}
          onClose={() => setShowSignupPromptModal(false)}
          onCreateAccount={() => {
            setShowSignupPromptModal(false);
            setShowSignupModal(true);
          }}
          onContinueWithoutAccount={() => {
            setShowSignupPromptModal(false);
            navigate("/favorites");
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
      </div>

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
    </>
  );
}
