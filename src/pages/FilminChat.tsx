import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AiChat } from "@/components/AiChat/AiChat";
import { useAuth } from "@/hooks/useAuth";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { fetchContentWithProviders, searchContentByTitle, describeAiRecommendationError } from "@/lib/utils/tmdb";
import { toast } from "@/hooks/use-toast";

const FilminChat = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  // Shared app-wide auth state, already resolved by the time the user has
  // navigated this deep — avoids the redundant per-mount getUser() call that
  // used to block this whole screen behind a blank background while it
  // resolved.
  const { user: currentUser } = useAuth();
  const { setShowRecommendationModal, setMoodRecommendation, setIsLoadingRecommendation } =
    useRecommendationResult();

  const handleShowContent = async (title: string, type?: "movie" | "tv", releaseYear?: number) => {
    setShowRecommendationModal(true);
    setIsLoadingRecommendation(true);
    // Unlike ContentModal (which watches its own isOpen prop and navigates
    // for us), this page has no modal mounted — so it has to push the result
    // screen itself. The fetch keeps running in the shared context after we
    // leave, same as every other trigger.
    navigate("/recomendacao");
    try {
      const item = await searchContentByTitle(title, type, releaseYear);
      await fetchContentWithProviders(item, {
        requireRegionAvailability: true,
        onLoadingChange: setIsLoadingRecommendation,
        onContentFetched: setMoodRecommendation,
      });
    } catch (error) {
      toast({ ...describeAiRecommendationError(error), variant: "destructive" });
      setShowRecommendationModal(false);
    }
  };

  if (!currentUser || !conversationId) return null;

  return (
    <div
      className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <AiChat
        key={conversationId}
        conversationId={conversationId}
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
        userId={currentUser?.id}
        userName={currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name}
      />
    </div>
  );
};

export default FilminChat;
