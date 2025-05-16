import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  step: {
    title: string;
    subtitle?: string;
    options: {
      id: string;
      label: string;
      icon?: string;
      description?: string;
    }[];
    type: 'single' | 'multiple';
  };
  value: string | string[];
  onChange: (value: any) => void;
}

export const OnboardingStep = ({ step, value, onChange }: OnboardingStepProps) => {
  const handleSelect = (optionId: string) => {
    if (step.type === 'multiple') {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(optionId)
        ? currentValue.filter(id => id !== optionId)
        : [...currentValue, optionId];
      onChange(newValue);
    } else {
      onChange(optionId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
        {step.subtitle && (
          <p className="text-gray-400">{step.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {step.options.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-200",
              "flex flex-col items-center justify-center gap-3 text-center",
              Array.isArray(value)
                ? value.includes(option.id)
                  ? "border-filmeja-purple bg-filmeja-purple/20"
                  : "border-white/10 hover:border-white/30 bg-black/20"
                : value === option.id
                ? "border-filmeja-purple bg-filmeja-purple/20"
                : "border-white/10 hover:border-white/30 bg-black/20"
            )}
          >
            {option.icon && (
              <span className="text-3xl mb-2">{option.icon}</span>
            )}
            <span className="font-medium text-white">{option.label}</span>
            {option.description && (
              <span className="text-sm text-gray-400">{option.description}</span>
            )}
            {((Array.isArray(value) && value.includes(option.id)) || value === option.id) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-4 h-4 bg-filmeja-purple rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};