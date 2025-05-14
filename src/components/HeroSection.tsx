
import React from 'react';
import VideoBackground from './VideoBackground';
import ImageBackground from './ImageBackground';

interface HeroSectionProps {
  children?: React.ReactNode;
  useSlideshow?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ children, useSlideshow = true }) => {
  return (
    <ImageBackground useSlideshow={useSlideshow}>
      <div className="container mx-auto flex flex-col justify-center h-full px-4 md:px-6">
        {children}
      </div>
    </ImageBackground>
  );
};

export default HeroSection;
