
import React, { useRef, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ContentCarousel from '@/components/ContentCarousel';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
// Update the imports at the top to include Play
import { ArrowDown, Heart, Search, Settings, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import HowItWorksStep from '@/components/HowItWorksStep';
import BenefitCard from '@/components/BenefitCard';
import TestimonialCard from '@/components/TestimonialCard';
import { ContentItem } from '@/types/movie';
import MoodCarousel from '@/components/MoodCarousel';
import { getTrending, getUpcoming2025 } from '@/lib/tmdb';
import useTypewriter from '@/hooks/useTypewriter';
import { BookmarkPlus } from 'lucide-react';

const Index = () => {
  // Get a reference to the how it works section
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  
  // State for trending content
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingMovies, setUpcomingMovies] = useState<ContentItem[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch trending content on component mount
  useEffect(() => {
    const fetchTrendingContent = async () => {
      try {
        const content = await getTrending();
        setTrendingContent(content);
      } catch (error) {
        console.error('Error fetching trending content:', error);
        // Use empty array as fallback if fetch fails
        setTrendingContent([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingContent();
  }, []);

  useEffect(() => {
    const fetchUpcomingMovies = async () => {
      try {
        const movies = await getUpcoming2025();
        setUpcomingMovies(movies);
      } catch (error) {
        console.error('Error fetching upcoming movies:', error);
        setUpcomingMovies([]);
      } finally {
        setLoadingUpcoming(false);
      }
    };
    
    fetchUpcomingMovies();
  }, []);

  // Scroll to the how it works section
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    "Quer assistir algo bom agora? FilmeJá tem a resposta."
  ];

  const currentHeadline = useTypewriter(headlines, 50, 4000);

  return (
    <div className="min-h-screen bg-filmeja-dark">
      {/* Navbar with transparent background on the hero section */}
      <Navbar transparent />
      
      {/* Hero Section with Image Slideshow - explicitly set useSlideshow to true */}
      <HeroSection useSlideshow={true}>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 min-h-[3em] lg:min-h-[2em]">
            <span className="text-white">{currentHeadline.split('FilmeJá')[0]}</span>
            <span className="text-filmeja-purple">
              {currentHeadline.includes('FilmeJá') ? 'FilmeJá' : ''}
            </span>
            <span className="text-white">
              {currentHeadline.includes('FilmeJá') ? currentHeadline.split('FilmeJá')[1] : ''}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Receba recomendações inteligentes de filmes e séries com base no seu humor ou personalidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={scrollToHowItWorks}
            >
              <Play className="mr-2 h-5 w-5" /> Veja como funciona <ArrowDown className="ml-1" />
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
            <h2 className="text-3xl font-bold text-white mb-3">Como funciona?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              O FilmeJá usa inteligência artificial para entender seu humor e preferências, 
              recomendando o filme ou série perfeito para o seu momento.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        </div>
      </section>
      
      {/* Preview Section */}
      <section className="py-16 px-4 bg-filmeja-dark/50">
  <div className="container mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-white mb-3">Não Perca: Os Lançamentos Mais Quentes de 2025 Atualizados em Tempo Real</h2>
      <p className="text-gray-300 max-w-2xl mx-auto">
        Descubra os filmes mais aguardados que chegam em breve
      </p>
    </div>
    
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-8 max-w-5xl mx-auto">
      {loadingUpcoming ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-filmeja-purple border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Carregando lançamentos...</span>
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
          Fique por dentro dos próximos lançamentos e nunca perca um filme aguardado
        </p>
        <Link to="/signup">
          <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white">
            Ver mais lançamentos
          </Button>
        </Link>
      </div>
    </div>
  </div>
</section>
      
      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Por que escolher o FilmeJá?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Uma experiência premium para quem valoriza seu tempo de entretenimento
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
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-filmeja-dark/50 to-filmeja-dark">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">O que nossos usuários dizem</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Pessoas como você que não perdem mais tempo escolhendo o que assistir
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
      
      {/* CTA Section */}
      <section ref={plansRef} className="py-16 px-4 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-filmeja-dark/90"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Comece agora por apenas R$9,99/mês e nunca mais perca tempo escolhendo o que assistir
            </h2>
            <Link to="/signup">
              <Button size="lg" className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white mb-4">
                Assinar com Stripe
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
