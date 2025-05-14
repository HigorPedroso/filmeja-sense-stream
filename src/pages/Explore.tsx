
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTrending, searchContent } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/types/movie';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // Load trending content on component mount
  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        setIsLoading(true);
        const trending = await getTrending();
        setTrendingContent(trending);
      } catch (error) {
        console.error('Error loading trending content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrendingContent();
  }, []);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchContent(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching content:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const displayContent = searchQuery ? searchResults : trendingContent;
  const isShowingSearchResults = searchQuery.length > 0;
  
  return (
    <div className="min-h-screen bg-filmeja-dark flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-24 md:py-28">
        <h1 className="text-3xl font-bold text-white mb-8">Explorar Conteúdo</h1>
        
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative flex">
            <Input
              type="text"
              placeholder="Buscar filmes e séries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/20 border-filmeja-purple/50 text-white placeholder-gray-400 pr-12"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent hover:bg-filmeja-purple/20"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin text-filmeja-purple" />
              ) : (
                <Search className="h-5 w-5 text-filmeja-purple" />
              )}
            </Button>
          </form>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-700/30 rounded-lg aspect-[2/3]"></div>
                <div className="h-4 bg-gray-700/30 rounded mt-2 w-3/4"></div>
                <div className="h-3 bg-gray-700/30 rounded mt-2 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : displayContent.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">
              {isShowingSearchResults 
                ? `Resultados para "${searchQuery}"`
                : "Conteúdo em destaque"
              }
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {displayContent.map((item) => (
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-300 text-lg">
              {isShowingSearchResults
                ? `Nenhum resultado encontrado para "${searchQuery}"`
                : "Nenhum conteúdo disponível no momento."
              }
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Explore;
