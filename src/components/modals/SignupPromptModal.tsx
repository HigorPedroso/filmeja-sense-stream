import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Heart } from "lucide-react";

interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onContinueWithoutAccount: () => void;
}

export function SignupPromptModal({
  isOpen,
  onClose,
  onCreateAccount,
  onContinueWithoutAccount,
}: SignupPromptModalProps) {
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-filmeja-dark/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Heart className="w-6 h-6 text-filmeja-purple" />
            Está gostando do FilmeJá?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-lg">
            Crie sua conta agora mesmo de graça e aproveite mais recomendações
            personalizadas!
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Salve suas preferências e histórico
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Receba recomendações mais precisas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Crie sua lista de favoritos
            </li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={onCreateAccount}
            className="flex-1 bg-filmeja-purple hover:bg-filmeja-purple/90"
          >
            Criar conta
          </Button>
          <Button
            onClick={onContinueWithoutAccount}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Continuar sem conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}