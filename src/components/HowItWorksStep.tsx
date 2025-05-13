
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface HowItWorksStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ 
  step, 
  title, 
  description, 
  icon 
}) => {
  return (
    <div className="flex flex-col items-center text-center p-6 glass-card rounded-lg transition-all duration-300 hover:border-filmeja-purple hover:scale-105">
      <div className="bg-filmeja-purple p-3 rounded-full mb-4 text-white">
        {icon}
      </div>
      <span className="text-sm font-bold text-filmeja-purple mb-1">PASSO {step}</span>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default HowItWorksStep;
