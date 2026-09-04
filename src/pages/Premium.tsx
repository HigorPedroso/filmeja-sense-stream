import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { PremiumPaywallContent } from "@/components/Premium/PremiumPaywallContent";

const Premium = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  // Routes don't get exit animations for free (no AnimatePresence around
  // <Routes>), so we fake it: animate back down first, then navigate away
  // once that animation actually finishes.
  const handleClose = () => setIsClosing(true);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: isClosing ? "100%" : 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (isClosing) navigate(-1);
      }}
      className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={handleClose}
          className="text-gray-300 hover:text-white p-1 -ml-1 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("onboarding.buttons.back")}</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <PremiumPaywallContent onClose={handleClose} />
      </div>
    </motion.div>
  );
};

export default Premium;
