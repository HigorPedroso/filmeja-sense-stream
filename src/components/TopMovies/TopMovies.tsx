import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TopTrendingListProps {
  type: 'movie' | 'tv';
  title: string;
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
  showFavorites,
  showWatched,
  favoriteContent,
  watchedContent,
  onItemClick,
  onFavoriteUpdate,
}: TopTrendingListProps) => {
  const { toast } = useToast();
  const content = showFavorites ? favoriteContent : showWatched ? watchedContent : [];

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {content?.map((item, index) => (
          <motion.div
            key={`${item.id}-${type}-${index}`} // Updated key to ensure uniqueness
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer"
            onClick={() => onItemClick(item)}
          >
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-filmeja-purple/10">
              <img
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={item.title || item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Rest of your component code */}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TopTrendingList;
