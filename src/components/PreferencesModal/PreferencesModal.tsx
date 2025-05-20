import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface PreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreferences: {
    genres: string[];
    moods: string[];
  };
  onSave: (preferences: { genres: string[]; moods: string[] }) => Promise<void>;
}

const AVAILABLE_GENRES = [
  "Ação", "Aventura", "Animação", "Comédia", "Crime",
  "Documentário", "Drama", "Família", "Fantasia", "Terror",
  "Musical", "Mistério", "Romance", "Ficção Científica", "Suspense"
];

const AVAILABLE_MOODS = [
  "Alegre", "Relaxante", "Emocionante", "Inspirador",
  "Romântico", "Tenso", "Misterioso", "Nostálgico",
  "Reflexivo", "Divertido"
];

export function PreferencesModal({
  isOpen,
  onOpenChange,
  currentPreferences,
  onSave,
}: PreferencesModalProps) {
  const [selectedGenres, setSelectedGenres] = useState(currentPreferences.genres);
  const [selectedMoods, setSelectedMoods] = useState(currentPreferences.moods);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        genres: selectedGenres,
        moods: selectedMoods,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-filmeja-dark/95 border-filmeja-purple/20">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-200 transform hover:scale-110 z-50 group"
        >
          <X className="w-5 h-5 text-white/70 group-hover:text-white" />
        </button>

        <div className="py-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Editar Preferências
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-3">Gêneros Favoritos</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((genre) => (
                  <motion.button
                    key={genre}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedGenres.includes(genre)
                        ? "bg-filmeja-purple text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {genre}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-medium mb-3">Humores Preferidos</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MOODS.map((mood) => (
                  <motion.button
                    key={mood}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleMood(mood)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedMoods.includes(mood)
                        ? "bg-filmeja-blue text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {mood}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-filmeja-purple hover:bg-filmeja-purple/90"
            >
              {isSaving ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}