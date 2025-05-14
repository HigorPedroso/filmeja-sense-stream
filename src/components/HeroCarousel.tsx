
import React, { useState, useEffect } from 'react';
import { getTrending } from '@/lib/tmdb';
import { ContentItem } from '@/types/movie';

const HeroCarousel: React.FC = () => {
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch trending content for the carousel
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        const content = await getTrending();
        // Filter for items with backdrop images and limit to 5
        const filteredContent = content
          .filter(item => item.backdrop_path)
          .slice(0, 5);
        setFeaturedContent(filteredContent);
      } catch (error) {
        console.error('Error fetching featured content:', error);
        setFeaturedContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  // Auto-advance slideshow every 6 seconds
  useEffect(() => {
    if (featuredContent.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === featuredContent.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredContent.length]);

  // Image URL formatting
  const getBackdropUrl = (path: string) => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/original${path}`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-filmeja-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-filmeja-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (featuredContent.length === 0) {
    return (
      <div className="w-full h-full bg-filmeja-dark"></div>
    );
  }

  return (
    <div className="relative w-full h-full bg-filmeja-dark">
      {/* Images */}
      <div className="absolute inset-0">
        {featuredContent.map((item, index) => (
          <div 
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={getBackdropUrl(item.backdrop_path)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {featuredContent.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-filmeja-purple w-4' : 'bg-white/50 hover:bg-white/70'}`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
