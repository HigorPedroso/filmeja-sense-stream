
import React, { useEffect, useRef, useState } from 'react';
import HeroCarousel from './HeroCarousel';
import { getTrending } from '@/lib/tmdb';

interface VideoBackgroundProps {
  videoSrc?: string; 
  fallbackImage?: string;
  children?: React.ReactNode;
  useSlideshow?: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc = "https://assets.nflxext.com/ffe/siteui/acquisition/home/hero-background-desktop.mp4", 
  fallbackImage = "https://assets.nflxext.com/ffe/siteui/vlv3/b8eb602d-55f0-4b9f-a58d-b32a5ce4dd80/e0b42fc2-d3e4-4071-9ae3-371f0e825131/BR-pt-20240318-popsignuptwoweeks-perspective_alpha_website_medium.jpg",
  children,
  useSlideshow = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (useSlideshow) {
      const fetchBackgrounds = async () => {
        try {
          const trending = await getTrending();
          const images = trending
            .filter(item => item.backdrop_path)
            .map(item => `https://image.tmdb.org/t/p/original${item.backdrop_path}`);
          setBackgrounds(images);
        } catch (error) {
          console.error('Failed to fetch backgrounds:', error);
        }
      };
      
      fetchBackgrounds();
    }
  }, [useSlideshow]);

  useEffect(() => {
    if (useSlideshow && backgrounds.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % backgrounds.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(interval);
    }
  }, [useSlideshow, backgrounds.length]);

  useEffect(() => {
    if (useSlideshow) return; // Skip video loading if using slideshow
    
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
    };

    const handleError = () => {
      console.error('Video failed to load');
      setVideoLoaded(false);
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [useSlideshow]);

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] overflow-hidden">
      {useSlideshow ? (
        <div className="absolute inset-0 z-0">
          {backgrounds.length > 0 && (
            <>
              <div
                key={`current-${currentIndex}`}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat slide-enter"
                style={{ 
                  backgroundImage: `url(${backgrounds[currentIndex]})`,
                }}
              />
              <div
                key={`prev-${currentIndex}`}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat slide-exit"
                style={{ 
                  backgroundImage: `url(${backgrounds[(currentIndex - 1 + backgrounds.length) % backgrounds.length]})`,
                }}
              />
            </>
          )}
        </div>
      ) : (
        <>
          {!videoLoaded && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
              style={{ backgroundImage: `url(${fallbackImage})` }}
            />
          )}
          
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover z-0 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </>
      )}
      
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/90 via-filmeja-dark/50 to-filmeja-dark z-10 b"></div>
      
      {/* Content */}
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;
