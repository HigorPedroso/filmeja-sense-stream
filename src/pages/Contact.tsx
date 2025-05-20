import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Mail, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";
import emailjs from '@emailjs/browser';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sparklePosition, setSparklePosition] = useState({ x: 0, y: 0 });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.sendForm(
        'service_htj3xxk',
        'template_vxdgh4h',
        e.currentTarget,
        'BkZpCHFXz66eQq3dm'
      );

      toast({
        title: "✨ Mensagem enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-filmeja-dark via-black to-filmeja-dark">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fale Conosco
          </h1>
          <p className="text-gray-400 text-lg">
            Estamos aqui para ajudar você
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 relative overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setSparklePosition({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity"
            style={{
              background: `radial-gradient(600px circle at ${sparklePosition.x}px ${sparklePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
            }}
          />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-white text-sm mb-2 block">Nome</label>
              <Input
                name="user_name"
                required
                className="bg-white/5 border-white/10 text-white focus:ring-filmeja-purple"
              />
            </div>
            
            <div>
              <label className="text-white text-sm mb-2 block">E-mail</label>
              <Input
                name="user_email"
                type="email"
                required
                className="bg-white/5 border-white/10 text-white focus:ring-filmeja-purple"
              />
            </div>
            
            <div>
              <label className="text-white text-sm mb-2 block">Mensagem</label>
              <Textarea
                name="message"
                required
                className="bg-white/5 border-white/10 text-white min-h-[150px] focus:ring-filmeja-purple"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-filmeja-purple hover:bg-filmeja-purple/90 relative group overflow-hidden"
            >
              <AnimatePresence>
                {isSubmitting ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-filmeja-purple"
                  >
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Enviar Mensagem</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400">
            Ou envie um e-mail diretamente para:{" "}
            <a
              href="mailto:higor533@gmail.com"
              className="text-filmeja-purple hover:text-filmeja-purple/80 transition-colors inline-flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              higor533@gmail.com
            </a>
          </p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;