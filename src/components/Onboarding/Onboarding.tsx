import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// Remove these lines
import { createClient } from "@supabase/supabase-js";

import { Progress } from "@/components/ui/progress";
import { OnboardingStep } from "./OnboardingStep";

// Keep using the imported supabase client
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "../ui/dialog";

interface UserPreferences {
  genres: string[];
  contentType: string;
  watchDuration: string;
  languages: string[];
  watchTime: string;
}

const STORAGE_KEY = "filmeja_onboarding_progress";

interface OnboardingProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentPreferences?: {
    genres: string[];
    moods: string[];
    content_type: string;
    watch_duration: string;
    watch_time: string;
  };
  onComplete?: (preferences: {
    genres: string[];
    moods: string[];
    contentType: string;
    watchDuration: string;
    watchTime: string;
  }) => Promise<void>;
  isEditing?: boolean;
}

export const Onboarding = ({
  isOpen,
  onOpenChange,
  currentPreferences,
  onComplete,
  isEditing = false,
}: OnboardingProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (currentPreferences) {
      return {
        genres: currentPreferences.genres || [],
        contentType: "",
        watchDuration: "",
        languages: [],
        watchTime: "",
      };
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          genres: [],
          contentType: "",
          watchDuration: "",
          languages: [],
          watchTime: "",
        };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const steps = [
    {
      key: "genres",
      title: "Quais tipos de filmes ou séries você mais gosta de assistir?",
      subtitle: "Selecione quantos quiser",
      options: [
        { id: "action", label: "Ação", icon: "🎬" },
        { id: "comedy", label: "Comédia", icon: "🤡" },
        { id: "romance", label: "Romance", icon: "😍" },
        { id: "horror", label: "Terror", icon: "😱" },
        { id: "psychological", label: "Drama Psicológico", icon: "🧠" },
        { id: "fantasy", label: "Fantasia", icon: "🧙" },
        { id: "scifi", label: "Ficção Científica", icon: "🚀" },
        { id: "mystery", label: "Mistério", icon: "🕵️" },
        { id: "documentary", label: "Documentário", icon: "📜" },
        { id: "family", label: "Família / Infantil", icon: "🧒" },
      ],
      type: "multiple" as "multiple" | "single",
    },
    {
      key: "contentType",
      title: "Você prefere assistir...",
      options: [
        { id: "movies", label: "Filmes", icon: "📽️" },
        { id: "series", label: "Séries", icon: "📺" },
        { id: "both", label: "Tanto faz", icon: "🤷" },
      ],
      type: "single" as "multiple" | "single",
    },
    {
      key: "watchDuration",
      title: "Por quanto tempo você geralmente assiste?",
      options: [
        { id: "short", label: "Menos de 30 minutos", icon: "🕐" },
        { id: "medium", label: "Até 1 hora", icon: "🕒" },
        { id: "long", label: "Mais de 1 hora", icon: "🕕" },
        { id: "exploring", label: "Estou só explorando", icon: "📆" },
      ],
      type: "single" as "multiple" | "single",
    },
    {
      key: "languages",
      title: "Quais idiomas você prefere para assistir?",
      subtitle: "Selecione um ou mais idiomas",
      options: [
        { id: "pt", label: "Português", icon: "🇧🇷" },
        { id: "en", label: "Inglês", icon: "🇺🇸" },
        { id: "es", label: "Espanhol", icon: "🇪🇸" },
        { id: "any", label: "Sem preferência", icon: "🌍" },
      ],
      type: "multiple" as "multiple" | "single",
    },
    {
      key: "watchTime",
      title: "Em que horário costuma assistir com mais frequência?",
      options: [
        { id: "morning", label: "Manhã (6h-12h)", icon: "🌅" },
        { id: "afternoon", label: "Tarde (12h-18h)", icon: "🌞" },
        { id: "evening", label: "Noite (18h-24h)", icon: "🌙" },
        { id: "dawn", label: "Madrugada (0h-6h)", icon: "🌠" },
      ],
      type: "single" as "multiple" | "single",
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
  }

  const savePreferences = async () => {
    try {
      if (onComplete) {
        await onComplete({
          genres: preferences.genres,
          moods: preferences.languages,
          contentType: preferences.contentType,
          watchDuration: preferences.watchDuration,
          watchTime: preferences.watchTime
        });
        if (onOpenChange) {
          onOpenChange(false);
        }
      } else {
        // Original onboarding flow
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Erro de autenticação",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        const { error } = await supabase.from("user_preferences").upsert({
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
        window.location.href = "/dashboard";
      }

      toast({
        title: isEditing ? "Preferências atualizadas!" : "Preferências salvas!",
        description: isEditing
          ? "Suas preferências foram atualizadas com sucesso."
          : "Seu perfil foi configurado com sucesso.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Erro ao salvar preferências",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const content = (
    <div className="min-h-[80vh] sm:min-h-screen bg-filmeja-dark flex items-center justify-center p-2 sm:p-6">
      <motion.div
        className="w-full bg-black/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-8 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Progress
          value={(currentStep / steps.length) * 100}
          className="mb-3 sm:mb-8"
        />

        <AnimatePresence mode="wait">
          <OnboardingStep
            key={currentStep}
            step={steps[currentStep]}
            value={preferences[steps[currentStep].key as keyof UserPreferences]}
            onChange={(value) => {
              setPreferences((prev) => ({
                ...prev,
                [steps[currentStep].key]: value,
              }));
            }}
          />
        </AnimatePresence>

        <div className="flex justify-between mt-3 sm:mt-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 0}
            className="text-xs sm:text-base px-2 sm:px-4"
          >
            Voltar
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-xs sm:text-base px-2 sm:px-4"
              onClick={savePreferences}
            >
              Concluir
            </Button>
          ) : (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-xs sm:text-base px-2 sm:px-4"
              onClick={() => setCurrentStep((prev) => prev + 1)}
            >
              Continuar
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );

  return isOpen !== undefined ? (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl bg-filmeja-dark/95 border-filmeja-purple/20 p-1 sm:p-6">
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    content
  );
};
