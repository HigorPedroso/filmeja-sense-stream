import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Footer from "@/components/Footer";

interface FAQItem {
  question: string;
  answer: string | string[];
  emoji: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      emoji: "🎬",
      question: "O que é o FilmeJá?",
      answer: "O FilmeJá é um serviço premium de recomendação de filmes e séries, que utiliza inteligência artificial para indicar exatamente o que você está com vontade de assistir. Com base no seu humor, preferências e estilo de consumo, o sistema entrega sugestões rápidas, certeiras e de alta relevância. É a solução ideal para quem quer economizar tempo e acertar na escolha."
    },
    {
      emoji: "🤖",
      question: "Como funciona a recomendação com inteligência artificial?",
      answer: "A IA do FilmeJá interpreta suas respostas em linguagem natural — como \"quero um filme leve para relaxar\" ou \"me sugere uma série estilo drama policial\" — e combina isso com um banco de dados atualizado com milhares de títulos. A sugestão vem personalizada, levando em conta o que você deseja ver agora, e não apenas listas genéricas."
    },
    {
      emoji: "💳",
      question: "O FilmeJá é gratuito?",
      answer: "Não. O FilmeJá é um serviço exclusivo e 100% pago, voltado para quem valoriza praticidade, tecnologia e boas recomendações. Ao evitar o modelo gratuito, garantimos uma plataforma mais limpa, sem anúncios invasivos, com foco total na experiência do usuário e em recomendações de alta qualidade."
    },
    {
      emoji: "🎯",
      question: "Quais recursos estão incluídos na assinatura?",
      answer: [
        "Recomendação personalizada baseada em humor, preferências e perguntas interativas",
        "Histórico completo de sugestões anteriores",
        "Filtros por plataforma (como Netflix, Prime Video, etc.)",
        "Sistema de favoritos",
        "Interface sem anúncios",
        "Atualizações frequentes com novas funcionalidades e títulos"
      ]
    },
    {
      emoji: "📱",
      question: "Preciso baixar algum aplicativo?",
      answer: "Não. O FilmeJá funciona direto no navegador, tanto no computador quanto no celular. Em breve, também lançaremos um aplicativo oficial para Android e iOS com todas as funcionalidades da plataforma."
    },
    {
      emoji: "🔐",
      question: "Meus dados estão protegidos?",
      answer: "Sim. A segurança e privacidade dos nossos usuários são prioridade. Utilizamos criptografia e boas práticas de proteção de dados. Não compartilhamos suas informações com terceiros e respeitamos integralmente a LGPD (Lei Geral de Proteção de Dados)."
    },
    {
      emoji: "🧠",
      question: "O sistema entende o que eu realmente quero ver?",
      answer: "Sim! Você pode digitar frases livres, como \"me indica algo de suspense com final inesperado\" ou \"quero uma comédia romântica atual\". Nossa IA processa essas informações e retorna títulos que se encaixam no seu pedido com alta precisão. Quanto mais você usa, mais inteligente o sistema fica em entender seu gosto."
    },
    {
      emoji: "🆘",
      question: "Como posso tirar dúvidas ou resolver problemas com minha conta?",
      answer: "Você pode entrar em contato com nossa equipe de suporte através da área \"Fale Conosco\" dentro da plataforma ou pelo e-mail de atendimento. Temos um prazo médio de resposta de até 24 horas úteis."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-filmeja-dark via-black to-filmeja-dark">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ❓ Perguntas Frequentes
          </h1>
          <p className="text-gray-400 text-lg">
            Tire suas dúvidas sobre o FilmeJá
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <h3 className="text-lg font-medium text-white">
                    {item.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-gray-400">
                  {Array.isArray(item.answer) ? (
                    <ul className="list-disc list-inside space-y-2">
                      {item.answer.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.answer}</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;