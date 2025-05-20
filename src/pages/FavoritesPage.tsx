
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FavoriteItem } from "@/lib/favorites";
import { ContentItem } from "@/types/movie";
import { ContentModal } from "@/components/ContentModal/ContentModal";
import { fetchContentWithProviders } from "@/lib/utils/tmdb";

interface FavoritesPageProps {
  title?: string;
  items?: FavoriteItem[];
}

export function FavoritesPage({ title = "Meus Favoritos", items = [] }: FavoritesPageProps) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>(items);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>(favorites);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/signup");
          return;
        }

        const { data, error } = await supabase
          .from('favorite_content')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          return;
        }

        setFavorites(data || []);
        setFilteredFavorites(data || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    if (items.length === 0) {
      fetchFavorites();
    } else {
      setFavorites(items);
      setFilteredFavorites(items);
    }
  }, [items, navigate]);

  useEffect(() => {
    // Filter favorites based on search query and type filter
    let filtered = [...favorites];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.media_type === filterType);
    }
    
    setFilteredFavorites(filtered);
  }, [searchQuery, filterType, favorites]);

  const handleOpenDetails = async (item: FavoriteItem) => {
    setIsLoadingContent(true);
    setShowContentModal(true);
    
    try {
      const type = item.media_type;
      const id = Number(item.tmdb_id);
      
      // Fetch content details with providers
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
      );
      const details = await response.json();
      
      // Fetch videos
      const videosRes = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
      );
      const videos = await videosRes.json();
      
      // Fetch providers
      const providersRes = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
      );
      const providers = await providersRes.json();
      
      // Set content with all details
      const contentWithDetails = {
        ...details,
        videos: videos.results,
        providers: providers.results?.BR,
        mediaType: type,
        type
      };
      
      setSelectedContent(contentWithDetails);
    } catch (error) {
      console.error('Error fetching content details:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleRemoveFavorite = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('favorite_content')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Update local state after removal
      const updatedFavorites = favorites.filter(item => item.id !== itemId);
      setFavorites(updatedFavorites);
      setFilteredFavorites(updatedFavorites.filter(item => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filterType !== 'all' && item.media_type !== filterType) {
          return false;
        }
        return true;
      }));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getItemTypeName = (type: string): string => {
    return type === 'movie' ? 'Filme' : 'Série';
  };

  return (
    <div className="min-h-screen bg-filmeja-dark text-white p-6">
      {/* Header */}
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center mb-8">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center">
            {title} <Heart className="ml-3 text-pink-500 h-6 w-6" />
          </h1>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              type="text"
              placeholder="Buscar nos favoritos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-filmeja-dark border-white/10 text-white"
            />
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'} 
              onClick={() => setFilterType('all')}
              className={filterType === 'all' ? 'bg-filmeja-purple' : 'text-white border-white/10'}
            >
              Todos
            </Button>
            <Button
              variant={filterType === 'movie' ? 'default' : 'outline'} 
              onClick={() => setFilterType('movie')}
              className={filterType === 'movie' ? 'bg-filmeja-purple' : 'text-white border-white/10'}
            >
              Filmes
            </Button>
            <Button
              variant={filterType === 'tv' ? 'default' : 'outline'} 
              onClick={() => setFilterType('tv')}
              className={filterType === 'tv' ? 'bg-filmeja-purple' : 'text-white border-white/10'}
            >
              Séries
            </Button>
          </div>
        </div>
        
        {/* Favorites Grid */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="bg-filmeja-dark border border-white/10 rounded-lg overflow-hidden group hover:border-filmeja-purple transition-all">
                <div className="relative">
                  <div 
                    className="aspect-[2/3] bg-filmeja-dark/60 cursor-pointer overflow-hidden"
                    onClick={() => handleOpenDetails(item)}
                  >
                    {item.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-filmeja-dark/40 text-white/40">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveFavorite(item.id)}
                    >
                      <Heart className="h-3 w-3 fill-white" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <span className="inline-block px-2 py-1 text-xs bg-filmeja-purple/80 rounded-md">
                      {getItemTypeName(item.media_type)}
                    </span>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" title={item.title}>{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400">Nenhum favorito encontrado</h3>
            <p className="mt-2 text-gray-500">
              {favorites.length === 0 
                ? "Adicione filmes e séries aos seus favoritos para vê-los aqui."
                : "Não há resultados para os filtros selecionados."}
            </p>
            {favorites.length > 0 && searchQuery && (
              <Button 
                variant="link" 
                className="text-filmeja-purple mt-2"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Content Details Modal */}
      <ContentModal
        isOpen={showContentModal}
        onOpenChange={setShowContentModal}
        content={selectedContent}
        isLoading={isLoadingContent}
        onMarkAsWatched={async (content) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            await supabase.from("watched_content").insert({
              user_id: user.id,
              tmdb_id: content.id || content.tmdbId,
              media_type: content.mediaType || content.media_type || "movie",
              title: content.title || content.name || "",
              watched_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Error marking as watched:", error);
          }
        }}
      />
    </div>
  );
}
