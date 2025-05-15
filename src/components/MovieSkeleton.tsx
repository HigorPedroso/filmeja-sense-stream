
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MovieSkeletonProps {
  size?: 'small' | 'medium' | 'large';
}

const MovieSkeleton: React.FC<MovieSkeletonProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-36 h-56',
    medium: 'w-44 h-64',
    large: 'w-56 h-80',
  };

  return (
    <div className={`${sizeClasses[size]} rounded overflow-hidden`}>
      <Skeleton className="w-full h-full bg-gray-800/50" />
    </div>
  );
};

export default MovieSkeleton;
