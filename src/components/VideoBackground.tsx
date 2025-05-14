
import HeroCarousel from './HeroCarousel';
import { getTrending } from '@/lib/tmdb';
import { useEffect, useState } from 'react';

const VideoBackground = () => {
  const [videos, setVideos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR&page=1`
        );
        const data = await response.json();
        
        const trailerPromises = data.results.slice(0, 5).map(async (movie: any) => {
          const videoResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
          );
          const videoData = await videoResponse.json();
          
          // Get YouTube trailer with fallback to English language
          let trailer = videoData.results?.find(
            (v: any) => v.type === "Trailer" && v.site === "YouTube"
          );
          
          if (!trailer) {
            const enVideoResponse = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
            );
            const enVideoData = await enVideoResponse.json();
            trailer = enVideoData.results?.find(
              (v: any) => v.type === "Trailer" && v.site === "YouTube"
            );
          }
          
          return trailer?.key || null;
        });

        const trailerKeys = (await Promise.all(trailerPromises))
          .filter((key): key is string => Boolean(key));

        if (trailerKeys.length > 0) {
          setVideos(trailerKeys);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [videos]);

  if (!videos.length) return null;

  return (
    <div className="fixed inset-0 -z-5">
      <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/80 via-filmeja-dark/70 to-filmeja-dark/80 z-20" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative w-full h-full">
          <iframe
            key={videos[currentIndex]}
            src={`https://www.youtube.com/embed/${videos[currentIndex]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videos[currentIndex]}&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute w-full h-full scale-150 origin-center"
            style={{
              pointerEvents: 'none',
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoBackground;