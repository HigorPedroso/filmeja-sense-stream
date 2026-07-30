import { useState, useRef, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addToWatchHistory } from "@/lib/utils/watch-history";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  recommendation?: {
    title: string;
    type?: "movie" | "tv"; // Ensure this is strictly typed as "movie" | "tv"
  };
}

// Add these props to the component
interface AiChatProps {
  onShowContent: (title: string, type?: "movie" | "tv") => void;
  watchedContent?: Array<{ title?: string; name?: string; type?: "movie" | "tv" }>;
  userAvatar?: string;
  userId: string; // Add this line
  fullScreen?: boolean;
  headerLeft?: ReactNode;
}

// Update the component parameters
export function AiChat({
  onShowContent,
  watchedContent = [],
  userAvatar,
  userId,
  fullScreen = false,
  headerLeft,
}: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
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
    return titleMatch ? { title: titleMatch[1], type: typeMatch as "movie" | "tv" } : null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      // Fetch last 10 recommendations from watch_history
      const { data: recentRecommendations, error: historyError } = await supabase
        .from('watch_history')
        .select('title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error("Error fetching watch history:", historyError);
      }

      // Format watched content and recent recommendations
      const watchedTitles = watchedContent
        .map(item => `${item.title || item.name} (${item.type})`)
        .join(", ");

      const recentTitles = recentRecommendations
        ?.map(item => `${item.title}`)
        .join(", ");

      // Last turns of the actual conversation, so the model has real context
      // instead of treating every message as a fresh, isolated request.
      const conversationHistory = messages
        .slice(-12)
        .map((m) => `${m.sender === "user" ? "Usuário" : "Filmin.IA"}: ${m.text}`)
        .join("\n");

      const userMessage: Message = {
        id: Date.now().toString(),
        text: input,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      const prompt = `Você é o Filmin.IA, um assistente de descoberta de filmes e séries. Converse de forma natural e simpática, como um amigo cinéfilo — não como um robô que só cospe recomendações.

Regras:
- Se a pessoa só cumprimentou ou ainda não deu nenhuma pista do que quer assistir, pode fazer UMA pergunta pra entender o gosto dela (humor, gênero, tempo disponível, etc.) antes de recomendar.
- Assim que a pessoa der qualquer preferência (humor, gênero, duração, "algo tenso", "uma comédia", etc.), já é o suficiente — recomende um título específico nessa mesma resposta. Não fique encadeando perguntas de esclarecimento; no máximo UMA pergunta de acompanhamento na conversa inteira antes de recomendar.
- Nunca recomende títulos que a pessoa já assistiu ou que já foram recomendados antes (listas abaixo), nem repita um título já sugerido nesta conversa.
- Seja breve (2-4 frases) e use emojis com moderação.

Títulos que a pessoa já assistiu: ${watchedTitles || "nenhum"}.
Últimas recomendações já feitas (não repetir): ${recentTitles || "nenhuma"}.

Conversa até agora:
${conversationHistory || "(início da conversa)"}
Usuário: "${input}"

Responda SEMPRE em JSON válido, sem nenhum texto fora do JSON, neste formato exato:
{
  "chat": "sua resposta para a pessoa, em português",
  "recommendation": { "title": "Nome exato do título", "type": "movie" } ou null se não estiver recomendando nada agora
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1536,
              thinkingConfig: { thinkingBudget: 0 },
            },
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
          const rawRecommendation = jsonResponse.recommendation;
          const recommendation =
            rawRecommendation && rawRecommendation.title
              ? {
                  title: rawRecommendation.title as string,
                  type: (rawRecommendation.type === "tv" ? "tv" : "movie") as "movie" | "tv",
                }
              : null;

          if (recommendation) {
            await addToWatchHistory({
              id: Date.now(), // Temporary ID until we get the real one
              media_type: recommendation.type,
              title: recommendation.title,
              name: recommendation.title, // For TV shows
              poster_path: null // We'll update this when we get the real content details
            }, userId);
          }

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: jsonResponse.chat,
              sender: "ai",
              timestamp: new Date(),
              recommendation,
            },
          ]);
          setIsTyping(false);
        } catch (error) {
          console.error("Error parsing AI response:", error);

          // Fallback se o JSON falhar
          const recommendation = extractRecommendation(aiResponse);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: aiResponse,
              sender: "ai",
              timestamp: new Date(),
              recommendation: recommendation,
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

  // Add effect to save messages
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Add function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
  };

  return (
    <div
      className={
        fullScreen
          ? "flex flex-col h-full w-full bg-transparent"
          : "flex flex-col h-[90vh] md:h-[600px] max-h-[400px] bg-filmeja-dark/50 backdrop-blur-sm rounded-xl border border-white/10 mx-auto my-auto w-full max-w-[95vw] md:max-w-none"
      }
    >
      <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-center gap-2">
        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2 min-w-0">
          {headerLeft}
          <Bot className="w-5 h-5 text-filmeja-purple flex-shrink-0" />
          <span className="truncate">Filmin.AI te ajuda</span>
        </h3>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            onClick={clearChatHistory}
            className="text-gray-400 hover:text-white text-sm"
          >
            Limpar conversa
          </Button>
        )}
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                    message.sender === "user"
                      ? "bg-filmeja-purple"
                      : "bg-filmeja-blue"
                  }`}
                >
                  {message.sender === "user" ? (
                    userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="User" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )
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
