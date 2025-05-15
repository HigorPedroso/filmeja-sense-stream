
import React from 'react';
import { Button } from '@/components/ui/button';
import { MoodType } from '@/types/movie';
import { Smile, Frown, Heart, Angry, Compass } from 'lucide-react';

interface MoodSelectorProps {
  onMoodSelect: (mood: MoodType) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ onMoodSelect }) => {
  const moodOptions: { mood: MoodType; icon: React.ReactNode; label: string }[] = [
    { mood: 'happy', icon: <Smile className="w-6 h-6" />, label: 'Feliz' },
    { mood: 'sad', icon: <Frown className="w-6 h-6" />, label: 'Triste' },
    { mood: 'romantic', icon: <Heart className="w-6 h-6" />, label: 'Romântico' },
    { mood: 'excited', icon: <Compass className="w-6 h-6" />, label: 'Aventura' },
    { mood: 'scared', icon: <Angry className="w-6 h-6" />, label: 'Suspense' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {moodOptions.map((option) => (
        <Button
          key={option.mood}
          variant="outline"
          onClick={() => onMoodSelect(option.mood)}
          className="flex flex-col items-center justify-center p-4 hover:bg-filmeja-purple/20 border-white/10 text-white"
        >
          {option.icon}
          <span className="mt-2">{option.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default MoodSelector;
