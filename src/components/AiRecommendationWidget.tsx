import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContentItem } from '@/types/movie';
import { useToast } from '@/components/ui/use-toast';
import MovieCard from './MovieCard';

// Dummy data until AI integration is ready
const mockRecommendation: ContentItem = {
  id: 123456,
  title: 'Interestelar',
  overview: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.',
  poster_path: '/nCbkOyOMTEwlEV0LtCOvCnwEONA.jpg',
  backdrop_path: '/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
  release_date: '2014-11-06',
  vote_average: 8.6,
  media_type: 'movie',
  genre_ids: [12, 18, 878],
  genres: [] // Add empty genres array
};

const AiRecommendationWidget: React.FC = () => {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState<string>("Qual clima você quer sentir hoje?");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<ContentItem | null>(null);

  // Lista de perguntas que a IA faria
  const questions = [
    "Qual clima você quer sentir hoje?",
    "Prefere algo leve ou impactante?",
    "Que tipo de personagem principal você se identifica mais?",
  ];

  const handleNextQuestion = () => {
    if (userAnswer.trim() === "") {
      toast({
        title: "Campo vazio",
        description: "Por favor, responda à pergunta para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulando processamento da IA
    setTimeout(() => {
      if (questionCount < questions.length - 1) {
        setQuestionCount(questionCount + 1);
        setCurrentQuestion(questions[questionCount + 1]);
        setUserAnswer("");
      } else {
        // Final question answered, show recommendation
        setRecommendation(mockRecommendation);
      }
      setIsLoading(false);
    }, 1500);
  };

  const resetQuestions = () => {
    setQuestionCount(0);
    setCurrentQuestion(questions[0]);
    setUserAnswer("");
    setRecommendation(null);
  };

  return (
    <div className="w-full">
      {recommendation ? (
        <div className="flex flex-col items-center">
          <h4 className="text-white mb-3 text-center">Recomendação perfeita para você!</h4>
          <div className="w-full max-w-[180px] mx-auto">
            <MovieCard item={recommendation} size="small" />
          </div>
          <Button 
            onClick={resetQuestions}
            className="mt-4 bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white"
          >
            Nova Recomendação
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <p className="text-white text-center">{currentQuestion}</p>
          
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Sua resposta aqui..."
            className="bg-white/10 border-white/20 text-white"
          />
          
          <Button
            onClick={handleNextQuestion}
            disabled={isLoading}
            className="bg-gradient-to-r from-filmeja-purple to-filmeja-blue text-white"
          >
            {isLoading ? 'Analisando...' : questionCount === questions.length - 1 ? 'Finalizar' : 'Próxima Pergunta'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AiRecommendationWidget;
