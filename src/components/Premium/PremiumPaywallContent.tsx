import { useState } from "react";
import {
  Brain,
  SlidersHorizontal,
  Zap,
  MessageSquare,
  MapPin,
  Ban,
  Crown,
  Check,
  RotateCcw,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Brain, label: "Recomendações personalizadas com IA" },
  { icon: SlidersHorizontal, label: "Busque por humor, gênero ou converse com a IA" },
  { icon: Zap, label: "Recomendações ilimitadas, sem espera de anúncio" },
  { icon: MessageSquare, label: "Chat completo com o Filmin.IA" },
  { icon: MapPin, label: "Veja onde assistir em cada streaming" },
  { icon: Ban, label: "Sem anúncios" },
];

interface PremiumPaywallContentProps {
  onClose: () => void;
  className?: string;
}

export function PremiumPaywallContent({ onClose, className }: PremiumPaywallContentProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  const handleSubscribe = () => {
    toast({
      title: "Em breve!",
      description: "As assinaturas Premium voltam em breve por uma nova forma de pagamento.",
    });
  };

  const handleRestore = () => {
    toast({
      title: "Em breve!",
      description: "A restauração de compras estará disponível junto com as assinaturas.",
    });
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-center gap-2 pt-2 pb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-filmeja-purple to-filmeja-blue flex items-center justify-center flex-shrink-0">
          <Film className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-white">
          Filme <span className="text-filmeja-purple">Já</span>
        </span>
      </div>

      <div className="relative flex items-center gap-4 pb-6">
        <div className="pointer-events-none absolute -top-6 right-4 w-40 h-40 rounded-full bg-filmeja-purple/25 blur-3xl -z-10" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white leading-tight">
            Descubra o filme{" "}
            <span className="bg-gradient-to-r from-filmeja-purple to-filmeja-blue bg-clip-text text-transparent">
              perfeito com IA
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Menos tempo procurando.
            <br />
            <span className="text-white font-medium">Mais tempo assistindo.</span>
          </p>
        </div>
        <img
          src="/paywall.png"
          alt=""
          className="w-[38%] max-w-[150px] h-auto object-contain flex-shrink-0 drop-shadow-[0_0_25px_rgba(155,135,245,0.35)]"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
        <h2 className="text-white font-semibold mb-3">Desbloqueie o FilmeJá Premium</h2>
        <ul>
          {FEATURES.map((feature, index) => (
            <li
              key={feature.label}
              className={cn(
                "flex items-center gap-3 py-2.5",
                index !== FEATURES.length - 1 && "border-b border-white/5"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-filmeja-purple/15 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-filmeja-purple" />
              </div>
              <span className="text-sm text-gray-200">{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setSelectedPlan("monthly")}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            selectedPlan === "monthly"
              ? "border-filmeja-purple bg-filmeja-purple/10"
              : "border-white/10 bg-white/5"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Mensal</span>
            <span
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                selectedPlan === "monthly" ? "border-filmeja-purple bg-filmeja-purple" : "border-white/30"
              )}
            >
              {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
          </div>
          <div className="text-lg font-bold text-white">
            R$9,99<span className="text-xs font-normal text-gray-400">/mês</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPlan("annual")}
          className={cn(
            "relative rounded-xl border p-4 text-left transition-colors",
            selectedPlan === "annual"
              ? "border-filmeja-purple bg-filmeja-purple/10"
              : "border-white/10 bg-white/5"
          )}
        >
          <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-filmeja-purple text-white px-2 py-0.5 rounded-full">
            Mais vantajoso
          </span>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Anual</span>
            <span
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                selectedPlan === "annual" ? "border-filmeja-purple bg-filmeja-purple" : "border-white/30"
              )}
            >
              {selectedPlan === "annual" && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
          </div>
          <div className="text-lg font-bold text-white">
            R$71,90<span className="text-xs font-normal text-gray-400">/ano</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Equivale a R$5,99/mês</div>
        </button>
      </div>

      <Button
        onClick={handleSubscribe}
        className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 h-12 text-base font-semibold"
      >
        <Crown className="w-4 h-4 mr-2" />
        Assinar Premium
      </Button>

      <button
        type="button"
        onClick={handleRestore}
        className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white py-4"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Restaurar compras
      </button>

      <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-2">
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-white">
          Continuar com versão gratuita
        </button>
        <p className="text-xs text-gray-500">Cancele quando quiser.</p>
      </div>
    </div>
  );
}
