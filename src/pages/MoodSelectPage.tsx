import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { MoodType } from "@/types/movie";
import {
  moodNames,
  moodEmojis,
  moodDescriptions,
  moodColors,
} from "@/lib/recommendations/moodGenreData";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { lightImpact } from "@/lib/haptics";

// A real page instead of a fixed-position modal over the dashboard — the
// modal used to visibly drag along with the page behind it during a
// touch-scroll on iOS/WKWebView (position:fixed containing-block quirk that
// overflow-hidden/body-locking couldn't fully suppress). A page navigation
// sidesteps the whole bug class instead of chasing it further.
const MoodSelectPage = () => {
  const navigate = useNavigate();

  const handleSelect = (mood: MoodType) => {
    lightImpact();
    trackEvent("mood_selected", { mood, moodName: moodNames[mood] });
    // Dashboard's own effect picks this up and runs the actual
    // recommendation fetch — kept there since it's deeply tied to
    // Dashboard-local state (daily limits, ads, premium gating, ...).
    navigate("/dashboard", { state: { selectMood: mood } });
  };

  return (
    <div className="min-h-[100dvh] relative bg-filmeja-dark overflow-hidden">
      {/* Decorative glow orbs — same language as Signup */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 bg-filmeja-purple/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 bg-filmeja-blue/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 bg-filmeja-purple-dark/20 rounded-full blur-3xl" />

      <div
        className="relative z-0 px-4"
        style={{
          paddingTop: "max(2rem, calc(1rem + env(safe-area-inset-top)))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-10 text-center"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Como você está se sentindo hoje?
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
              Escolha seu humor e deixe a gente encontrar o filme perfeito
              para você
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {Object.entries(moodNames).map(([mood, name], index) => {
              const colors = moodColors[mood as MoodType];
              return (
                <motion.button
                  key={mood}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(mood as MoodType)}
                  className={`relative flex items-center gap-4 text-left p-4 md:p-5 rounded-2xl
                    bg-white/[0.04] backdrop-blur-xl border border-white/10
                    group overflow-hidden transition-colors
                    ${colors.border} hover:bg-white/[0.07]
                    hover:shadow-lg ${colors.shadow}`}
                >
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colors.glow} blur-2xl`}
                  />

                  <div
                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient}
                      flex items-center justify-center text-2xl shadow-lg
                      group-hover:scale-110 transition-transform duration-300`}
                  >
                    {moodEmojis[mood] || "🎬"}
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base md:text-lg capitalize">
                      {name}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm truncate">
                      {moodDescriptions[mood as MoodType]}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodSelectPage;
