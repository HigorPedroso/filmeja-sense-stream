
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending, getRecommendationsByMood } from '@/lib/tmdb';
import { ContentItem, MoodType } from '@/types/movie';
import { Film, User, LogOut, BookOpen, Home, Star, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContentCarousel from '@/components/ContentCarousel';
import VideoBackground from '@/components/VideoBackground';
import { useToast } from '@/hooks/use-toast';
import MoodSelector from '@/components/MoodSelector';
import GenreSelector from '@/components/GenreSelector';
import AiRecommendationWidget from '@/components/AiRecommendationWidget';
import RandomWheel from '@/components/RandomWheel';

// Mock user data - in a real app, this would come from authentication
const mockUser = {
  name: 'Gabriel Costa',
  avatar: 'https://i.pravatar.cc/150?img=3',
  isPremium: false // Toggle this to test premium vs non-premium UI
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [moodRecommendations, setMoodRecommendations] = useState<ContentItem[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [isPremium, setIsPremium] = useState(mockUser.isPremium);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Fetch trending content on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const content = await getTrending();
        setTrendingContent(content || []);
      } catch (error) {
        console.error('Error fetching trending content:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os conteúdos populares',
          variant: 'destructive',
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
        description: 'Confira nossa seleção especial!',
      });
    } catch (error) {
      console.error('Error fetching mood recommendations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as recomendações de humor',
        variant: 'destructive',
      });
    }
  };

  // Get mood name in Portuguese
  const getMoodName = (mood: MoodType): string => {
    const moodNames: Record<MoodType, string> = {
      happy: 'feliz',
      sad: 'triste',
      excited: 'animado',
      relaxed: 'relaxado',
      romantic: 'romântico',
      scared: 'assustado',
      thoughtful: 'pensativo'
    };
    return moodNames[mood] || mood;
  };

  // Handle upgrade to premium
  const handleUpgradeToPremium = () => {
    // Here you would redirect to Stripe payment
    toast({
      title: 'Redirecionando para pagamento',
      description: 'Você será redirecionado para a página de pagamento',
    });
    // For demo purposes, let's toggle the premium status
    setIsPremium(true);
  };

  // Handle logout
  const handleLogout = () => {
    toast({
      title: 'Saindo...',
      description: 'Você foi desconectado com sucesso',
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-filmeja-dark overflow-x-hidden">
      <VideoBackground />
      
      {/* Premium overlay */}
      {!isPremium && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-30 flex flex-col items-center justify-center">
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Acesso Bloqueado</h2>
            <p className="text-gray-200 mb-6">
              Ative seu acesso premium por apenas R$9,99 para desbloquear todas as funcionalidades do FilmeJá!
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

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-sidebar transition-all duration-300 z-20 ${isSidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex justify-center items-center">
            {isSidebarOpen ? (
              <h1 className="text-2xl font-bold text-white">FilmeJá</h1>
            ) : (
              <Film className="w-6 h-6 text-white" />
            )}
          </div>
          
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '«' : '»'}
          </Button>

          {/* Navigation items */}
          <div className="mt-8 flex-1">
            <nav>
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <Home className="mr-2" />
                {isSidebarOpen && <span>Dashboard</span>}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <Heart className="mr-2" />
                {isSidebarOpen && <span>Meus Favoritos</span>}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <Clock className="mr-2" />
                {isSidebarOpen && <span>Recomendados</span>}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <Star className="mr-2" />
                {isSidebarOpen && <span>Preferências</span>}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <BookOpen className="mr-2" />
                {isSidebarOpen && <span>Blog</span>}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start mb-2 px-4 text-white"
              >
                <User className="mr-2" />
                {isSidebarOpen && <span>Minha Conta</span>}
              </Button>
            </nav>
          </div>
          
          {/* Logout button */}
          <Button
            variant="ghost"
            className="w-full justify-start mb-8 px-4 text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2" />
            {isSidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-60' : 'ml-16'}`}>
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
          <h1 className="text-3xl font-bold mb-8 text-white">Descubra filmes e séries para você</h1>

          {/* Recommendation system section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6 text-white">Como você quer encontrar sua próxima série ou filme?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Mood-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Por Humor</h3>
                <p className="text-sm text-gray-300 mb-4">Encontre filmes e séries que combinam com seu humor atual</p>
                <MoodSelector onMoodSelect={handleMoodSelect} />
              </div>
              
              {/* Genre-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Por Gênero</h3>
                <p className="text-sm text-gray-300 mb-4">Descubra novos títulos no seu gênero favorito</p>
                <GenreSelector />
              </div>
              
              {/* AI-based recommendations */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Via IA</h3>
                <p className="text-sm text-gray-300 mb-4">Deixe nossa IA encontrar o título perfeito para você</p>
                <AiRecommendationWidget />
              </div>
            </div>

            {/* Random wheel section */}
            <div className="glass-card p-6 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Roleta Inteligente FilmeJá</h3>
                  <p className="text-gray-300">
                    Não sabe o que assistir? Deixe nossa roleta escolher algo especial para você baseado nas suas preferências!
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
