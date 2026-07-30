import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AiChat } from "@/components/AiChat/AiChat";
import { supabase } from "@/integrations/supabase/client";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { fetchContentWithProviders, searchContentByTitle } from "@/lib/utils/tmdb";

const FilminChat = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { setShowRecommendationModal, setMoodRecommendation, setIsLoadingRecommendation } =
    useRecommendationResult();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const handleShowContent = async (title: string, type?: "movie" | "tv") => {
    setShowRecommendationModal(true);
    setIsLoadingRecommendation(true);
    // Unlike ContentModal (which watches its own isOpen prop and navigates
    // for us), this page has no modal mounted — so it has to push the result
    // screen itself. The fetch keeps running in the shared context after we
    // leave, same as every other trigger.
    navigate("/recomendacao");
    try {
      const item = await searchContentByTitle(title, type);
      await fetchContentWithProviders(item, {
        onLoadingChange: setIsLoadingRecommendation,
        onContentFetched: setMoodRecommendation,
      });
    } catch {
      setShowRecommendationModal(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <AiChat
        fullScreen
        headerLeft={
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white p-1 -ml-1 flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        }
        onShowContent={handleShowContent}
        userAvatar={currentUser?.user_metadata?.avatar_url}
        userId={currentUser?.id}
      />
    </div>
  );
};

export default FilminChat;
