
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

const HeaderDashboard = () => {
  const { user } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const randomAvatarId = Math.floor(Math.random() * 100);
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAvatarId}`;

  // Check for payment success/cancel query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Show success modal instead of toast
      setIsSuccessModalOpen(true);
      
      // Remove query params after showing modal
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      // Force refresh subscription status
      checkPremiumStatus();
    } else if (paymentStatus === 'canceled') {
      toast({
        title: "Pagamento cancelado",
        description: "O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      
      // Remove query params after showing toast
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [location.search, toast]);

  // Add these new states at the top with other states
  const [dailyCredits, setDailyCredits] = useState<number | null>(null);
  const [monthlyCredits, setMonthlyCredits] = useState<number | null>(null);
  
  // Update the checkPremiumStatus function
  const checkPremiumStatus = async () => {
    if (user && !isCheckingStatus) {
      setIsCheckingStatus(true);
      try {
        const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
        
        if (!accessToken) {
          console.error("No access token available");
          setIsCheckingStatus(false);
          return;
        }
        
        // Get premium status and credits
        const { data: viewStats } = await supabase
          .from('user_recommendation_views')
          .select('daily_views, monthly_views')
          .eq('user_id', user.id)
          .order('view_date', { ascending: false })
          .limit(1)
          .single();
  
        const dailyRemaining = 1 - (viewStats?.daily_views || 0);
        const monthlyRemaining = 5 - (viewStats?.monthly_views || 0);
        
        setDailyCredits(Math.max(0, dailyRemaining));
        setMonthlyCredits(Math.max(0, monthlyRemaining));
  
        // Check premium status
        const response = await fetch('https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/check-subscription', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        
        const data = await response.json();
        setIsPremium(data.isPremium);
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    }
  };

  // Update the premium badge/button section
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
      <span className="text-xs text-gray-400">
        {dailyCredits !== null && monthlyCredits !== null && (
          `${dailyCredits} hoje • ${monthlyCredits} este mês`
        )}
      </span>
    </div>
  )}

  // Check premium status on mount and when user changes
  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // The user metadata will be updated automatically through auth state change
    setIsAvatarModalOpen(false);
  };

  const handlePremiumSuccess = () => {
    setIsPremium(true);
    setIsPremiumModalOpen(false);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    // Force refresh subscription status after closing the success modal
    checkPremiumStatus();
  };

  if (!user) return null;

  return (
    <>
      <header className="p-4 sticky top-0 z-10">
        <div className="flex justify-end items-center">
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
      {dailyCredits !== null && monthlyCredits !== null && (
        `${dailyCredits} hoje • ${monthlyCredits} este mês`
      )}
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
