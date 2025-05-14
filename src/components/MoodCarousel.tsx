
import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_MOOD_OPTIONS } from '@/lib/tmdb';

const MoodCarousel: React.FC = () => {
  // Duplicate the array for infinite scrolling effect
  const duplicatedMoods = [...MOCK_MOOD_OPTIONS, ...MOCK_MOOD_OPTIONS];
  
  return (
    <div className="relative py-5 bg-gradient-to-r from-filmeja-dark/90 via-filmeja-dark to-filmeja-dark/90 border-t border-white/10 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-filmeja-dark to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-filmeja-dark to-transparent z-10"></div>
      
      <div className="flex items-center overflow-hidden">
        <div className="flex animate-scroll space-x-6 py-2">
          {duplicatedMoods.map((mood, index) => (
            <Link
              key={`${mood.id}-${index}`}
              to={`/mood?type=${mood.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-filmeja-purple/20 rounded-full transition-all duration-300 hover:scale-105"
            >
              <span className="text-2xl" aria-hidden="true">{mood.icon}</span>
              <span className="text-white font-medium whitespace-nowrap">{mood.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodCarousel;
