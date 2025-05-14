
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/types/movie';
import MovieCard from './MovieCard';

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
  renderExtra?: (item: ContentItem) => React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  onSaveItem?: (item: ContentItem) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ 
  title, 
  items,
  size = 'medium',
  onSaveItem
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!items?.length) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">{title}</h2>
        
        <div className="relative">
          <div 
            className="flex overflow-x-auto scrollbar-none pb-4 gap-4 scroll-smooth snap-x"
            ref={scrollContainerRef}
          >
            {items.map((item) => (
              <div key={`${item.media_type}-${item.id}`} className="snap-start shrink-0">
                <MovieCard 
                  item={item} 
                  size={size} 
                  onSave={() => onSaveItem?.(item)}
                />
              </div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            className="bg-black/50 hover:bg-black/70 text-white absolute top-1/2 left-0 -translate-y-1/2 rounded-full p-1.5 hidden md:flex"
            onClick={scrollLeft}
            size="icon"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            className="bg-black/50 hover:bg-black/70 text-white absolute top-1/2 right-0 -translate-y-1/2 rounded-full p-1.5 hidden md:flex"
            onClick={scrollRight}
            size="icon"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
