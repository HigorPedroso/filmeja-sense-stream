import React, { createContext, useContext, useState } from "react";
import { ContentType } from "@/components/ContentModal/types";

interface RecommendationResultContextValue {
  showRecommendationModal: boolean;
  setShowRecommendationModal: (open: boolean) => void;
  moodRecommendation: ContentType | null;
  setMoodRecommendation: React.Dispatch<React.SetStateAction<ContentType | null>>;
  isLoadingRecommendation: boolean;
  setIsLoadingRecommendation: (loading: boolean) => void;
}

const RecommendationResultContext = createContext<RecommendationResultContextValue | undefined>(
  undefined
);

// Lives above <Routes> so it survives the navigation to the mobile result
// screen: the fetch that's already in flight keeps writing here even after
// the page that started it (Dashboard, sidebars, ...) has unmounted.
export function RecommendationResultProvider({ children }: { children: React.ReactNode }) {
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [moodRecommendation, setMoodRecommendation] = useState<ContentType | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  return (
    <RecommendationResultContext.Provider
      value={{
        showRecommendationModal,
        setShowRecommendationModal,
        moodRecommendation,
        setMoodRecommendation,
        isLoadingRecommendation,
        setIsLoadingRecommendation,
      }}
    >
      {children}
    </RecommendationResultContext.Provider>
  );
}

export function useRecommendationResult() {
  const ctx = useContext(RecommendationResultContext);
  if (!ctx) {
    throw new Error("useRecommendationResult must be used within a RecommendationResultProvider");
  }
  return ctx;
}
