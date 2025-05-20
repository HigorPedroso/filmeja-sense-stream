import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Terms = () => {
  const sections = [
    {
      title: "1. Definições",
      content: [
        "FilmeJá: Serviço de software como serviço (SaaS), acessado por meio da internet, que oferece recomendações personalizadas de filmes e séries utilizando inteligência artificial.",
        "Usuário: Qualquer pessoa física ou jurídica que acesse ou utilize os serviços do FilmeJá.",
        "Assinatura: Plano pago que garante acesso às funcionalidades da plataforma."
      ]
    },
    {
      title: "2. Aceitação dos Termos",
      content: [
        "Ao utilizar a Plataforma, você declara que leu, entendeu e concorda integralmente com estes Termos. Caso não concorde com alguma cláusula, você deve descontinuar imediatamente o uso da Plataforma."
      ]
    },
    // Add all other sections similarly...
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
            Termos de Uso
          </h1>
          <p className="text-gray-400">
            Última atualização: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8"
        >
          <p className="text-gray-300 leading-relaxed">
            Bem-vindo ao FilmeJá! Ao acessar e utilizar a plataforma FilmeJá (doravante "Plataforma"), 
            você concorda com os termos e condições descritos neste documento. Por favor, leia atentamente 
            estes Termos de Uso antes de utilizar nossos serviços.
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-gray-400"
        >
          <p>
            Para dúvidas, sugestões ou solicitações relacionadas aos Termos de Uso, 
            entre em contato conosco pelo e-mail:{" "}
            <a 
              href="mailto:suporte@filmeja.com" 
              className="text-filmeja-purple hover:text-filmeja-purple/80 transition-colors"
            >
              suporte@filmeja.com
            </a>
          </p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;