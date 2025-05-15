
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { MOCK_MOOD_OPTIONS } from '@/lib/tmdb';
import { getRecommendationsByMood } from '@/lib/tmdb';
import { ContentItem, MoodType } from '@/types/movie';
import MovieCard from '@/components/MovieCard';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lock, Star } from "lucide-react";
import MovieSkeleton from "@/components/MovieSkeleton";

const MoodSelection = () => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    setShowModal(true);
    setIsLoading(true);
    
    try {
      const results = await getRecommendationsByMood(mood);
      setRecommendations(results);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetRecommendations = async () => {
    if (selectedMood) {
      setIsLoading(true);
      try {
        const results = await getRecommendationsByMood(selectedMood);
        setRecommendations(results);
        setShowRecommendations(true);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleReset = () => {
    setSelectedMood(null);
    setShowRecommendations(false);
    setRecommendations([]);
  };
  
  return (
    <div className="min-h-screen bg-filmeja-dark flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-24 md:py-28 max-w-6xl">
        {!showRecommendations ? (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Como você está se sentindo hoje?</h1>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Escolha seu humor atual e descubra filmes e séries que combinam perfeitamente com o seu momento.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {MOCK_MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id as MoodType)}
                  className={`glass-card p-6 rounded-lg flex flex-col items-center transition-all ${
                    selectedMood === mood.id 
                      ? 'border-2 border-filmeja-purple bg-filmeja-purple/20' 
                      : 'border border-white/10 hover:border-filmeja-purple/50'
                  }`}
                >
                  <div className="text-4xl mb-3">{mood.icon}</div>
                  <h3 className="text-lg font-medium text-white mb-1">{mood.label}</h3>
                  <p className="text-sm text-gray-300">{mood.description}</p>
                </button>
              ))}
            </div>
            
            <Button 
              onClick={handleGetRecommendations} 
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white"
              disabled={!selectedMood || isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando recomendações...
                </>
              ) : (
                'Ver recomendações'
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Recomendações para você que está
                  {MOCK_MOOD_OPTIONS.find(m => m.id === selectedMood)?.label && (
                    <span className="ml-1 text-filmeja-purple">
                      {MOCK_MOOD_OPTIONS.find(m => m.id === selectedMood)?.label?.toLowerCase()}
                    </span>
                  )}
                </h2>
                <p className="text-gray-300 mt-1">
                  Encontramos conteúdos que combinam com o seu humor!
                </p>
              </div>
              <Button
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={handleReset}
              >
                Mudar humor
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.map((item) => (
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
            
            {recommendations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-300 text-lg">
                  Não encontramos recomendações para seu humor atual. 
                  Tente novamente ou escolha um humor diferente.
                </p>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default MoodSelection;
