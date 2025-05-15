import { ContentItem, MoodType } from "@/types/movie";

// Mock data for development (fallback)
export const MOCK_MOVIES: ContentItem[] = [
  {
    id: 1,
    title: "Interestelar",
    poster_path: "/nCbkOyOMTEwlEV0LtCOvCnwEONA.jpg",
    backdrop_path: "/uoT92GJJb2UXmQk9Jf3JJp9hvCh.jpg",
    release_date: "2014-11-07",
    overview: "As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial, possibilitando a continuação da espécie.",
    vote_average: 8.4,
    media_type: "movie",
    genre_ids: [12, 18, 878],
    genres: []
  },
  {
    id: 2,
    title: "À Procura da Felicidade",
    poster_path: "/u9mJRgens5jZQ5UMWGBieKJa6Uj.jpg",
    backdrop_path: "/AnfXhKJwb9YIGugAQPdqv9fJXsu.jpg",
    release_date: "2006-12-15",
    overview: "Chris Gardner é um vendedor talentoso e inteligente, mas seu emprego não paga o suficiente para ele e seu filho. Quando eles são despejados, ele se inscreve para um estágio em uma corretora de valores.",
    vote_average: 8.0,
    media_type: "movie",
    genre_ids: [18],
    genres: []
  },
  {
    id: 3,
    title: "Clube da Luta",
    poster_path: "/r3pPehX4ik8NLYPpbDRAh0YRtMb.jpg",
    backdrop_path: "/nQZB3picKH7XVYpvuGX1jgpq6oy.jpg",
    release_date: "1999-10-15",
    overview: "Um homem deprimido que sofre de insônia conhece um estranho vendedor de sabonetes e juntos formam um clube clandestino onde homens lutam entre si.",
    vote_average: 8.4,
    media_type: "movie",
    genre_ids: [18, 53],
    genres: []
  },
  {
    id: 4,
    title: "Stranger Things",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    release_date: "2016-07-15",
    overview: "Quando um garoto desaparece, a cidade toda participa nas buscas. Mas o que encontram são segredos, forças sobrenaturais e uma menina.",
    vote_average: 8.6,
    media_type: "tv",
    genre_ids: [18, 10765],
    genres: []
  },
  {
    id: 5,
    title: "Breaking Bad",
    poster_path: "/30erzlzIOtOK3k3T3BAl1GiVMP1.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    release_date: "2008-01-20",
    overview: "Ao saber que tem câncer, um professor de química decide fabricar e vender metanfetamina para garantir o futuro da família.",
    vote_average: 8.8,
    media_type: "tv",
    genre_ids: [18, 80],
    genres: []
  },
  {
    id: 6,
    title: "Oppenheimer",
    poster_path: "/c0DCmfC7Et2K3URnIJ4ahJpeXR2.jpg",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    release_date: "2023-07-21",
    overview: "A história do cientista americano J. Robert Oppenheimer e seu papel no desenvolvimento da bomba atômica.",
    vote_average: 8.2,
    media_type: "movie",
    genre_ids: [18, 36],
    genres: []
  },
  {
    id: 7,
    title: "O Menino do Pijama Listrado",
    poster_path: "/zYRk58BJd7bLErTWlx3tVsUUbbV.jpg",
    backdrop_path: "/xwOgAitic6YJOMnqQMGY2fLJhJX.jpg",
    release_date: "2008-09-12",
    overview: "Durante a Segunda Guerra Mundial, Bruno, um garoto de oito anos, e sua família saem de Berlim para residir próximo a um campo de concentração onde seu pai acaba de se tornar comandante.",
    vote_average: 8.1,
    media_type: "movie",
    genre_ids: [18, 10752],
    genres: []
  },
  {
    id: 8,
    title: "The Last of Us",
    poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    backdrop_path: "/bQXAqRx2Fgc46uCVWgoPz5L5Dtr.jpg",
    release_date: "2023-01-15",
    overview: "Vinte anos após a queda da civilização moderna, Joel é contratado para tirar Ellie de uma zona de quarentena perigosa.",
    vote_average: 8.7,
    media_type: "tv",
    genre_ids: [18, 10765],
    genres: []
  }
];

export const MOCK_STREAMING_PROVIDERS = [
  { provider_id: 8, provider_name: "Netflix", logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg" },
  { provider_id: 119, provider_name: "Amazon Prime Video", logo_path: "/68MNrwlkpF7WnmNPXLah69CR5cb.jpg" },
  { provider_id: 337, provider_name: "Disney Plus", logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" },
  { provider_id: 350, provider_name: "Apple TV Plus", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg" },
  { provider_id: 384, provider_name: "HBO Max", logo_path: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg" },
  { provider_id: 607, provider_name: "Globoplay", logo_path: "/vOF4hWwV6l2Db98lhQLUZip9MIW.jpg" }
];

export const MOCK_MOOD_OPTIONS = [
  { 
    id: 'happy', 
    label: 'Feliz', 
    description: 'Estou procurando algo divertido e positivo',
    icon: '😊'
  },
  { 
    id: 'sad', 
    label: 'Triste', 
    description: 'Preciso de algo reconfortante',
    icon: '😢'
  },
  { 
    id: 'excited', 
    label: 'Animado', 
    description: 'Quero algo cheio de ação e adrenalina',
    icon: '🤩'
  },
  { 
    id: 'relaxed', 
    label: 'Relaxado', 
    description: 'Algo tranquilo para descontrair',
    icon: '😌'
  },
  { 
    id: 'romantic', 
    label: 'Romântico', 
    description: 'Estou no clima para uma história de amor',
    icon: '❤️'
  },
  { 
    id: 'scared', 
    label: 'Assustado', 
    description: 'Quero sentir medo e tensão',
    icon: '😱'
  },
  { 
    id: 'thoughtful', 
    label: 'Pensativo', 
    description: 'Algo que me faça refletir',
    icon: '🤔'
  }
];

// Helper function to search in mock data
export function searchMockContent(query: string): ContentItem[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_MOVIES.filter(
    item => item.title.toLowerCase().includes(lowerQuery) || 
           item.overview.toLowerCase().includes(lowerQuery)
  );
}
