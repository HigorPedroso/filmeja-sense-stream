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
        "• Dados cadastrais: nome, e-mail, senha (armazenada de forma criptografada) e, quando aplicável, dados de pagamento — processados diretamente por nossos parceiros de pagamento (Stripe e/ou Google Play), sem que o FilmeJá tenha acesso ao número completo do cartão.",
        "• Dados de uso e comportamento: gêneros e humores selecionados, títulos visualizados, curtidos, salvos e recusados, cliques em serviços de streaming, conversas com o Filmin.IA e demais interações registradas para entender como você usa o app.",
        "• Dados de dispositivo e notificações: identificador de push (token do Firebase Cloud Messaging) usado para envio de notificações, modelo/sistema operacional do aparelho e identificador de publicidade (Advertising ID), quando você utiliza o aplicativo Android/iOS.",
        "• Dados técnicos de navegação (versão web): endereço IP, tipo de dispositivo, navegador e cookies, usados para manter sua sessão e melhorar a experiência de uso."
      ]
    },
    {
      title: "2. Finalidade da Coleta",
      content: [
        "As informações coletadas são utilizadas para os seguintes propósitos:",
        "• Criar, autenticar e gerenciar sua conta na plataforma;",
        "• Gerar recomendações personalizadas de filmes e séries com auxílio de inteligência artificial, com base nas suas preferências, humor e histórico de interações;",
        "• Enviar notificações push relevantes, como lembretes de sessões de filme, recomendações compatíveis com seu perfil e novidades do catálogo;",
        "• Exibir anúncios (para usuários do plano gratuito) por meio do Google AdMob, incluindo, quando permitido pelas suas configurações de privacidade do dispositivo, anúncios minimamente personalizados;",
        "• Processar assinaturas e pagamentos do plano Premium;",
        "• Melhorar continuamente os serviços, com base em métricas agregadas de uso;",
        "• Cumprir obrigações legais e regulatórias;",
        "• Realizar comunicações de suporte, notificações importantes ou atualizações.",
        "Não vendemos seus dados pessoais a terceiros."
      ]
    },
    {
      title: "3. Compartilhamento com Terceiros",
      content: [
        "Para operar o FilmeJá, compartilhamos dados com fornecedores que atuam em nosso nome, sempre limitados ao necessário para prestar o serviço:",
        "• Supabase: hospedagem do banco de dados, autenticação e armazenamento das informações da sua conta;",
        "• Google Firebase Cloud Messaging: entrega de notificações push no aplicativo;",
        "• Google AdMob: exibição de anúncios no plano gratuito, podendo coletar o identificador de publicidade do seu dispositivo conforme a política de privacidade do Google;",
        "• TMDB (The Movie Database): fonte dos dados de filmes, séries, elenco e onde assistir exibidos no app;",
        "• Google Gemini AI: processamento das recomendações e conversas do Filmin.IA — as mensagens que você envia ao assistente são processadas por esse serviço para gerar as respostas;",
        "• Stripe e/ou Google Play Faturamento: processamento de pagamentos das assinaturas Premium.",
        "Cada um desses parceiros possui sua própria política de privacidade, que recomendamos consultar."
      ]
    },
    {
      title: "4. Cookies e Tecnologias Semelhantes",
      content: [
        "Na versão web, utilizamos cookies e tecnologias de armazenamento local (localStorage) para manter você conectado, lembrar preferências do dispositivo e viabilizar a exibição de anúncios. No aplicativo móvel, tecnologias equivalentes de armazenamento local do dispositivo são usadas para os mesmos fins, incluindo controlar se a introdução inicial do app já foi exibida. Você pode gerenciar permissões de anúncio personalizado nas configurações do seu dispositivo (Android/iOS) a qualquer momento."
      ]
    },
    {
      title: "5. Retenção de Dados",
      content: [
        "Mantemos seus dados pessoais enquanto sua conta estiver ativa ou pelo tempo necessário para cumprir as finalidades descritas nesta política, incluindo obrigações legais, contábeis ou de prestação de contas. Dados de uso e eventos podem ser mantidos de forma agregada ou anonimizada por período adicional para fins estatísticos, sem identificar você diretamente. Ao excluir sua conta, removemos ou anonimizamos seus dados pessoais, exceto quando a retenção for exigida por lei."
      ]
    },
    {
      title: "6. Segurança dos Dados",
      content: [
        "Adotamos medidas técnicas e organizacionais para proteger seus dados, como criptografia em trânsito (HTTPS), controle de acesso por autenticação e políticas de segurança em nível de linha (Row Level Security) no banco de dados, que garantem que cada usuário só acesse suas próprias informações. Apesar dos esforços, nenhum sistema é totalmente livre de riscos, e trabalhamos continuamente para aprimorar nossas práticas de segurança."
      ]
    },
    {
      title: "7. Seus Direitos (LGPD)",
      content: [
        "Nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:",
        "• Confirmar a existência de tratamento e acessar seus dados;",
        "• Corrigir dados incompletos, inexatos ou desatualizados;",
        "• Solicitar a exclusão, anonimização ou portabilidade dos seus dados;",
        "• Revogar o consentimento e se opor a tratamentos realizados com base nele;",
        "• Solicitar informações sobre com quem compartilhamos seus dados.",
        "Você pode exercer esses direitos diretamente pelo app, na tela de Perfil, ou entrando em contato conosco pelo e-mail informado ao final desta página."
      ]
    },
    {
      title: "8. Menores de Idade",
      content: [
        "O FilmeJá não é direcionado a menores de 13 anos e não coleta intencionalmente dados de crianças nessa faixa etária. Caso identifiquemos que dados de um menor de 13 anos foram coletados sem o devido consentimento dos pais ou responsáveis, tomaremos medidas para excluí-los."
      ]
    },
    {
      title: "9. Alterações nesta Política",
      content: [
        "Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou por exigências legais e operacionais. A data da última atualização é sempre indicada no topo desta página. Em caso de alterações relevantes, poderemos notificá-lo pelo app ou por e-mail."
      ]
    },
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