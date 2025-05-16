import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import spinSound from '@/assets/sounds/spin.mp3';
import winSound from '@/assets/sounds/win.mp3';

interface SpinnerItem {
  id: number;
  title: string;
  poster_path: string;
}

interface SpinnerWheelProps {
  items: SpinnerItem[];
  onSelection?: (item: SpinnerItem) => void;
}

const SpinnerWheel: React.FC<SpinnerWheelProps> = ({ items = [], onSelection }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const controls = useAnimation();

  const SEGMENT_ANGLE = 360 / 6;
  const MIN_SPINS = 5;
  const SPIN_DURATION = 4;

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Calculate final position
    const randomSegment = Math.floor(Math.random() * 6);
    const totalRotation = 360 * MIN_SPINS + (randomSegment * SEGMENT_ANGLE);
    
    // Animate the wheel
    await controls.start({
      rotate: totalRotation,
      transition: {
        duration: SPIN_DURATION,
        ease: [0.2, 0, 0.2, 1],
      }
    });

    setSelectedIndex(randomSegment);
    setIsSpinning(false);
    
    if (onSelection && items[randomSegment]) {
      onSelection(items[randomSegment]);
    }
  };

  return (
    <div className="relative w-[600px] h-[600px] mx-auto">
      {/* Outer ring decoration */}
      <div className="absolute inset-0 rounded-full border-4 border-filmeja-purple/30 backdrop-blur-sm" />
      
      {/* Spinner wheel */}
      <motion.div
        animate={controls}
        className="relative w-full h-full"
      >
        {items.slice(0, 6).map((item, index) => {
          const angle = (index * SEGMENT_ANGLE) - 60;
          return (
            <div
              key={item.id}
              className="absolute w-[250px] h-[200px] origin-bottom-left"
              style={{
                transform: `rotate(${angle}deg) translateY(-50%)`,
                transformOrigin: 'center',
                left: '50%',
                top: '50%',
              }}
            >
              <motion.div
                className={`relative p-4 backdrop-blur-sm rounded-lg
                  ${selectedIndex === index ? 'ring-2 ring-filmeja-purple' : ''}
                  bg-gradient-to-r from-black/80 to-filmeja-purple/20`}
                animate={{
                  scale: selectedIndex === index ? 1.05 : 1,
                }}
                style={{
                  transform: `rotate(${-angle}deg)`,
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                  alt={item.title}
                  className="w-full h-[120px] object-cover rounded-md"
                />
                <h3 className="mt-2 text-sm text-white font-medium truncate">
                  {item.title}
                </h3>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Center button */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-20 h-20 rounded-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue
          hover:opacity-90 transition-all z-10 ${isSpinning ? 'animate-pulse' : ''}`}
      >
        {isSpinning ? (
          <Pause className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Play className="w-8 h-8 text-white" />
        )}
      </Button>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-8 
        bg-filmeja-purple clip-triangle-down z-20" />
    </div>
  );
};

export default SpinnerWheel;