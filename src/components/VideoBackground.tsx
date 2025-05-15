
import React, { useState, useEffect } from 'react';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const VideoBackground = () => {
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [trailerUrls, setTrailerUrls] = useState<string[]>([]);
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0);

  const fetchMovieTrailers = async () => {
    try {
      // Fetch popular movies first
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`
      );
      const data = await response.json();
      
      // Get trailers for the first 5 movies
      const trailerPromises = data.results.slice(0, 5).map(async (movie: any) => {
        const videoResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`
        );
        const videoData = await videoResponse.json();
        const trailer = videoData.results.find((v: any) => v.type === "Trailer");
        return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&controls=0&mute=1&loop=1` : null;
      });

      const urls = (await Promise.all(trailerPromises)).filter(Boolean);
      setTrailerUrls(urls);
      setVideoLoaded(true);
    } catch (error) {
      console.error('Error fetching trailers:', error);
    }
  };

  useEffect(() => {
    fetchMovieTrailers();
  }, []);

  useEffect(() => {
    if (trailerUrls.length > 0) {
      const interval = setInterval(() => {
        setCurrentTrailerIndex((prev) => (prev + 1) % trailerUrls.length);
      }, 15000); // Switch every 15 seconds

      return () => clearInterval(interval);
    }
  }, [trailerUrls]);

  return (
    <div className="fixed inset-0 -z-5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/70 via-filmeja-dark/80 to-filmeja-dark z-10"></div>
      {videoLoaded && trailerUrls[currentTrailerIndex] && (
        <iframe
          className="absolute inset-0 w-full h-full opacity-30 transition-opacity duration-1000"
          src={trailerUrls[currentTrailerIndex]}
          allow="autoplay; encrypted-media"
          allowFullScreen
          frameBorder="0"
        />
      )}
    </div>
  );
};

export default VideoBackground;
