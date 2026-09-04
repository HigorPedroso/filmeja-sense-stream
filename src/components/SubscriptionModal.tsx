import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Check, AlertCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onCancelSubscription?: () => Promise<void>;
  onUpgradeSubscription?: () => Promise<void>;
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { translateAuthError } from "@/lib/errors/translateAuthError";

export function SubscriptionModal({
  isOpen,
  onClose,
  isPremium,
  onCancelSubscription,
  onUpgradeSubscription
}: SubscriptionModalProps) {
  const { t } = useTranslation();
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const features = t("subscriptionModal.features", { returnObjects: true }) as string[];

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Sessão não encontrada');

      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId: session.user.id
        }
      });

      if (error) {
        console.error('Function error details:', error);
        throw new Error(error.message || 'Erro ao cancelar assinatura');
      }

      await onCancelSubscription?.();
      toast({
        title: t("subscriptionModal.toasts.cancelled.title"),
        description: t("subscriptionModal.toasts.cancelled.description"),
      });
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: t("subscriptionModal.toasts.cancelError.title"),
        description: translateAuthError(error, t("subscriptionModal.toasts.cancelError.fallback")),
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-filmeja-dark/90 rounded-2xl max-w-lg w-full overflow-hidden border border-white/10"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isPremium ? t("subscriptionModal.titleActive") : t("subscriptionModal.titleUpgrade")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {isPremium ? (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>{t("subscriptionModal.activeStatus")}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2">{t("subscriptionModal.planName")}</h3>
                  <p className="text-gray-400 text-sm">{t("subscriptionModal.nextBilling", { date: "15/04/2024" })}</p>
                  <p className="text-gray-400 text-sm">{t("subscriptionModal.priceLabel", { price: "R$9,99/mês" })}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Film className="w-4 h-4" />
                    </motion.div>
                    <span>{t("subscriptionModal.cancelling")}</span>
                  </div>
                ) : (
                  t("subscriptionModal.cancelSubscription")
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2">{t("subscriptionModal.planName")}</h3>
                  <p className="text-gray-400 mb-4">
                    {t("subscriptionModal.unlockDescription", { price: "R$9,99/mês" })}
                  </p>
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-white">
                        <Check className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue"
                onClick={onUpgradeSubscription}
              >
                {t("subscriptionModal.subscribeNow")}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}