import React, { useRef, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ContentCarousel from "@/components/ContentCarousel";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
// Update the imports at the top to include Play
import {
  ArrowDown,
  Heart,
  Search,
  Settings,
  Play,
  Gamepad2,
  Lightbulb,
  BookOpen,
  Users,
  Coffee,
  Palette,
} from "lucide-react";
import { Link } from "react-router-dom";
import HowItWorksStep from "@/components/HowItWorksStep";
import BenefitCard from "@/components/BenefitCard";
import TestimonialCard from "@/components/TestimonialCard";
import { ContentItem } from "@/types/movie";
import MoodCarousel from "@/components/MoodCarousel";
import {
  getTrending,
  getUpcoming2025,
  getUpcomingTVShows,
  getTopRatedMovies,
} from "@/lib/tmdb";
import useTypewriter from "@/hooks/useTypewriter";
import { BookmarkPlus } from "lucide-react";
import GenreSelector from "@/components/GenreSelector";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import DesktopMockup from "@/components/DesktopMockup";
import MobileMockup from "@/components/MobileMockup";
import StreamingServices from '@/components/StreamingServices';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  // Get a reference to the how it works section
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // State for trending content
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingMovies, setUpcomingMovies] = useState<ContentItem[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [upcomingTVShows, setUpcomingTVShows] = useState<ContentItem[]>([]);
  const [loadingTVShows, setLoadingTVShows] = useState(true);
  const [topRatedMovies, setTopRatedMovies] = useState<ContentItem[]>([]);
  const { ref: timeValueRef, isInView } = useInView();
  const [count, setCount] = useState(0);
  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth" });
  };

    useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Set session expiry to 30 days
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.setSession({
            access_token: session?.access_token || '',
            refresh_token: session?.refresh_token || '',
            expires_in: 30 * 24 * 60 * 60 // 30 days in seconds
          });
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch trending content on component mount
  useEffect(() => {
    const fetchTrendingContent = async () => {
      try {
        const content = await getTrending();
        setTrendingContent(content);
      } catch (error) {
        console.error("Error fetching trending content:", error);
        // Use empty array as fallback if fetch fails
        setTrendingContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingContent();
  }, []);

  useEffect(() => {
    const fetchUpcomingTVShows = async () => {
      try {
        const shows = await getUpcomingTVShows();
        setUpcomingTVShows(shows);
      } catch (error) {
        console.error("Error fetching upcoming TV shows:", error);
        setUpcomingTVShows([]);
      } finally {
        setLoadingTVShows(false);
      }
    };

    fetchUpcomingTVShows();
  }, []);

  useEffect(() => {
    const fetchUpcomingMovies = async () => {
      try {
        const movies = await getUpcoming2025();
        setUpcomingMovies(movies);
      } catch (error) {
        console.error("Error fetching upcoming movies:", error);
        setUpcomingMovies([]);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingMovies();
  }, []);

  // Scroll to the how it works section
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number | null = null;
      const duration = 2000;
      const endValue = 60;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        setCount(Math.floor(progress * endValue));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    } else {
      setCount(0);
    }
  }, [isInView]);

  useEffect(() => {
    const fetchTopRatedMovies = async () => {
      try {
        const movies = await getTopRatedMovies();
        setTopRatedMovies(movies);
      } catch (error) {
        console.error("Error fetching top rated movies:", error);
        setTopRatedMovies([]);
      }
    };

    fetchTopRatedMovies();
  }, []);

  const headlines = [
    "Não sabe o que assistir? O FilmeJá decide por você.",
    "Sem ideia do que assistir? O FilmeJá escolhe pra você.",
    "Cansado de procurar? Deixa que o FilmeJá resolve.",
    "Tá perdido nos catálogos? O FilmeJá te guia.",
    "Quer só apertar o play? O FilmeJá diz o que ver.",
    "Horas procurando? Agora é só perguntar pro FilmeJá.",
    "Dúvida na escolha? FilmeJá responde em segundos.",
    "Um clique. Uma recomendação. FilmeJá.",
    "Seu tempo vale mais. FilmeJá indica pra você.",
    "Streaming sem enrolação. FilmeJá te mostra o melhor.",
    "Quer assistir algo bom agora? FilmeJá tem a resposta.",
  ];

  const currentHeadline = useTypewriter(headlines, 50, 4000);

  return (
    <div className="min-h-screen bg-filmeja-dark">
      {/* Navbar with transparent background on the hero section */}
      <Navbar transparent />

      {/* Hero Section with Image Slideshow */}
      <HeroSection useSlideshow={true}>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 min-h-[3em] lg:min-h-[2em]">
            <span className="text-white">
              {currentHeadline.split("FilmeJá")[0]}
            </span>
            <span className="text-filmeja-purple">
              {currentHeadline.includes("FilmeJá") ? "FilmeJá" : ""}
            </span>
            <span className="text-white">
              {currentHeadline.includes("FilmeJá")
                ? currentHeadline.split("FilmeJá")[1]
                : ""}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Receba recomendações inteligentes de filmes e séries com base no seu
            humor ou personalidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={scrollToHowItWorks}
            >
              <Play className="mr-2 h-5 w-5" /> Veja como funciona{" "}
              <ArrowDown className="ml-1" />
            </Button>
          </div>
        </div>
      </HeroSection>

      {/* Mood Carousel - NEW SECTION */}
      <MoodCarousel />

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Como funciona?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              O FilmeJá usa inteligência artificial para entender seu humor e
              preferências, recomendando o filme ou série perfeito para o seu
              momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <HowItWorksStep
              step={1}
              title="Responda como você está se sentindo"
              description="Conte-nos seu humor atual, preferências ou responda a perguntas simples sobre sua personalidade."
              icon={<Heart className="h-6 w-6" />}
            />
            <HowItWorksStep
              step={2}
              title="Receba sugestões personalizadas"
              description="Nossa IA analisa suas respostas e cruza com milhares de opções para encontrar o conteúdo perfeito para você."
              icon={<Search className="h-6 w-6" />}
            />
            <HowItWorksStep
              step={3}
              title="Assista na sua plataforma favorita"
              description="Descobra exatamente onde o filme ou série está disponível e comece a assistir com apenas um clique."
              icon={<Settings className="h-6 w-6" />}
            />
          </div>
          <div className="flex justify-center items-center px-4">
            <Button
              size="lg"
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white w-full sm:w-auto flex items-center justify-center gap-3 
              shadow-lg shadow-filmeja-purple/20 hover:shadow-filmeja-purple/40
              animate-bounce-gentle
              relative overflow-hidden
              group ring-2 ring-offset-2 ring-offset-filmeja-dark ring-filmeja-purple/50 animate-ring-pulse"
              onClick={() => scrollToPlans()}
            >
              <Play className="mr-2 h-5 w-5 animate-pulse" />
              <span className="text-center relative z-10">
                Quero ver minha<br />
                recomendação agora
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </Button>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 px-4 bg-filmeja-dark/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Não Perca: Os Lançamentos Mais Quentes de 2025 Atualizados em
              Tempo Real
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Descubra os filmes mais aguardados que chegam em breve
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-8 max-w-5xl mx-auto">
            {loadingUpcoming ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-6 h-6 border-2 border-filmeja-purple border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-white">
                  Carregando lançamentos...
                </span>
              </div>
            ) : (
              <ContentCarousel
                title=""
                items={upcomingMovies}
                onSaveItem={(item) => scrollToPlans()}
              />
            )}

            <div className="mt-10 text-center">
              <p className="text-gray-300 mb-4">
                Fique por dentro dos próximos lançamentos e nunca perca um filme
                aguardado
              </p>
                <Button onClick={() => scrollToPlans()} className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
                  Ver mais lançamentos
                </Button>

            </div>
          </div>
        </div>
      </section>

      {/*Series*/}
      <section className="py-16 px-4 bg-filmeja-dark/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Séries Mais Aguardadas de 2025
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Descubra as séries que vão fazer sucesso em breve
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-8 max-w-5xl mx-auto">
            {loadingTVShows ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-6 h-6 border-2 border-filmeja-purple border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-white">Carregando séries...</span>
              </div>
            ) : (
              <ContentCarousel
                title=""
                items={upcomingTVShows}
                onSaveItem={(item) => scrollToPlans()}
              />
            )}

            <div className="mt-10 text-center">
              <p className="text-gray-300 mb-4">
                Fique por dentro das próximas séries e acompanhe todos os
                lançamentos
              </p>
                <Button onClick={() => scrollToPlans()} className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
                  Ver mais séries
                </Button>
            </div>
          </div>
        </div>
      </section>

      <GenreSelector />

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Por que escolher o FilmeJá?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Uma experiência premium para quem valoriza seu tempo de
              entretenimento
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitCard
              title="Recomendações de filmes e séries"
              description="Não apenas filmes, mas todo tipo de conteúdo disponível nas plataformas de streaming."
            />
            <BenefitCard
              title="Baseado em humor e preferências"
              description="Algoritmos inteligentes que entendem como você se sente e o que realmente gostaria de assistir agora."
            />
            <BenefitCard
              title="Design estilo streaming de verdade"
              description="Interface premium inspirada nas melhores plataformas do mercado, fácil de usar e visualmente impressionante."
            />
            <BenefitCard
              title="Dados confiáveis via API da TMDb"
              description="Informações atualizadas e precisas sobre todos os filmes e séries disponíveis."
            />
            <BenefitCard
              title="Sem anúncios, com recomendações honestas"
              description="Sugestões genuínas baseadas apenas na sua personalidade, sem propaganda ou conteúdo patrocinado."
            />
            <BenefitCard
              title="Sem plano gratuito, apenas qualidade"
              description="Um serviço exclusivo para quem valoriza qualidade e não quer perder tempo escolhendo o que assistir."
            />
          </div>
          <div className="flex justify-center items-center px-4">
            <Button
              size="lg"
              className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white w-full sm:w-auto flex items-center justify-center gap-3 
              shadow-lg shadow-filmeja-purple/20 hover:shadow-filmeja-purple/40
              animate-bounce-gentle
              relative overflow-hidden
              group ring-2 ring-offset-2 ring-offset-filmeja-dark ring-filmeja-purple/50 animate-ring-pulse"
              onClick={() => scrollToPlans()}
            >
              <Play className="mr-2 h-5 w-5 animate-pulse" />
              <span className="text-center relative z-10">
                Quero ver minha<br />
                recomendação agora
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </Button>
          </div>
        </div>
      </section>

      <StreamingServices />

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-filmeja-dark/50 to-filmeja-dark">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              O que nossos usuários dizem
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Pessoas como você que não perdem mais tempo escolhendo o que
              assistir
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <TestimonialCard
              name="Carlos Silva"
              quote="Economizo pelo menos 30 minutos toda vez que vou assistir algo. As recomendações são surpreendentemente precisas!"
              rating={5}
            />
            <TestimonialCard
              name="Ana Luiza"
              quote="Finalmente acabaram as discussões sobre o que assistir com meu namorado. O FilmeJá sempre acerta!"
              rating={5}
            />
            <TestimonialCard
              name="Rodrigo Mendes"
              quote="Vale cada centavo. Descobri séries incríveis que nunca teria encontrado sozinho."
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden bg-filmeja-dark">
        {/* Background Image with reduced opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transform transition-transform duration-[30s] hover:scale-110 opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1586899028174-e7098604235b?q=80&w=2071&auto=format&fit=crop')`,
          }}
        />

        {/* Gradient Overlay with theme color */}
        <div className="absolute inset-0 bg-gradient-to-br from-filmeja-dark via-filmeja-dark/80 to-filmeja-dark backdrop-blur-sm" />

        {/* Content remains the same */}
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16 max-w-4xl mx-auto leading-tight">
            Todo mundo ama assistir, mas ninguém gosta de perder tempo
            decidindo.
          </h2>

          {/* Cards with adjusted background */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-filmeja-dark/50 backdrop-blur-md rounded-xl p-8 border border-white/10 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-6xl font-bold text-filmeja-purple">
                  +10
                </div>
                <div className="text-2xl text-white font-semibold">minutos</div>
              </div>
              <p className="text-gray-300 text-lg">
                Segundo um estudo global da Accenture, brasileiros levam no
                mínimo 10 minutos para decidir o que assistir
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 border border-white/10 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-6xl font-bold text-filmeja-purple">44</div>
                <div className="text-2xl text-white font-semibold">%</div>
              </div>
              <p className="text-gray-300 text-lg">
                das pessoas não conseguem encontrar nada que valha a pena
                assistir. Quase metade do público gasta tempo procurando e
                termina frustrado.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 border border-white/10 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-6xl font-bold text-filmeja-purple">
                  +60
                </div>
                <div className="text-2xl text-white font-semibold">horas</div>
              </div>
              <p className="text-gray-300 text-lg">
                horas perdidas por ano procurando o que assistir
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-200 text-xl max-w-2xl mx-auto font-medium">
              O excesso de opções virou um problema.
              <span className="text-filmeja-purple">
                {" "}
                O FilmeJá resolve isso em segundos.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Time Value Section */}
      <section
        ref={timeValueRef}
        className="py-24 relative overflow-hidden bg-filmeja-dark"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="text-8xl md:text-9xl font-bold text-filmeja-purple">
                {count}
              </div>
              <div className="text-6xl md:text-7xl text-white font-bold">h</div>
            </div>

            <h3 className="text-2xl md:text-3xl text-white font-medium mb-8">
              É isso que você perde só tentando decidir o que assistir.
            </h3>

            <h4 className="text-xl text-gray-300 mb-16">
              Menos rolagem. Mais diversão. Mais vida.
            </h4>

            {/* Activity Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-red-400 mb-2">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Cuidar da Saúde</h5>
                  <p className="text-sm text-gray-400">
                    Tempo para exercícios e bem-estar
                  </p>
                  <div className="mt-2 text-red-400 font-bold">35h</div>
                </div>
              </div>

              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-blue-400 mb-2">
                    <Users className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Família e Amigos</h5>
                  <p className="text-sm text-gray-400">
                    Momentos especiais com quem você ama
                  </p>
                  <div className="mt-2 text-blue-400 font-bold">30h</div>
                </div>
              </div>

              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-yellow-400 mb-2">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Leitura</h5>
                  <p className="text-sm text-gray-400">
                    Ler aquele livro que está parado
                  </p>
                  <div className="mt-2 text-yellow-400 font-bold">20h</div>
                </div>
              </div>

              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-purple-400 mb-2">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">
                    Aprender Algo Novo
                  </h5>
                  <p className="text-sm text-gray-400">
                    Desenvolver novas habilidades
                  </p>
                  <div className="mt-2 text-purple-400 font-bold">15h</div>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-4">
              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-green-400 mb-2">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Hobbies</h5>
                  <p className="text-sm text-gray-400">
                    Dedicar tempo ao que você gosta
                  </p>
                  <div className="mt-2 text-green-400 font-bold">15h</div>
                </div>
              </div>

              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-orange-400 mb-2">
                    <Coffee className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Relaxar</h5>
                  <p className="text-sm text-gray-400">
                    Momentos de paz e tranquilidade
                  </p>
                  <div className="mt-2 text-orange-400 font-bold">10h</div>
                </div>
              </div>

              <div className="bg-filmeja-dark/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-pink-400 mb-2">
                    <Palette className="w-8 h-8" />
                  </div>
                  <h5 className="text-white font-semibold">Criatividade</h5>
                  <p className="text-sm text-gray-400">
                    Explorar seu lado artístico
                  </p>
                  <div className="mt-2 text-pink-400 font-bold">15h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform Section */}
      <section className="py-24 relative overflow-hidden bg-filmeja-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Descubra o que assistir em qualquer lugar.
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                No celular, tablet ou desktop — o FilmeJá te recomenda filmes e
                séries perfeitos, onde você estiver.
              </p>
            </div>

            <div className="relative flex flex-col lg:flex-row items-center gap-8 justify-center">
              {/* Desktop Mockup */}
              <div className="w-full max-w-5xl mx-auto rounded-xl p-1 ">
                <div className="flex flex-row items-center justify-between">
                  <DesktopMockup>
                    <div className="flex flex-col gap-4 mt-2">
                      <h3 className="text-filmeja-purple text-2xl font-bold text-center">
                        Filme<span className="text-white">Já</span>
                      </h3>
                      <div className="flex gap-4 animate-scroll">
                        {topRatedMovies.map((movie, index) => (
                          <div
                            key={index}
                            className="flex-none w-[120px] aspect-[2/3] rounded-lg overflow-hidden"
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </DesktopMockup>

                  <MobileMockup>
                    <div className="relative h-[500px] overflow-hidden rounded-lg bg-filmeja-dark/80">
                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white text-lg font-semibold">
                            Para você agora
                          </h3>
                          <span className="text-filmeja-purple text-sm">
                            20:45
                          </span>
                        </div>

                        {topRatedMovies.slice(0, 3).map((movie, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                          >
                            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                              <img
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="mt-2">
                              <h4 className="text-white font-medium text-sm group-hover:text-filmeja-purple transition-colors">
                                {movie.title}
                              </h4>
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                {movie.overview}
                              </p>
                            </div>
                            <div className="absolute top-2 right-2 bg-filmeja-purple/90 text-white text-xs px-2 py-1 rounded-full">
                              {movie.vote_average.toFixed(1)} ★
                            </div>
                          </div>
                        ))}

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-filmeja-dark to-transparent">
                          <p className="text-white/80 text-sm text-center">
                            Deslize para mais recomendações personalizadas ✨
                          </p>
                        </div>
                      </div>
                    </div>
                  </MobileMockup>
                </div>
              </div>
            </div>

            <div className="text-center mt-0">
              <p className="text-xl text-filmeja-purple font-semibold">
                Recomendações inteligentes sempre ao seu alcance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={plansRef}
        className="py-16 px-4 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative"
      >
        <div className="absolute inset-0 bg-filmeja-dark/90"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Comece agora por apenas R$9,99/mês e nunca mais perca tempo
              escolhendo o que assistir
            </h2>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white mb-4"
              >
                Começar
              </Button>
            </Link>
            <p className="text-gray-300 text-sm">
              Pagamento 100% seguro • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
