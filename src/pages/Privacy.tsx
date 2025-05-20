import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      title: "1. Informações que Coletamos",
      content: [
        "Ao utilizar o FilmeJá, podemos coletar as seguintes informações:",
        "• Dados cadastrais: nome, e-mail, senha e informações de pagamento (processadas por plataformas parceiras).",
        "• Dados de uso: preferências de conteúdo, histórico de interações e respostas aos prompts de recomendação.",
        "• Dados técnicos: endereço IP, tipo de dispositivo, navegador, sistema operacional e cookies para melhorar a experiência de navegação."
      ]
    },
    {
      title: "2. Finalidade da Coleta",
      content: [
        "As informações coletadas são utilizadas para os seguintes propósitos:",
        "• Criar e gerenciar sua conta na plataforma;",
        "• Oferecer recomendações personalizadas de filmes e séries com base nas suas preferências;",
        "• Melhorar continuamente os serviços, com base em dados de navegação e uso;",
        "• Cumprir obrigações legais e regulatórias;",
        "• Realizar comunicações de suporte, notificações importantes ou atualizações.",
        "Não utilizamos seus dados para fins de publicidade externa ou venda a terceiros."
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
            Política de Privacidade
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
            A sua privacidade é importante para nós. Esta Política de Privacidade descreve como coletamos, 
            usamos, armazenamos e protegemos as suas informações pessoais ao utilizar a plataforma FilmeJá. 
            Nosso compromisso é com a transparência e o respeito aos seus dados, conforme previsto na Lei 
            Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
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
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Contato</h2>
          <p className="text-gray-300 mb-4">
            Se você tiver qualquer dúvida sobre esta Política de Privacidade, entre em contato conosco:
          </p>
          <a 
            href="mailto:privacidade@filmeja.com"
            className="inline-flex items-center gap-2 text-filmeja-purple hover:text-filmeja-purple/80 transition-colors"
          >
            <Mail className="w-5 h-5" />
            privacidade@filmeja.com
          </a>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;