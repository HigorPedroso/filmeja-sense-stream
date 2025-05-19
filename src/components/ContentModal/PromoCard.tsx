import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";

const products = [
  {
    id: 1,
    title: "Complete sua maratona!",
    description: "Vai assistir esse filme ou série hoje? Torne a sessão ainda melhor com um Kit Cinema em Casa",
    image: "https://m.media-amazon.com/images/I/41TsW4e8ozL._AC_SX679_.jpg",
    link: "https://amzn.to/43wnnXY"
  },
  {
    id: 2,
    title: "Complete sua maratona!",
    description: "Vai assistir esse filme ou série hoje? Torne a sessão ainda melhor com um Kit Cinema em Casa",
    image: "https://m.media-amazon.com/images/I/61jzP5NX3TS._AC_SX679_.jpg",
    link: "https://amzn.to/3YUpIdH"
  },
  {
    id: 3,
    title: "Complete sua maratona!",
    description: "Vai assistir esse filme ou série hoje? Torne a sessão ainda melhor com um Kit Cinema em Casa",
    image: "https://m.media-amazon.com/images/I/513kNwmI31L._AC_SX679_.jpg",
    link: "https://amzn.to/4k5ItDw"
  },
  {
    id: 4,
    title: "Clima de cinema!",
    description: "Imagem 4K incrível onde quiser, com design compacto e suporte ajustável. O mini projetor perfeito para maratonar seus filmes!",
    image: "https://m.media-amazon.com/images/I/211EkQwROhL.__AC_QL70_ML2_.jpg",
    link: "https://amzn.to/43rW6Wp"
  },
  {
    id: 5,
    title: "Som de Cinema!",
    description: "Transforme sua TV com graves intensos e áudio imersivo. Conecte via Bluetooth e sinta cada cena!!",
    image: "https://m.media-amazon.com/images/I/61hGBRO+-zL._AC_SX522_.jpg",
    link: "https://amzn.to/4jcfixm"
  }
];

export const PromoCard = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0]);

  useEffect(() => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    setSelectedProduct(randomProduct);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsAnimating(true);
  };

  const getNextProduct = () => {
      const currentIndex = products.findIndex(p => p.id === selectedProduct.id);
      const nextIndex = (currentIndex + 1) % products.length;
      return products[nextIndex];
    };
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 bg-gradient-to-r from-black/80 to-black/60 rounded-lg overflow-hidden border border-white/10 shadow-xl hover:border-red-500/20 transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row items-center p-3 gap-3">
          <div className="relative w-full sm:w-32 h-32 sm:h-20 shrink-0">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={selectedProduct.image}
              alt="Produto Cinema em Casa"
              className="w-full h-full object-contain rounded-md"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:hidden" />
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <motion.h3 
              className="text-lg sm:text-base font-bold text-white"
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {selectedProduct.title}
            </motion.h3>
            <p className="text-sm sm:text-xs text-gray-300 mb-3 sm:mb-2 line-clamp-2 px-4 sm:px-0">
              {selectedProduct.description}
            </p>
            
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={selectedProduct.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="relative inline-flex items-center justify-center gap-1.5 px-6 sm:px-3 py-2.5 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-500 rounded-full sm:rounded-md text-sm text-white font-medium hover:from-red-500 hover:to-red-400 transition-all duration-300 overflow-hidden w-full sm:w-auto"
            >
              <motion.div
                animate={isAnimating ? { x: "150%" } : { x: "0%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                onAnimationComplete={() => {
                  if (isAnimating) {
                    window.open(selectedProduct.link, "_blank");
                    setIsAnimating(false);
                    setSelectedProduct(getNextProduct());
                  }
                }}
                className="flex items-center gap-2 sm:gap-1.5"
              >
                <ShoppingCart className="w-4 sm:w-3.5 h-4 sm:h-3.5" />
                <span className={isAnimating ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
                  Ver na Amazon
                </span>
              </motion.div>
            </motion.a>
          </div>
        </div>
      </motion.div>
    );
};