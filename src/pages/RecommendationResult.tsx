import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContentResultView } from "@/components/ContentModal/ContentResultView";
import { ContentModalSkeleton } from "@/components/ContentModal/ContentModalSkeleton";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";

const RecommendationResult = () => {
  const navigate = useNavigate();
  const { showRecommendationModal, isLoadingRecommendation, moodRecommendation, setShowRecommendationModal } =
    useRecommendationResult();

  useEffect(() => {
    // Reached directly (deep link, refresh) without anything in flight —
    // nothing to show, so bounce back to the dashboard.
    if (!showRecommendationModal) {
      navigate("/dashboard", { replace: true });
    }
  }, [showRecommendationModal, navigate]);

  useEffect(() => {
    // Covers leaving via the hardware back button too, not just handleClose.
    return () => setShowRecommendationModal(false);
  }, [setShowRecommendationModal]);

  if (!showRecommendationModal) return null;

  const handleClose = () => {
    // Don't also call navigate() here: flipping this to false is enough —
    // the effect above reacts to it and does the (single) navigation.
    // Calling navigate() from both places raced against each other and
    // could pop the history stack twice, landing on a blank screen.
    setShowRecommendationModal(false);
  };

  return (
    <div
      className="min-h-[100dvh] bg-filmeja-dark overflow-y-auto px-4"
      style={{
        paddingTop: "max(2rem, calc(1rem + env(safe-area-inset-top)))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {isLoadingRecommendation || !moodRecommendation ? (
        <ContentModalSkeleton />
      ) : (
        <ContentResultView content={moodRecommendation} onClose={handleClose} />
      )}
    </div>
  );
};

export default RecommendationResult;
