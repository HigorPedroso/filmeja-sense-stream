import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  recommendation?: {
    title: string;
    type?: "movie" | "tv";
  };
}

// Add these props to the component
interface AiChatProps {
  onShowContent: (title: string, type?: "movie" | "tv") => void;
}

export function AiChat({ onShowContent }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractRecommendation = (text: string) => {
    const titleMatch = text.match(/["']([^"']+)["']/);
    const typeMatch = text.toLowerCase().includes("série") ? "tv" : "movie";
    return titleMatch ? { title: titleMatch[1], type: typeMatch } : null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Você é um assistente amigável que recomenda filmes e séries. Com base nesta descrição: "${input}", recomende UM título específico.
                    Retorne APENAS um JSON no seguinte formato, sem texto adicional:
                    {
                      "title": "Nome do Título",
                      "type": "movie ou tv",
                      "chat": "Sua mensagem amigável explicando a recomendação (use emojis)",
                    }`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        try {
          // Extrai apenas o JSON do texto retornado
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("JSON not found in AI response.");
      
          const jsonResponse = JSON.parse(jsonMatch[0]);
      
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                text: jsonResponse.chat,
                sender: "ai",
                timestamp: new Date(),
                recommendation: {
                  title: jsonResponse.title,
                  type: jsonResponse.type,
                },
              },
            ]);
            setIsTyping(false);
          }, 1000);
        } catch (error) {
          console.error("Error parsing AI response:", error);
      
          // Fallback se o JSON falhar
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: aiResponse,
              sender: "ai",
              timestamp: new Date(),
              recommendation: extractRecommendation(aiResponse),
            },
          ]);
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] md:h-[600px] max-h-[400px] bg-filmeja-dark/50 backdrop-blur-sm rounded-xl border border-white/10 mx-auto my-auto w-full max-w-[95vw] md:max-w-none">
      <div className="p-3 md:p-4 border-b border-white/10">
        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-filmeja-purple" />
          Filmin.AI te ajuda
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === "user"
                      ? "bg-filmeja-purple"
                      : "bg-filmeja-blue"
                  }`}
                >
                  {message.sender === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-xl ${message.sender === "user" ? "bg-filmeja-purple text-white" : "bg-white/10 text-white"}`}
                >
                  {message.sender === "ai" ? message.text : message.text}
                  {message.sender === "ai" && message.recommendation && (
                    <Button
                      onClick={() => {
                        const title = message.recommendation?.title || "";
                        const type = message.recommendation?.type || "movie";
                        onShowContent(title, type);
                      }}
                      className="mt-3 bg-filmeja-purple/20 hover:bg-filmeja-purple/40 text-white text-sm px-4 py-2 rounded-full"
                    >
                      Ver detalhes do título
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-filmeja-blue flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="p-3 rounded-xl bg-white/10 text-white">
                <div className="flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 md:p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Descreva o que você quer assistir..."
            className="flex-1 bg-white/5 text-white rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-filmeja-purple"
          />
          <Button
            onClick={handleSend}
            className="bg-filmeja-purple hover:bg-filmeja-purple/90 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}