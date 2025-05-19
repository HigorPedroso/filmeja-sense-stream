import { motion } from "framer-motion";
import { useState } from "react";
import {
  User,
  Settings,
  Crown,
  LogOut,
  ChevronRight,
  Heart,
  Film,
  History,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageBackground from "@/components/ImageBackground";
import { fetchContentWithProviders } from "@/lib/utils/tmdb";
import { ContentModal } from "@/components/ContentModal/ContentModal";

interface WatchHistory {
  id: number;
  content_id: number;
  content_type: string;
  title: string;
  poster_path: string;
  created_at: string;
  watchHistory?: WatchHistory[];
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  isPremium: boolean;
  preferences?: {
    genres: string[];
    moods: string[];
  };
}

export function ProfilePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  // Add these states inside the component
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Move the handler inside the component
  const handleContentSelect = async (item: WatchHistory) => {
    setShowContentModal(true);
    setIsLoadingContent(true);
    
    try {
      // Search for the content first to get TMDB ID
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/${item.content_type}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(item.title)}&language=pt-BR`
      );
      
      const searchData = await searchResponse.json();
      const content = searchData.results[0];

      if (content) {
        await fetchContentWithProviders(
          { 
            id: content.id,
            title: item.title, 
            media_type: item.content_type,
            poster_path: content.poster_path,
            overview: content.overview,
          },
          {
            onLoadingChange: setIsLoadingContent,
            onContentFetched: setSelectedContent
          }
        );
      } else {
        throw new Error('Content not found');
      }
    } catch (error) {
      console.error('Error fetching content details:', error);
      setShowContentModal(false);
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Check subscription status
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError;
        }

        setProfile({
          id: user.id,
          email: user.email!,
          full_name: profileData?.full_name || user.user_metadata?.full_name || 'Usuário',
          avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url,
          isPremium: !!subscriptionData, // Check if subscription exists
          preferences: {
            genres: profileData?.preferred_genres || [],
            moods: profileData?.preferred_moods || [],
          }
        });

        const { data: historyData, error: historyError } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) throw historyError;

    // Fetch TMDB data for each history item
    const historyWithPosters = await Promise.all(
      (historyData || []).map(async (item) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/${item.content_type}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(item.title)}&language=pt-BR`
          );
          const data = await response.json();
          const result = data.results[0];
          
          return {
            ...item,
            poster_path: result?.poster_path || null
          };
        } catch (error) {
          console.error('Error fetching TMDB data:', error);
          return item;
        }
      })
    );

    setWatchHistory(historyWithPosters);

      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Erro ao carregar perfil",
          description: "Por favor, tente novamente mais tarde",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, toast]);

  if (isLoading) {
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

  if (!profile) {
    return null;
  }

  const handleCancelSubscription = async () => {
    try {
      // Add your subscription cancellation logic here
      await supabase.from('profiles').update({ is_premium: false }).eq('id', profile?.id);
      setProfile(prev => prev ? { ...prev, isPremium: false } : null);
      setShowSubscriptionModal(false);
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar assinatura",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpgradeSubscription = async () => {
    try {
      // Add your subscription upgrade logic here
      await supabase.from('profiles').update({ is_premium: true }).eq('id', profile?.id);
      setProfile(prev => prev ? { ...prev, isPremium: true } : null);
      setShowSubscriptionModal(false);
      toast({
        title: "Assinatura ativada",
        description: "Bem-vindo ao plano Premium!",
      });
    } catch (error) {
      toast({
        title: "Erro ao ativar assinatura",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-filmeja-dark via-black to-filmeja-dark">
      <Sidebar 
        isExpanded={isExpanded} 
        setIsExpanded={setIsExpanded} 
        onLogout={handleLogout} 
      />

    <MobileSidebar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-filmeja-purple/20 to-filmeja-blue/20 rounded-3xl blur-xl" />
          <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Avatar className="w-24 h-24 border-2 border-filmeja-purple">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-filmeja-purple/20 text-2xl">
                      {profile.full_name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {profile.isPremium && (
                  <motion.div
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-filmeja-purple to-filmeja-blue p-1.5 rounded-full"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.8, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Crown className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">
                    {profile.full_name}
                  </h1>
                  {profile.isPremium && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowSubscriptionModal(true)}
                      className="px-2 py-1 bg-filmeja-purple/20 rounded-full text-xs font-medium text-filmeja-purple hover:bg-filmeja-purple/30"
                    >
                      Premium
                    </Button>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
                {!profile.isPremium && (
                  <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSubscriptionModal(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-filmeja-purple to-filmeja-blue 
                  rounded-xl text-white text-sm font-medium flex items-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4" />
                  Premium
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-filmeja-purple" />
            Suas Preferências
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Gêneros Favoritos</h3>
              <div className="flex flex-wrap gap-2">
                {profile.preferences?.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-filmeja-purple/20 rounded-full text-sm text-white"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Humores Preferidos</h3>
              <div className="flex flex-wrap gap-2">
                {profile.preferences?.moods.map((mood) => (
                  <span
                    key={mood}
                    className="px-3 py-1 bg-filmeja-blue/20 rounded-full text-sm text-white"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="mt-4 border-white/10 hover:bg-white/5"
          >
            <Settings className="w-4 h-4 mr-2" />
            Editar Preferências
          </Button>
        </motion.div>

        {/* Watch History */}
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="mt-8 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10"
>
  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
    <History className="w-5 h-5 text-filmeja-purple" />
    Histórico de Recomendações
  </h2>
  
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
    {watchHistory.length > 0 ? (
      watchHistory.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleContentSelect(item)}
          className="relative group aspect-[2/3] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-filmeja-purple/50"
        >
          <div className="relative w-full h-full bg-filmeja-dark/50 rounded-xl overflow-hidden">
            <img
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder-poster.jpg'}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-poster.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 p-3 w-full">
                <p className="text-sm font-medium text-white line-clamp-2 text-left">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 text-left">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.button>
      ))
    ) : (
      <p className="text-gray-400 col-span-full text-center py-8">
        Nenhuma recomendação no histórico ainda
      </p>
    )}
  </div>
</motion.div>

{/* Add the ContentModal */}
<ContentModal
  isOpen={showContentModal}
  onOpenChange={setShowContentModal}
  content={selectedContent}
  isLoading={isLoadingContent}
/>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </motion.div>
      </div>

      <SubscriptionModal
  isOpen={showSubscriptionModal}
  onClose={() => setShowSubscriptionModal(false)}
  isPremium={profile.isPremium}
  onCancelSubscription={handleCancelSubscription}
  onUpgradeSubscription={handleUpgradeSubscription}
/>
    </div>
  );
}