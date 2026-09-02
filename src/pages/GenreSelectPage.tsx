import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { genreCategories } from "@/lib/recommendations/moodGenreData";

// A real page instead of a fixed-position modal over the dashboard — see
// MoodSelectPage.tsx for why.
const GenreSelectPage = () => {
  const navigate = useNavigate();

  const handleSelect = (genre: { id: number; name: string }) => {
    // Dashboard's own effect picks this up and runs the actual
    // recommendation fetch — kept there since it's deeply tied to
    // Dashboard-local state (daily limits, ads, premium gating, ...).
    navigate("/dashboard", { state: { selectGenre: genre } });
  };

  return (
    <div
      className="min-h-[100dvh] bg-filmeja-dark px-4"
      style={{
        paddingTop: "max(2rem, calc(1rem + env(safe-area-inset-top)))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Escolha um Gênero
          </h1>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {genreCategories.map((category) => (
            <div key={category.name} className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {category.genres.map((genre) => (
                  <motion.button
                    key={genre.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(genre)}
                    className={`${genre.color} p-4 rounded-xl text-left transition-all
                   hover:bg-opacity-30 border border-white/10 backdrop-blur-sm
                   group relative overflow-hidden`}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                   translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"
                    />
                    <span className="text-white font-medium">
                      {genre.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenreSelectPage;
