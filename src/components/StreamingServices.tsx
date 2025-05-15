import { useEffect, useState } from 'react';

const streamingServices = [
  { name: 'Star+', logo: '/streaming/star-plus.svg' },
  { name: 'Netflix', logo: '/streaming/netflix.png' },
  { name: 'Prime Video', logo: '/streaming/prime-video.png' },
  { name: 'Disney+', logo: '/streaming/disney.svg' },
  { name: 'HBO Max', logo: '/streaming/hbo-max.svg' },
  { name: 'Apple TV+', logo: '/streaming/apple-tv.svg' },
  { name: 'Paramount+', logo: '/streaming/paramount.svg' },
  { name: 'Globo Play', logo: '/streaming/globoplay.png' },
];

const StreamingServices = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % streamingServices.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-filmeja-dark">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl text-white text-center font-bold mb-12">
          A nossa IA recomenda os melhores filmes e séries de todas streamings para você assistir
        </h2>
        
        <div className="relative overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {[...streamingServices, ...streamingServices].map((service, index) => (
              <div 
                key={`${service.name}-${index}`}
                className="flex-none w-40 p-4 bg-filmeja-dark/50 backdrop-blur-sm rounded-xl 
                  border border-white/10 hover:border-filmeja-purple/50 transition-all duration-300"
              >
                <div className="aspect-video flex items-center justify-center">
                  <img
                    src={service.logo}
                    alt={service.name}
                    className={`w-full h-full object-contain transition-all duration-700
                      ${index % streamingServices.length === activeIndex 
                        ? 'brightness-100 invert-0' 
                        : 'brightness-0 invert'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StreamingServices;