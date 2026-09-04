import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  checkTrialEligibility,
  getCurrentOffering,
  isPremiumEntitlementActive,
  purchasePackage,
  restorePurchases,
} from "@/lib/purchases";
import type { PurchasesOffering, PurchasesPackage, PurchasesIntroPrice } from "@revenuecat/purchases-capacitor";
import type { TFunction } from "i18next";

const FEATURE_ICONS = [Brain, SlidersHorizontal, Zap, MessageSquare, Ban];

// A trial is a $0 introductory offer — a paid intro price (e.g. "$1.99 for
// the first month") uses the same introPrice field but shouldn't be
// advertised as "free trial" copy. Eligibility (has this Apple ID/Google
// account already used this product's trial before) is checked separately
// since RevenueCat surfaces introPrice regardless of whether it's still
// redeemable for this specific subscriber.
function getTrialLabel(t: TFunction, introPrice: PurchasesIntroPrice | null): string | null {
  if (!introPrice || introPrice.price > 0) return null;
  const count = introPrice.periodNumberOfUnits;
  switch (introPrice.periodUnit) {
    case "DAY":
      return t("paywall.trial.days", { count });
    case "WEEK":
      return t("paywall.trial.weeks", { count });
    case "MONTH":
      return t("paywall.trial.months", { count });
    default:
      return null;
  }
}

interface PremiumPaywallContentProps {
  onClose: () => void;
  className?: string;
}

