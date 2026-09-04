import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
// Remove these lines
import { createClient } from "@supabase/supabase-js";

import { Progress } from "@/components/ui/progress";
import { OnboardingStep } from "./OnboardingStep";

// Keep using the imported supabase client
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "../ui/dialog";
import { cn } from "@/lib/utils";

interface UserPreferences {
  genres: string[];
  contentType: string;
  watchDuration: string;
  languages: string[];
  watchTime: string;
}

const STORAGE_KEY = "filmeja_onboarding_progress";

// Gates whether Dashboard shows onboarding at all — set once the first-run
// flow finishes. Exported so Dashboard can read it without duplicating the
// key string.
export const ONBOARDING_COMPLETED_KEY = "filmeja_onboarding_completed";

// Preferences are stored in Supabase as these English ids. Exported so other
// screens (e.g. Profile) can translate a stored id back to its Portuguese
// label without duplicating this list.
export const GENRE_OPTIONS: Record<string, { label: string; icon: string }> = {
  action: { label: "Ação", icon: "🎬" },
  comedy: { label: "Comédia", icon: "🤡" },
  romance: { label: "Romance", icon: "😍" },
  horror: { label: "Terror", icon: "😱" },
  psychological: { label: "Drama Psicológico", icon: "🧠" },
  fantasy: { label: "Fantasia", icon: "🧙" },
  scifi: { label: "Ficção Científica", icon: "🚀" },
  mystery: { label: "Mistério", icon: "🕵️" },
  documentary: { label: "Documentário", icon: "📜" },
  family: { label: "Família / Infantil", icon: "🧒" },
};

export const CONTENT_TYPE_OPTIONS: Record<string, { label: string; icon: string }> = {
  movies: { label: "Filmes", icon: "📽️" },
  series: { label: "Séries", icon: "📺" },
  both: { label: "Tanto faz", icon: "🤷" },
};

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  // Tracks whether we're moving forward or back, so the full-screen step
  // transition can slide the right way (native wizard feel).
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
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
      title: t("onboarding.steps.genres.title"),
      subtitle: t("onboarding.steps.genres.subtitle"),
      options: Object.entries(GENRE_OPTIONS).map(([id, { icon }]) => ({ id, label: t(`onboarding.genres.${id}`), icon })),
      type: "multiple" as "multiple" | "single",
    },
    {
      key: "contentType",
      title: t("onboarding.steps.contentType.title"),
      options: Object.entries(CONTENT_TYPE_OPTIONS).map(([id, { icon }]) => ({ id, label: t(`onboarding.contentTypes.${id}`), icon })),
      type: "single" as "multiple" | "single",
    },
    {
      key: "watchDuration",
      title: t("onboarding.steps.watchDuration.title"),
      options: [
        { id: "short", label: t("onboarding.watchDuration.short"), icon: "🕐" },
        { id: "medium", label: t("onboarding.watchDuration.medium"), icon: "🕒" },
        { id: "long", label: t("onboarding.watchDuration.long"), icon: "🕕" },
        { id: "exploring", label: t("onboarding.watchDuration.exploring"), icon: "📆" },
      ],
      type: "single" as "multiple" | "single",
    },
    {
      key: "languages",
      title: t("onboarding.steps.languages.title"),
      subtitle: t("onboarding.steps.languages.subtitle"),
      options: [
        { id: "pt", label: t("onboarding.languages.pt"), icon: "🇧🇷" },
        { id: "en", label: t("onboarding.languages.en"), icon: "🇺🇸" },
        { id: "es", label: t("onboarding.languages.es"), icon: "🇪🇸" },
        { id: "any", label: t("onboarding.languages.any"), icon: "🌍" },
      ],
      type: "multiple" as "multiple" | "single",
    },
    {
      key: "watchTime",
      title: t("onboarding.steps.watchTime.title"),
      options: [
        { id: "morning", label: t("onboarding.watchTime.morning"), icon: "🌅" },
        { id: "afternoon", label: t("onboarding.watchTime.afternoon"), icon: "🌞" },
        { id: "evening", label: t("onboarding.watchTime.evening"), icon: "🌙" },
        { id: "dawn", label: t("onboarding.watchTime.dawn"), icon: "🌠" },
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

  const goNext = () => {
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  };

  const savePreferences = async () => {
    setIsSaving(true);
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
            title: t("onboarding.toasts.authError.title"),
            description: t("onboarding.toasts.authError.description"),
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
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
        window.location.href = "/dashboard";
      }

      toast({
        title: isEditing ? t("onboarding.toasts.updated.title") : t("onboarding.toasts.saved.title"),
        description: isEditing
          ? t("onboarding.toasts.updated.description")
          : t("onboarding.toasts.saved.description"),
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: t("onboarding.toasts.saveError.title"),
        description: t("onboarding.toasts.saveError.description"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const currentValue = preferences[currentStepData.key as keyof UserPreferences];
  const canContinue = Array.isArray(currentValue) ? currentValue.length > 0 : !!currentValue;

  const dialogContent = (
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
            onClick={goBack}
            disabled={currentStep === 0}
            className="text-xs sm:text-base px-2 sm:px-4"
          >
            {t("onboarding.buttons.back")}
          </Button>

          {isLastStep ? (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-xs sm:text-base px-2 sm:px-4"
              onClick={savePreferences}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("onboarding.buttons.finish")}
            </Button>
          ) : (
            <Button
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-xs sm:text-base px-2 sm:px-4"
              onClick={goNext}
            >
              {t("onboarding.buttons.continue")}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );

  // First-run onboarding (no isOpen prop, i.e. not the Profile "edit
  // preferences" dialog): a real full-screen native wizard, not a floating
  // card — pinned header (back + step dots) and pinned bottom CTA, with a
  // horizontal slide between steps.
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  const fullScreenContent = (
    <div className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          aria-hidden={currentStep === 0}
          className={cn(
            "w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors",
            currentStep === 0 ? "opacity-0 pointer-events-none" : "bg-white/5 hover:bg-white/10 active:bg-white/15"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= currentStep ? "bg-filmeja-purple" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <OnboardingStep
              step={currentStepData}
              value={currentValue}
              onChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  [currentStepData.key]: value,
                }))
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="px-4 pt-3 shrink-0 border-t border-white/5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          className="w-full h-12 text-base bg-filmeja-purple hover:bg-filmeja-purple/90 disabled:opacity-40"
          onClick={isLastStep ? savePreferences : goNext}
          disabled={!canContinue || isSaving}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : isLastStep ? t("onboarding.buttons.finish") : t("onboarding.buttons.continue")}
        </Button>
      </div>
    </div>
  );

  return isOpen !== undefined ? (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl bg-filmeja-dark/95 border-filmeja-purple/20 p-1 sm:p-6">
        {dialogContent}
      </DialogContent>
    </Dialog>
  ) : (
    fullScreenContent
  );
};
