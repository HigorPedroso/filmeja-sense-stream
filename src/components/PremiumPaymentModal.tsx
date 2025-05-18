import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Check, Crown, X } from "lucide-react";

interface PremiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PremiumPaymentModal = ({ isOpen, onClose, onSuccess }: PremiumPaymentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not found");

      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRODUCT_ID,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout
      const result = await stripe?.redirectToCheckout({
        sessionId: session.id,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border-white/10 text-white">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6"
          >
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-filmeja-purple/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Crown className="w-8 h-8 text-filmeja-purple" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Upgrade para Premium</h2>
              <p className="text-gray-400">Desbloqueie todos os recursos por apenas</p>
              <div className="text-3xl font-bold text-filmeja-purple mt-2">
                R$9,99<span className="text-sm text-gray-400">/mês</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Recomendações personalizadas ilimitadas",
                "Acesso a todos os recursos premium",
                "Suporte prioritário",
                "Sem anúncios",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <Check className="w-5 h-5 text-filmeja-purple" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 transition-all"
            >
              {isLoading ? "Processando..." : "Começar agora"}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Pagamento seguro via Stripe
            </p>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPaymentModal;