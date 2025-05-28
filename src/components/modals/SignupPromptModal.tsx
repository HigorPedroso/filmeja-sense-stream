import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Heart, X } from "lucide-react";

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
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>
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