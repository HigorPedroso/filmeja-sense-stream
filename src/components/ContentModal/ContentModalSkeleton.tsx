
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const loadingPhrases = [
  "🎬 Preparando a próxima aventura...",
  "✨ Carregando um universo épico...",
  "🍿 Quase lá...",
  "🎥 Revelando histórias incríveis...",
  "🌟 Aquecendo os motores...",
];

export const ContentModalSkeleton = () => {
  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="relative">
            <Skeleton className="w-full aspect-[2/3] rounded-lg bg-white/5" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="text-center px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AnimatePresence mode="wait">
                  {loadingPhrases.map((phrase, index) => (
                    <motion.p
                      key={phrase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [10, 0, 0, -10],
                      }}
                      transition={{
                        duration: 3,
                        times: [0, 0.1, 0.9, 1],
                        repeat: Infinity,
                        repeatDelay: loadingPhrases.length * 3,
                        delay: index * 3,
                      }}
                      className="absolute inset-0 flex items-center justify-center text-sm md:text-base text-white/60 font-medium"
                    >
                      {phrase}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>

          <div className="space-y-2 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          <div className="mb-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="flex flex-wrap gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
