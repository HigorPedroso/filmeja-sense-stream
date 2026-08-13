import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PremiumPaywallContent } from "@/components/Premium/PremiumPaywallContent";

interface PremiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Real checkout is paused (Stripe removed, Google Play Billing pending) —
// PremiumPaywallContent still just shows the "Em breve" messaging either way.
// On mobile this hands off to the dedicated /premium screen instead of a
// boxed dialog, matching the Filmin.IA chat and recommendation-result
// full-screen conventions already used elsewhere in the app.
const PremiumPaymentModal = ({ isOpen, onClose }: PremiumPaymentModalProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobile && isOpen) {
      navigate("/premium");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isOpen]);

  if (isMobile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-filmeja-dark/95 border-white/10 text-white max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <PremiumPaywallContent onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPaymentModal;
