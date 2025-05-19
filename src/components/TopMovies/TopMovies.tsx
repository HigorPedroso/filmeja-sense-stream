import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TopTrendingListProps {
  type: 'movie' | 'tv';
  title: string;
  content?: {
    id: number;
    title?: string;
    name?: string;
    poster_path: string;
    providers?: {
      logo_path: string;
      provider_name: string;
    }[];
  }[];
  showFavorites?: boolean;
  showWatched?: boolean;
  favoriteContent?: any[];
  watchedContent?: any[];
  onItemClick: (item: any) => void;
  onFavoriteUpdate?: () => void;
}

const TopTrendingList = ({
  type,
  title,
  content,  // Add this line
  showFavorites,
  showWatched,
  favoriteContent,
  watchedContent,
  onItemClick,
  onFavoriteUpdate,
}: TopTrendingListProps) => {
  const { toast } = useToast();
  const displayContent = showFavorites ? favoriteContent : showWatched ? watchedContent : content;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
      </div>
      
      <div className="relative group">
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={12}
          slidesPerView={1.5}
          navigation
          loop={displayContent?.length > 5}  // Only enable loop if enough items
          breakpoints={{
            480: {
              slidesPerView: 2.2,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 3.2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 4.2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 5.2,
              spaceBetween: 24,
            },
          }}
          className="px-2 sm:px-4 py-2"
        >
          {displayContent?.map((item, index) => (  // Changed from content to displayContent
            <SwiperSlide key={`${item.id}-${type}-${index}`}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer rounded-lg overflow-hidden shadow-lg"
                onClick={() => onItemClick(item)}
              >
                <div className="aspect-[2/3] bg-filmeja-purple/10 relative">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <h3 className="text-white text-sm md:text-base font-medium line-clamp-2"> 
                      {item.title || item.name}
                    </h3>
                    {item.providers && item.providers.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {item.providers.slice(0, 3).map((provider, idx) => (
                          <img
                            key={`${provider.provider_name}-${idx}`}
                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-6 h-6 rounded-full"
                            title={provider.provider_name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default TopTrendingList;
