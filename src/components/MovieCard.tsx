
import { ContentItem } from '@/types/movie';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
  onSave?: () => void;  // Make sure this prop is defined
}

const MovieCard: React.FC<MovieCardProps> = ({ item, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-36 sm:w-40',
    medium: 'w-44 sm:w-48',
    large: 'w-56 sm:w-64'
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const mediaTypeLabel = item.media_type === 'movie' ? 'Filme' : 'Série';
  
  return (
    <Link to={`/details/${item.media_type}/${item.id}`}>
      <div 
        className={`content-card group ${sizeClasses[size]} mx-auto`}
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-md">
          <img 
            src={getImageUrl(item.poster_path)} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-0 right-0 bg-filmeja-purple/90 text-xs font-medium py-1 px-2 rounded-bl-md">
            {mediaTypeLabel}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
            <div className="w-full">
              <h3 className="text-sm font-medium text-white line-clamp-2">{item.title}</h3>
              <div className="flex items-center mt-1">
                <div className="flex items-center bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white ml-0.5">{item.vote_average.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-300 ml-2">
                  {new Date(item.release_date).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
