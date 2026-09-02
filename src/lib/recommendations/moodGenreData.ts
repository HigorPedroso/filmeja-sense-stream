import { MoodType } from "@/types/movie";

export const moodNames: Record<MoodType, string> = {
  happy: "feliz",
  sad: "triste",
  excited: "animado",
  relaxed: "relaxado",
  romantic: "romântico",
  scared: "assustado",
  thoughtful: "pensativo",
};

export const moodEmojis: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  relaxed: "😌",
  romantic: "🥰",
  thoughtful: "🤔",
  energetic: "⚡",
  nostalgic: "🌟",
  adventurous: "🌎",
  mysterious: "🔍",
};

export const moodDescriptions: Record<MoodType, string> = {
  happy: "Algo divertido e positivo",
  sad: "Preciso de algo reconfortante",
  excited: "Cheio de ação e adrenalina",
  relaxed: "Algo tranquilo para descontrair",
  romantic: "No clima para uma história de amor",
  scared: "Quero sentir medo e tensão",
  thoughtful: "Algo que me faça refletir",
};

// Per-mood accent used by MoodSelectPage — gradient for the icon badge,
// matching glow/border/shadow tints so each card reads as a distinct color
// at a glance instead of a uniform grid.
export const moodColors: Record<MoodType, { gradient: string; glow: string; border: string; shadow: string }> = {
  happy: {
    gradient: "from-yellow-400 to-orange-400",
    glow: "bg-yellow-400/20",
    border: "hover:border-yellow-400/50",
    shadow: "hover:shadow-yellow-400/20",
  },
  sad: {
    gradient: "from-blue-400 to-indigo-500",
    glow: "bg-blue-400/20",
    border: "hover:border-blue-400/50",
    shadow: "hover:shadow-blue-400/20",
  },
  excited: {
    gradient: "from-pink-500 to-red-500",
    glow: "bg-pink-500/20",
    border: "hover:border-pink-500/50",
    shadow: "hover:shadow-pink-500/20",
  },
  relaxed: {
    gradient: "from-emerald-400 to-teal-500",
    glow: "bg-emerald-400/20",
    border: "hover:border-emerald-400/50",
    shadow: "hover:shadow-emerald-400/20",
  },
  romantic: {
    gradient: "from-rose-400 to-pink-500",
    glow: "bg-rose-400/20",
    border: "hover:border-rose-400/50",
    shadow: "hover:shadow-rose-400/20",
  },
  scared: {
    gradient: "from-violet-600 to-purple-800",
    glow: "bg-violet-600/20",
    border: "hover:border-violet-500/50",
    shadow: "hover:shadow-violet-500/20",
  },
  thoughtful: {
    gradient: "from-indigo-400 to-filmeja-purple",
    glow: "bg-indigo-400/20",
    border: "hover:border-indigo-400/50",
    shadow: "hover:shadow-indigo-400/20",
  },
};

export const moodToGenres: Record<string, number[]> = {
  happy: [35, 10402, 12, 16], // Comedy, Musical, Adventure, Animation
  sad: [18, 36, 10749], // Drama, History, Romance
  excited: [28, 878, 10770], // Action, Sci-Fi, TV Movie
  relaxed: [99, 10751], // Documentary, Family
  romantic: [10749, 10402], // Romance, Musical
  scared: [27, 53, 9648], // Horror, Thriller, Mystery
  thoughtful: [18, 878, 9648, 99], // Drama, Sci-Fi, Mystery, Documentary
};

export const moodToGenresTV: Record<string, number[]> = {
  happy: [35, 10762, 16], // Comedy, Kids, Animation
  sad: [18, 10768, 10749], // Drama, War & Politics, Romance
  excited: [10759, 9648, 10765], // Action & Adventure, Mystery, Sci-Fi & Fantasy
  relaxed: [99, 10751], // Documentary, Family
  romantic: [10749, 10766], // Romance, Soap
  scared: [9648, 80, 10765], // Mystery, Crime, Sci-Fi & Fantasy (substitui Horror)
  thoughtful: [18, 99, 9648], // Drama, Documentary, Mystery
};

export const genreCategories = [
  {
    name: "Ação e Aventura",
    icon: "🎬",
    genres: [
      { id: 28, name: "Ação", color: "bg-red-500/20" },
      { id: 12, name: "Aventura", color: "bg-orange-500/20" },
      { id: 53, name: "Thriller", color: "bg-yellow-500/20" },
    ],
  },
  {
    name: "Drama e Emoção",
    icon: "🎭",
    genres: [
      { id: 18, name: "Drama", color: "bg-blue-500/20" },
      { id: 10749, name: "Romance", color: "bg-pink-500/20" },
      { id: 10751, name: "Família", color: "bg-green-500/20" },
    ],
  },
  {
    name: "Fantasia e Ficção",
    icon: "✨",
    genres: [
      { id: 14, name: "Fantasia", color: "bg-purple-500/20" },
      { id: 878, name: "Ficção Científica", color: "bg-indigo-500/20" },
      { id: 16, name: "Animação", color: "bg-cyan-500/20" },
    ],
  },
  {
    name: "Outros Gêneros",
    icon: "🎪",
    genres: [
      { id: 35, name: "Comédia", color: "bg-yellow-400/20" },
      { id: 27, name: "Terror", color: "bg-red-900/20" },
      { id: 9648, name: "Mistério", color: "bg-violet-500/20" },
    ],
  },
];
