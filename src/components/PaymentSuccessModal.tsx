import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Check, Sparkles, Star, Crown, Rocket } from "lucide-react";
import confetti from 'canvas-confetti';
import { useNavigate } from "react-router-dom";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_ICONS = [
  <Crown className="w-5 h-5 text-filmeja-purple" />,
  <Sparkles className="w-5 h-5 text-filmeja-purple" />,
  <Star className="w-5 h-5 text-filmeja-purple" />,
  <Rocket className="w-5 h-5 text-filmeja-purple" />,
];

const PaymentSuccessModal = ({ isOpen, onClose }: PaymentSuccessModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = (t("paymentSuccessModal.items", { returnObjects: true }) as string[]).map((text, index) => ({
    icon: ITEM_ICONS[index],
    text,
  }));

  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#6366F1', '#A855F7']
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border-white/10 text-white overflow-hidden">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-6 relative"
            onAnimationComplete={launchConfetti}
          >
            {/* Animated background elements */}
            <motion.div
              className="absolute inset-0 opacity-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    scale: 0
                  }}
                  animate={{
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200,
                    scale: Math.random() * 0.5 + 0.5,
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {i % 2 === 0 ? "✨" : "⭐"}
                </motion.div>
              ))}
            </motion.div>

            {/* Success Icon */}
            <motion.div
              className="mb-8 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-filmeja-purple to-filmeja-blue rounded-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold">{t("paymentSuccessModal.title")}</h2>
              <p className="text-gray-400">
                {t("paymentSuccessModal.subtitle")}
              </p>

              <div className="space-y-4 mt-6">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>

      
            </motion.div>

            
          </motion.div>
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8"
              >
                <Button
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      navigate('/dashboard');
                    }, 300);
                  }}
                  className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 transition-all"
                >
                  {t("paymentSuccessModal.startExploring")}
                </Button>
              </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessModal;