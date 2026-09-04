import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { getTmdbLanguage } from "@/lib/tmdbLanguage";
import { Mail } from "lucide-react";

const Privacy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sections = t("privacy.sections", { returnObjects: true }) as {
    title: string;
    content: string[];
  }[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-filmeja-dark via-black to-filmeja-dark">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label={t("common.close")}
        className="fixed z-50 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <X className="w-5 h-5" />
      </button>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t("privacy.title")}
          </h1>
          <p className="text-gray-400">
            {t("privacy.lastUpdated", {
              date: format(new Date(), "PPP", {
                locale: getTmdbLanguage() === "en-US" ? enUS : getTmdbLanguage() === "es-MX" ? es : ptBR,
              }),
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8"
        >
          <p className="text-gray-300 leading-relaxed">
            {t("privacy.intro")}
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-white mb-4">{t("privacy.contactTitle")}</h2>
          <p className="text-gray-300 mb-4">
            {t("privacy.contactDescription")}
          </p>
          <a 
            href="mailto:privacidade@filmeja.com"
            className="inline-flex items-center gap-2 text-filmeja-purple hover:text-filmeja-purple/80 transition-colors"
          >
            <Mail className="w-5 h-5" />
            privacidade@filmeja.com
          </a>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;