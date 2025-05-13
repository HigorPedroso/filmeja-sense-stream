
import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ContentCarousel from '@/components/ContentCarousel';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import { getPopularMovies, getPopularTVShows, getTrending } from '@/lib/tmdb';

const Index = () => {
  // In a real implementation, these would be fetched from API with React Query
  const trendingContent = getTrending();
  const popularMovies = getPopularMovies();
  const popularTVShows = getPopularTVShows();

  return (
    <div className="min-h-screen bg-filmeja-dark">
      {/* Navbar with transparent background on the hero section */}
      <Navbar transparent />
      
      {/* Hero Section with Video Background */}
      <HeroSection />
      
      {/* Content Sections */}
      <section className="py-8">
        <ContentCarousel title="Em alta" items={trendingContent} />
        <ContentCarousel title="Filmes populares" items={popularMovies} />
        <ContentCarousel title="Séries populares" items={popularTVShows} />
      </section>
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Pricing Section */}
      <PricingSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
