import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import AvatarSelectionModal from "./AvatarSelectionModal";
import { Coins, Crown } from "lucide-react";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import PremiumPaymentModal from "./PremiumPaymentModal";
import PaymentSuccessModal from "./PaymentSuccessModal";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";
import { getLocalDateString } from "@/lib/utils/date";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { DAILY_FREE_LIMIT } from "@/lib/recommendations/fetchMoodRecommendation";

const HeaderDashboard = () => {
  const { user } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const isPremium = usePremiumStatus();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const randomAvatarId = Math.floor(Math.random() * 100);
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAvatarId}`;

  // Check for payment success/cancel query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get("payment");

    if (paymentStatus === "success") {
      // Show success modal instead of toast
      setIsSuccessModalOpen(true);

      // Remove query params after showing modal
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      checkCredits();
    } else if (paymentStatus === "canceled") {
      toast({
        title: "Pagamento cancelado",
        description:
          "O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });

      // Remove query params after showing toast
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [location.search, toast]);

  // Add these new states at the top with other states
  const [dailyCredits, setDailyCredits] = useState<number | null>(null);

  // Free-tier usage credits shown next to the "Assinar Premium" CTA.
  // Premium status itself now comes from usePremiumStatus (profiles.is_premium).
  const checkCredits = async () => {
    if (user && !isCheckingStatus) {
      setIsCheckingStatus(true);
      try {
        // Get remaining recommendation credits
        const { data: viewStats } = await supabase
          .from("user_recommendation_views")
          .select("daily_views, monthly_views, view_date")
          .eq("user_id", user.id)
          .order("view_date", { ascending: false })
          .limit(1)
          .single();

        const today = getLocalDateString();
        const currentMonth = today.slice(0, 7); // 'YYYY-MM'
        let dailyViews = viewStats?.daily_views || 0;
        let monthlyViews = viewStats?.monthly_views || 0;
        let lastViewDate = viewStats?.view_date;
        const lastViewMonth = lastViewDate ? lastViewDate.slice(0, 7) : null;

        // Reset daily views if it's a new day
        if (lastViewDate !== today) {
          dailyViews = 0;
        }

        // Reset monthly views if it's a new month
        if (lastViewMonth !== currentMonth) {
          monthlyViews = 0;
        }

        // Upsert to update the view_date, daily_views, and monthly_views if needed
        if (lastViewDate !== today || lastViewMonth !== currentMonth) {
          await supabase.from("user_recommendation_views").upsert(
            {
              user_id: user.id,
              view_date: today,
              daily_views: dailyViews,
              monthly_views: monthlyViews,
            },
            {
              onConflict: ["user_id", "view_date"], // <- define os campos únicos
            }
          );
        }

        const dailyRemaining = DAILY_FREE_LIMIT - dailyViews;

        setDailyCredits(Math.max(0, dailyRemaining));
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    }
  };

  // Fetch remaining free-tier credits on mount and when user changes.
  useEffect(() => {
    checkCredits();
  }, [user]);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // The user metadata will be updated automatically through auth state change
    setIsAvatarModalOpen(false);
  };

  const handlePremiumSuccess = () => {
    setIsPremiumModalOpen(false);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    checkCredits();
  };

  if (!user) return null;

  return (
    <>
      <header
        className="sticky top-0 z-10 px-4"
        style={{ paddingTop: "max(1.75rem, calc(0.75rem + env(safe-area-inset-top)))" }}
      >
        <div className="flex justify-between md:justify-end items-center">
          <span className="text-white font-bold text-lg drop-shadow-md md:hidden">
            <span className="text-filmeja-purple">Filme</span>Já
          </span>

          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <span className="text-white text-sm md:text-base">
                {user.user_metadata?.name || user.email}
              </span>

              {isPremium ? (
                <Badge className="bg-filmeja-purple text-white flex items-center gap-1 text-xs">
                  <Crown className="w-3 h-3" />
                  Premium
                </Badge>
              ) : (
                <div className="flex flex-col items-end">
                  <button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="text-xs text-filmeja-purple hover:underline flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3" />
                    Assinar Premium
                  </button>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-500" />
                    {dailyCredits !== null && `${dailyCredits} de ${DAILY_FREE_LIMIT} hoje`}
                  </span>
                </div>
              )}
            </div>

            <div
              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-filmeja-purple/10
                cursor-pointer transform hover:scale-105 transition-all duration-300
                hover:ring-2 hover:ring-filmeja-purple hover:ring-offset-2 hover:ring-offset-filmeja-dark"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              <img
                src={user.user_metadata?.avatar_url || defaultAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <AvatarSelectionModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onAvatarSelect={handleAvatarUpdate}
        currentAvatar={user.user_metadata?.avatar_url}
      />

      <PremiumPaymentModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={handlePremiumSuccess}
      />

      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
      />
    </>
  );
};

export default HeaderDashboard;
