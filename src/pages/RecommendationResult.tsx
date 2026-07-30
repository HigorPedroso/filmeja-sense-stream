import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ContentResultView } from "@/components/ContentModal/ContentResultView";
import { ContentType } from "@/components/ContentModal/types";

const RecommendationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const content = (location.state as { content?: ContentType } | null)?.content;

  useEffect(() => {
    // Reached directly (deep link, refresh, back/forward) without the
    // in-memory result — nothing to show, so bounce back to the dashboard.
    if (!content) {
      navigate("/dashboard", { replace: true });
    }
  }, [content, navigate]);

  if (!content) return null;

  return (
    <div
      className="min-h-[100dvh] bg-filmeja-dark overflow-y-auto px-4"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <ContentResultView content={content} onClose={() => navigate(-1)} />
    </div>
  );
};

export default RecommendationResult;
