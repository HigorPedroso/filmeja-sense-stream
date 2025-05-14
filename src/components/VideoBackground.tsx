
import React, { useEffect, useRef, useState } from 'react';
import HeroCarousel from './HeroCarousel';

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
          <HeroCarousel />
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
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/70 to-filmeja-dark z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;
