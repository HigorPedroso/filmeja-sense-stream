
import React from 'react';
import { Check } from 'lucide-react';

interface BenefitCardProps {
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ title, description }) => {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex-shrink-0 mt-1">
        <div className="bg-filmeja-purple/20 rounded-full p-1">
          <Check className="h-5 w-5 text-filmeja-purple" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default BenefitCard;
