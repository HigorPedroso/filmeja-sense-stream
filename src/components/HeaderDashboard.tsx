
import { useAuth } from "@/hooks/useAuth";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import AvatarSelectionModal from "./AvatarSelectionModal";
import { Crown } from "lucide-react";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import PremiumPaymentModal from "./PremiumPaymentModal";

const HeaderDashboard = () => {
  const { user } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const randomAvatarId = Math.floor(Math.random() * 100);
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAvatarId}`;

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (user) {
        try {
          const response = await fetch('https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/check-subscription', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
          });
          
          const { isPremium } = await response.json();
          setIsPremium(isPremium);
        } catch (error) {
          console.error("Error checking premium status:", error);
        }
      }
    };
    
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
                <button 
                  onClick={() => setIsPremiumModalOpen(true)}
                  className="text-xs text-filmeja-purple hover:underline flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  Assinar Premium
                </button>
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
    </>
  );
};

export default HeaderDashboard;
