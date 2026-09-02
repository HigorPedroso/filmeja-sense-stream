import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, Star, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { ContentModal } from "@/components/ContentModal/ContentModal"; // Add this import at the top
import PremiumPaymentModal from "@/components/PremiumPaymentModal"; // Add this import
import { SignupPromptModal } from "./modals/SignupPromptModal";
import { SignupModal } from "./modals/SignupModal";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { lightImpact } from "@/lib/haptics";
import { translateAuthError } from "@/lib/errors/translateAuthError";

const isIOS = Capacitor.getPlatform() === "ios";

export function MobileSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const {
    moodRecommendation,
    setMoodRecommendation,
    showRecommendationModal,
    setShowRecommendationModal,
    isLoadingRecommendation,
    setIsLoadingRecommendation,
  } = useRecommendationResult();
  const isPremium = usePremiumStatus();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSignupPromptModal, setShowSignupPromptModal] = useState(false);
const [signupName, setSignupName] = useState("");
const [signupEmail, setSignupEmail] = useState("");
const [signupPassword, setSignupPassword] = useState("");
const [signupError, setSignupError] = useState("");
const [isSigningUp, setIsSigningUp] = useState(false);
const [showSignupModal, setShowSignupModal] = useState(false);
const [isAnonymousUser, setIsAnonymousUser] = useState(false);

useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Check if user is anonymous
    if (user) {
      const isAnon = user.is_anonymous;
      setIsAnonymousUser(isAnon);
    }
  };
  fetchUser();
}, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setSignupError("");
  
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
          },
        },
      });
  
      if (error) throw error;
  
      toast({
        title: "Conta criada com sucesso!",
        description: "Enviamos um link de confirmação para o seu e-mail.",
      });
  
      setShowSignupModal(false);
    } catch (error: any) {
      setSignupError(translateAuthError(error, "Erro ao criar conta. Tente novamente."));
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <>
      {moodRecommendation && (
        <ContentModal
          isOpen={showRecommendationModal}
          onOpenChange={setShowRecommendationModal}
          content={moodRecommendation}
          isLoading={isLoadingRecommendation}
          onMarkAsWatched={async (content) => {
            // You can implement this if needed
            console.log("Mark as watched:", content);
          }}
        />
      )}

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 md:hidden z-50",
          isIOS
            ? "px-3"
            : // Android: the safe-area padding below sits under the system
              // navigation bar. Coloring only the <nav> left that strip
              // transparent, so the system nav buttons looked like they
              // were floating over nothing instead of sitting on the tab
              // bar's own color — filling it here too closes that gap.
              "bg-filmeja-dark/90 border-t border-white/10 backdrop-blur-xl"
        )}
        style={{
          paddingBottom: isIOS
            ? "calc(env(safe-area-inset-bottom) + 0.5rem)"
            : "env(safe-area-inset-bottom)",
        }}
      >
        <nav
          className={cn(
            "flex items-stretch justify-around relative",
            isIOS &&
              // iOS 26 "Liquid Glass" look: a floating, heavily translucent,
              // saturated-blur pill instead of an edge-to-edge solid bar.
              // Tinted dark (not white) so it reads as dark glass instead
              // of washed-out gray.
              "mx-auto max-w-md rounded-[28px] border border-white/15 bg-black/50 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden"
          )}
        >
          {isIOS && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          )}
          {[
            {
              key: "home",
              label: "Início",
              icon: Home,
              // On native, the app opens at "/" which renders the same
              // Dashboard as "/dashboard" — both count as the home tab.
              active: isActive("/dashboard") || isActive("/"),
              onClick: () => navigate("/dashboard"),
            },
            {
              key: "favorites",
              label: "Minha Lista",
              icon: Heart,
              active: isActive("/favorites"),
              onClick: () => {
                if (isAnonymousUser) {
                  setShowSignupPromptModal(true);
                } else {
                  navigate("/favorites");
                }
              },
            },
            {
              key: "ai",
              label: "Filmin.IA",
              icon: MessageSquare,
              active: isActive("/filmin-ia"),
              onClick: () => {
                if (isAnonymousUser) {
                  setShowSignupPromptModal(true);
                } else if (!isPremium) {
                  setShowPremiumModal(true);
                } else {
                  navigate("/filmin-ia");
                }
              },
            },
            {
              key: "profile",
              label: "Perfil",
              icon: User,
              active: isActive("/profile"),
              onClick: () => {
                if (isAnonymousUser) {
                  setShowSignupPromptModal(true);
                } else {
                  navigate("/profile");
                }
              },
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                lightImpact();
                tab.onClick();
              }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors active:scale-95",
                tab.active ? "text-filmeja-purple" : "text-gray-400"
              )}
            >
              {isIOS && tab.active && (
                <motion.div
                  layoutId="ios-tab-glass-pill"
                  className="absolute inset-1.5 rounded-2xl bg-white/15"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <tab.icon
                className="h-5 w-5 relative"
                strokeWidth={tab.active ? 2.5 : 2}
                fill={tab.active && tab.key === "favorites" ? "currentColor" : "none"}
              />
              <span
                className={cn(
                  "relative text-[10px] leading-none",
                  tab.active ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <PremiumPaymentModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={() => {
          setShowPremiumModal(false);
        }}
      />

<SignupPromptModal
          isOpen={showSignupPromptModal}
          onClose={() => setShowSignupPromptModal(false)}
          onCreateAccount={() => {
            setShowSignupPromptModal(false);
            setShowSignupModal(true);
          }}
          onContinueWithoutAccount={() => {
            setShowSignupPromptModal(false);
            navigate("/favorites");
          }}
        />

        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSubmit={handleSignup}
          signupName={signupName}
          setSignupName={setSignupName}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          signupError={signupError}
          isSigningUp={isSigningUp}
        />
    </>
  );
}