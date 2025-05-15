import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GenreModal from "./GenreModal";
import { ContentItem } from "@/types/movie";

const genres = [
  { name: "Ação", color: "bg-red-500", id: 28 },
  { name: "Comédia", color: "bg-yellow-500", id: 35 },
  { name: "Terror", color: "bg-purple-500", id: 27 },
  { name: "Suspense", color: "bg-blue-500", id: 53 },
  { name: "Romance", color: "bg-pink-500", id: 10749 },
  { name: "Animação", color: "bg-green-500", id: 16 },
  { name: "Ficção Científica", color: "bg-orange-500", id: 878 },
  { name: "Drama", color: "bg-indigo-500", id: 18 },
];

const GenreSelector = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAnimatedIndex, setCurrentAnimatedIndex] = useState(0);
  const navigate = useNavigate();

  const fetchRecommendations = async (genreId: number) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&with_genres=${genreId}&sort_by=popularity.desc&page=1`
      );
      const data = await response.json();
      return data.results.slice(0, 3);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return [];
    }
  };

  const handleGenreClick = async (genre: (typeof genres)[0]) => {
    setLoading(true);
    setSelectedGenre(genre.name);
    setIsModalOpen(true); // Open modal first

    // Then fetch data with delay
    const [items] = await Promise.all([
      fetchRecommendations(genre.id),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);

    setRecommendations(items);
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnimatedIndex((prev) => (prev + 1) % genres.length);
    }, 1000); // Change button every 2 seconds
  
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Qual seu gênero favorito de filme?
          </h2>
          <p className="text-gray-300">
            Escolha um gênero e descubra recomendações especiais para você
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {genres.map((genre, index) => (
            <button
            key={genre.name}
            onClick={() => handleGenreClick(genre)}
            className={`${genre.color} transition-all duration-500 ease-in-out
              rounded-lg py-4 px-6 text-center text-white font-medium shadow-lg
              ${index === currentAnimatedIndex ? 'scale-110 shadow-xl z-10' : 'scale-100'}
              hover:opacity-90 hover:scale-105`}
          >
            {genre.name}
          </button>
          ))}
        </div>
      </div>

      <GenreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        genre={selectedGenre || ""}
        items={recommendations}
        loading={loading}
      />
    </section>
  );
};

export default GenreSelector;
