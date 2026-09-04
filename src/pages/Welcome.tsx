import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shown once, ever, the very first time the app is opened after install —
// before login/signup even. Pure static intro, no data collected. Separate
// from components/Onboarding/Onboarding.tsx, which is the (currently
// unused) taste-preferences questionnaire shown after login.
export const WELCOME_SEEN_KEY = "filmeja_welcome_seen";

const SLIDE_IMAGES = ["/onboarding1.png", "/onboarding2.png", "/onboarding3.png", "/onboarding4.png"];

// Splits a title around its accent phrase and wraps that phrase in a
// gradient highlight, so each slide has one punchy focal word instead of a
// flat wall of same-weight text.
function AccentedTitle({ title, accent }: { title: string; accent?: string }) {
  if (!accent) return <>{title}</>;
  const idx = title.indexOf(accent);
  if (idx === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-filmeja-purple to-filmeja-blue">
        {accent}
      </span>
      {title.slice(idx + accent.length)}
    </>
  );
}

const Welcome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const translatedSlides = t("welcome.slides", { returnObjects: true }) as {
    title: string;
    accent: string;
    description: string;
  }[];
  const slides = translatedSlides.map((slide, index) => ({ ...slide, heroImage: SLIDE_IMAGES[index] }));
  const isLastStep = step === slides.length - 1;

  const finish = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    navigate("/", { replace: true });
  };

  const goNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  const currentSlide = slides[step];

  return (
    <div className="h-[100dvh] relative bg-filmeja-dark flex flex-col overflow-hidden">
      {/* Decorative glow orbs — same ambient depth as the login screen,
          instead of a flat solid background. */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 bg-filmeja-purple/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 bg-filmeja-blue/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 bg-filmeja-purple-dark/25 rounded-full blur-3xl" />

      <div
        className="relative z-10 flex items-center justify-between px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex-1 flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-filmeja-purple" : "bg-white/10"
              )}
            />
          ))}
        </div>
        {!isLastStep && (
          <button
            type="button"
            onClick={finish}
            className="ml-4 text-sm text-gray-400 hover:text-white shrink-0"
          >
            {t("welcome.skip")}
          </button>
        )}
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center text-center gap-8"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={currentSlide.heroImage}
                alt=""
                className="w-full max-w-[22rem] drop-shadow-[0_0_40px_rgba(139,92,246,0.35)]"
              />
            </motion.div>
            <div className="space-y-3">
              <h1 className="text-[2.25rem] font-extrabold text-white leading-[1.15] tracking-tight">
                <AccentedTitle title={currentSlide.title} accent={currentSlide.accent} />
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-xs mx-auto">{currentSlide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="relative z-10 px-4 pt-3 shrink-0"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 shadow-lg shadow-filmeja-purple/30"
          onClick={goNext}
        >
          {isLastStep ? t("welcome.getStarted") : t("welcome.next")}
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
