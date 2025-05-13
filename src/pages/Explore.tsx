
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTrending, searchContent } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Get trending content initially
  const trendingContent = getTrending();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = searchContent(searchQuery);
    setSearchResults(results);
  };
  
  const displayContent = searchQuery ? searchResults : trendingContent;
  
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
            >
              <Search className="h-5 w-5 text-filmeja-purple" />
            </Button>
          </form>
        </div>
        
        {displayContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {displayContent.map((item) => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-300 text-lg">Nenhum resultado encontrado para "{searchQuery}"</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Explore;
