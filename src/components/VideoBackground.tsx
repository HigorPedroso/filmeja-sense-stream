
import React, { useState, useEffect } from 'react';

const VideoBackground = () => {
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  
  // Sample atmospheric video backgrounds
  const backgrounds = [
    'https://assets.mixkit.co/videos/preview/mixkit-star-field-with-slow-movement-31439-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-dark-abstract-waves-background-loop-40144-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-purple-wavy-background-with-dots-40143-large.mp4'
  ];
  
  const randomVideo = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/70 via-filmeja-dark/80 to-filmeja-dark z-10"></div>
      <video
        className={`absolute inset-0 object-cover w-full h-full ${
          videoLoaded ? 'opacity-30' : 'opacity-0'
        } transition-opacity duration-1000`}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={randomVideo} type="video/mp4" />
      </video>
    </div>
  );
};

export default VideoBackground;
