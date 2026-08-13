import { useEffect, useState } from "react";
import {
  Brain,
  SlidersHorizontal,
  Zap,
  MessageSquare,
  Ban,
  Crown,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { setPremiumStatusLocally } from "@/hooks/usePremiumStatus";
import {
  getCurrentOffering,
  isPremiumEntitlementActive,
  purchasePackage,
  restorePurchases,
} from "@/lib/purchases";
import type { PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";

const FEATURES = [
  { icon: Brain, label: "Recomendações personalizadas com IA" },
  { icon: SlidersHorizontal, label: "Busque por humor, gênero ou converse com a IA" },
  { icon: Zap, label: "Recomendações ilimitadas, sem espera de anúncio" },
  { icon: MessageSquare, label: "Chat completo com o Filmin.IA" },
  { icon: Ban, label: "Sem anúncios" },
];

interface PremiumPaywallContentProps {
  onClose: () => void;
  className?: string;
}

export function PremiumPaywallContent({ onClose, className }: PremiumPaywallContentProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;
    getCurrentOffering()
      .then(setOffering)
      .catch((error) => console.error("[purchases] failed to load offering", error));
  }, [isNative]);

  const monthlyPackage = offering?.monthly ?? null;
  const annualPackage = offering?.annual ?? null;
  const selectedPackage: PurchasesPackage | null =
    selectedPlan === "monthly" ? monthlyPackage : annualPackage;

  // Flips every premium-gated surface in the app (ads, feature gates, the
  // Crown badge, ...) synchronously — no waiting on a DB round-trip or the
  // realtime subscription to catch up. The `profiles` write below persists
  // it; the revenuecat-webhook Edge Function is the durable source of truth
  // going forward (renewals, cancellations, other devices).
  const unlockPremiumNow = () => {
    setPremiumStatusLocally(true);
    onClose();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      return supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);
    }).catch((error) => console.error("[purchases] failed to persist premium status", error));
  };

  const handleSubscribe = async () => {
    if (!isNative) {
      toast({
        title: "Em breve!",
        description: "As assinaturas Premium chegam em breve na versão web.",
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: "Planos indisponíveis",
        description: "Não foi possível carregar os planos agora. Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const customerInfo = await purchasePackage(selectedPackage);
      if (isPremiumEntitlementActive(customerInfo)) {
        unlockPremiumNow();
        toast({ title: "Assinatura ativada!", description: "Bem-vindo ao FilmeJá Premium." });
      }
    } catch (error: any) {
      if (error?.userCancelled) return;
      console.error("[purchases] purchase failed", error);
      toast({
        title: "Erro ao assinar",
        description: "Não foi possível completar a compra. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!isNative) {
      toast({
        title: "Em breve!",
        description: "A restauração de compras chega em breve na versão web.",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (isPremiumEntitlementActive(customerInfo)) {
        unlockPremiumNow();
        toast({ title: "Assinatura restaurada!", description: "Seu acesso Premium foi reativado." });
      } else {
        toast({
          title: "Nenhuma compra encontrada",
          description: "Não encontramos uma assinatura ativa para esta conta.",
        });
      }
    } catch (error) {
      console.error("[purchases] restore failed", error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar suas compras. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative flex items-center gap-4 pt-2 pb-6">
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
            {monthlyPackage?.product.priceString ?? "R$9,99"}
            <span className="text-xs font-normal text-gray-400">/mês</span>
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
            {annualPackage?.product.priceString ?? "R$71,90"}
            <span className="text-xs font-normal text-gray-400">/ano</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {annualPackage?.product.pricePerMonthString
              ? `Equivale a ${annualPackage.product.pricePerMonthString}/mês`
              : "Equivale a R$5,99/mês"}
          </div>
        </button>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={isPurchasing || isRestoring}
        className="w-full bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 h-12 text-base font-semibold"
      >
        {isPurchasing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Crown className="w-4 h-4 mr-2" />
        )}
        Assinar Premium
      </Button>

      <button
        type="button"
        onClick={handleRestore}
        disabled={isPurchasing || isRestoring}
        className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white py-4 disabled:opacity-50"
      >
        {isRestoring ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" />
        )}
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
