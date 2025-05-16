import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

import { Progress } from '@/components/ui/progress';
import { OnboardingStep } from './OnboardingStep';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  genres: string[];
  contentType: string;
  watchDuration: string;
  languages: string[];
  watchTime: string;
}

const STORAGE_KEY = 'filmeja_onboarding_progress';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      genres: [],
      contentType: '',
      watchDuration: '',
      languages: [],
      watchTime: '',
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const steps = [
    {
      key: 'genres',
      title: "Quais tipos de filmes ou séries você mais gosta de assistir?",
      subtitle: "Selecione quantos quiser",
      options: [
        { id: 'action', label: 'Ação', icon: '🎬' },
        { id: 'comedy', label: 'Comédia', icon: '🤡' },
        { id: 'romance', label: 'Romance', icon: '😍' },
        { id: 'horror', label: 'Terror', icon: '😱' },
        { id: 'psychological', label: 'Drama Psicológico', icon: '🧠' },
        { id: 'fantasy', label: 'Fantasia', icon: '🧙' },
        { id: 'scifi', label: 'Ficção Científica', icon: '🚀' },
        { id: 'mystery', label: 'Mistério', icon: '🕵️' },
        { id: 'documentary', label: 'Documentário', icon: '📜' },
        { id: 'family', label: 'Família / Infantil', icon: '🧒' },
      ],
      type: 'multiple'
    },
    {
      key: 'contentType',
      title: "Você prefere assistir...",
      options: [
        { id: 'movies', label: 'Filmes', icon: '📽️' },
        { id: 'series', label: 'Séries', icon: '📺' },
        { id: 'both', label: 'Tanto faz', icon: '🤷' },
      ],
      type: 'single'
    },
    {
      key: 'watchDuration',
      title: "Por quanto tempo você geralmente assiste?",
      options: [
        { id: 'short', label: 'Menos de 30 minutos', icon: '🕐' },
        { id: 'medium', label: 'Até 1 hora', icon: '🕒' },
        { id: 'long', label: 'Mais de 1 hora', icon: '🕕' },
        { id: 'exploring', label: 'Estou só explorando', icon: '📆' },
      ],
      type: 'single'
    },
    {
      key: 'languages',
      title: "Quais idiomas você prefere para assistir?",
      subtitle: "Selecione um ou mais idiomas",
      options: [
        { id: 'pt', label: 'Português', icon: '🇧🇷' },
        { id: 'en', label: 'Inglês', icon: '🇺🇸' },
        { id: 'es', label: 'Espanhol', icon: '🇪🇸' },
        { id: 'any', label: 'Sem preferência', icon: '🌍' },
      ],
      type: 'multiple'
    },
    {
      key: 'watchTime',
      title: "Em que horário costuma assistir com mais frequência?",
      options: [
        { id: 'morning', label: 'Manhã (6h-12h)', icon: '🌅' },
        { id: 'afternoon', label: 'Tarde (12h-18h)', icon: '🌞' },
        { id: 'evening', label: 'Noite (18h-24h)', icon: '🌙' },
        { id: 'dawn', label: 'Madrugada (0h-6h)', icon: '🌠' },
      ],
      type: 'single'
    },
  ];

  // Add type definition at the top of the file
  interface Database {
    public: {
      Tables: {
        user_preferences: {
          Row: {
            user_id: string;
            genres: string[];
            content_type: string;
            watch_duration: string;
            languages: string[];
            watch_time: string;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            user_id: string;
            genres: string[];
            content_type: string;
            watch_duration: string;
            languages: string[];
            watch_time: string;
            created_at?: string;
            updated_at?: string;
          };
        };
      };
    };
  };
  
  // Update the supabase client type
  const supabase = createClient<Database>(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );

  const savePreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro de autenticação',
          description: 'Por favor, faça login novamente.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
  
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          genres: preferences.genres,
          content_type: preferences.contentType,
          watch_duration: preferences.watchDuration,
          languages: preferences.languages,
          watch_time: preferences.watchTime,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
  
      if (error) throw error;
  
      localStorage.removeItem(STORAGE_KEY);
      
      // Show success message before navigation
      toast({
        title: 'Preferências salvas!',
        description: 'Seu perfil foi configurado com sucesso.',
      });
  
      // Force reload to update the app state
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Erro ao salvar preferências',
        description: 'Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-filmeja-dark flex items-center justify-center p-4">
      <motion.div 
        className="max-w-4xl w-full bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Progress value={(currentStep / steps.length) * 100} className="mb-8" />
        
        <AnimatePresence mode="wait">
          <OnboardingStep
            key={currentStep}
            step={steps[currentStep]}
            value={preferences[steps[currentStep].key as keyof UserPreferences]}
            onChange={(value) => {
              setPreferences(prev => ({
                ...prev,
                [steps[currentStep].key]: value
              }));
            }}
          />
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            Voltar
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90"
              onClick={savePreferences}
            >
              Concluir
            </Button>
          ) : (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90"
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Continuar
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};