export function PremiumPaywallContent({ onClose, className }: PremiumPaywallContentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const FEATURES = (t("paywall.features", { returnObjects: true }) as string[]).map((label, index) => ({
    icon: FEATURE_ICONS[index],
    label,
  }));
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringError, setOfferingError] = useState<string | null>(null);
  const [trialEligibility, setTrialEligibility] = useState<Record<string, boolean>>({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;
    getCurrentOffering()
      .then((result) => {
        setOffering(result);
        if (!result) {
          setOfferingError("Nenhuma offering \"current\" retornada pelo RevenueCat.");
          return;
        }
        const productIds = [result.monthly?.product.identifier, result.annual?.product.identifier].filter(
          (id): id is string => !!id
        );
        return checkTrialEligibility(productIds).then(setTrialEligibility);
      })
      .catch((error) => {
        console.error("[purchases] failed to load offering", error);
        // Temporary: surface the raw RevenueCat/StoreKit error on screen so we
        // can diagnose the iOS "planos indisponíveis" report without device
        // console access. Remove once the root cause is fixed.
        const detail = [error?.code, error?.message || error?.underlyingErrorMessage]
          .filter(Boolean)
          .join(": ");
        setOfferingError(detail || String(error));
      });
  }, [isNative]);

  const monthlyPackage = offering?.monthly ?? null;
  const annualPackage = offering?.annual ?? null;
  const selectedPackage: PurchasesPackage | null =
    selectedPlan === "monthly" ? monthlyPackage : annualPackage;

  const monthlyTrialLabel =
    monthlyPackage && trialEligibility[monthlyPackage.product.identifier]
      ? getTrialLabel(t, monthlyPackage.product.introPrice)
      : null;
  const annualTrialLabel =
    annualPackage && trialEligibility[annualPackage.product.identifier]
      ? getTrialLabel(t, annualPackage.product.introPrice)
      : null;
  const selectedTrialLabel = selectedPlan === "monthly" ? monthlyTrialLabel : annualTrialLabel;

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
        title: t("paywall.toasts.webComingSoon.title"),
        description: t("paywall.toasts.webComingSoon.subscribeDescription"),
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: t("paywall.toasts.plansUnavailable.title"),
        description: offeringError
          ? t("paywall.toasts.plansUnavailable.descriptionWithDetail", { detail: offeringError })
          : t("paywall.toasts.plansUnavailable.description"),
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const customerInfo = await purchasePackage(selectedPackage);
      if (isPremiumEntitlementActive(customerInfo)) {
        unlockPremiumNow();
        toast({
          title: t("paywall.toasts.subscribed.title"),
          description: t("paywall.toasts.subscribed.description"),
        });
      }
    } catch (error: any) {
      if (error?.userCancelled) return;
      console.error("[purchases] purchase failed", error);
      toast({
        title: t("paywall.toasts.subscribeError.title"),
        description: t("paywall.toasts.subscribeError.description"),
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!isNative) {
      toast({
        title: t("paywall.toasts.webComingSoon.title"),
        description: t("paywall.toasts.webComingSoon.restoreDescription"),
      });
      return;
    }

    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (isPremiumEntitlementActive(customerInfo)) {
        unlockPremiumNow();
        toast({
          title: t("paywall.toasts.restored.title"),
          description: t("paywall.toasts.restored.description"),
        });
      } else {
        toast({
          title: t("paywall.toasts.noPurchaseFound.title"),
          description: t("paywall.toasts.noPurchaseFound.description"),
        });
      }
    } catch (error) {
      console.error("[purchases] restore failed", error);
      toast({
        title: t("paywall.toasts.restoreError.title"),
        description: t("paywall.toasts.restoreError.description"),
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
            {t("paywall.heroTitle")}{" "}
            <span className="bg-gradient-to-r from-filmeja-purple to-filmeja-blue bg-clip-text text-transparent">
              {t("paywall.heroTitleHighlight")}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {t("paywall.heroSubtitleLine1")}
            <br />
            <span className="text-white font-medium">{t("paywall.heroSubtitleLine2")}</span>
          </p>
        </div>
        <img
          src="/paywall.png"
          alt=""
          className="w-[38%] max-w-[150px] h-auto object-contain flex-shrink-0 drop-shadow-[0_0_25px_rgba(155,135,245,0.35)]"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
        <h2 className="text-white font-semibold mb-3">{t("paywall.unlockTitle")}</h2>
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
            "relative rounded-xl border p-4 text-left transition-colors",
            selectedPlan === "monthly"
              ? "border-filmeja-purple bg-filmeja-purple/10"
              : "border-white/10 bg-white/5"
          )}
        >
          {monthlyTrialLabel && (
            <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              {monthlyTrialLabel}
            </span>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{t("paywall.monthly")}</span>
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
            {monthlyPackage?.product.priceString ?? t("paywall.fallbackPrices.monthly")}
            <span className="text-xs font-normal text-gray-400">{t("paywall.perMonth")}</span>
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
            {t("paywall.bestValue")}
          </span>
          {annualTrialLabel && (
            <span className="absolute -top-2.5 left-3 text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              {annualTrialLabel}
            </span>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{t("paywall.annual")}</span>
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
            {annualPackage?.product.priceString ?? t("paywall.fallbackPrices.annual")}
            <span className="text-xs font-normal text-gray-400">{t("paywall.perYear")}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {t("paywall.equivalentToPerMonth", {
              price: annualPackage?.product.pricePerMonthString ?? t("paywall.fallbackPrices.equivalentPerMonth"),
            })}
          </div>
        </button>
      </div>

      {offeringError && (
        <p className="text-xs text-red-400 text-center mb-3 break-words">
          Debug: {offeringError}
        </p>
      )}

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
        {selectedTrialLabel ? t("paywall.trial.startButton") : t("header.subscribePremium")}
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
        {t("paywall.restorePurchases")}
      </button>

      <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-2">
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-white">
          {t("paywall.continueFree")}
        </button>
        <p className="text-xs text-gray-500">
          {selectedTrialLabel
            ? t("paywall.trial.footerNote", {
                price: selectedPackage?.product.priceString ?? t(`paywall.fallbackPrices.${selectedPlan}`),
              })
            : t("paywall.cancelAnytime")}
        </p>
      </div>
    </div>
  );
}
