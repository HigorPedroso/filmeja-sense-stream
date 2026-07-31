import { useState, useRef, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Clapperboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addToWatchHistory } from "@/lib/utils/watch-history";
import { searchContentByTitle, fetchContentWithProviders } from "@/lib/utils/tmdb";
import { supabase } from "@/integrations/supabase/client";

// How many times we'll ask the AI for a different title before giving up and
// showing a plain response with no recommendation attached. Each attempt
// costs a real TMDB lookup, so this stays small.
const MAX_RECOMMENDATION_ATTEMPTS = 3;

// Quick conversation starters shown on the empty state. Humor and gênero
// already have their own dedicated pickers on the dashboard, so these lean
// into what only the chat can do: specific, contextual requests.
const QUICK_STARTERS = [
  "🎯 Algo parecido com um filme que eu gostei muito",
  "⏱️ Um filme curto, tenho pouco tempo hoje",
  "👨‍👩‍👧‍👦 Algo pra assistir em família",
  "🏆 Um filme premiado que vale a pena",
  "📖 Baseado em uma história real",
  "🆕 O que tem de novo pra assistir agora",
];

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

  // Ground truth check: is this title actually on a streaming platform in
  // Brazil right now? The prompt tells the AI to only recommend available
  // titles, but that's advisory — the model can still get it wrong, and this
  // is a premium feature, so we verify against TMDB before ever showing a
  // recommendation to the user instead of trusting the AI's word for it.
  const isAvailableInBrazil = async (title: string, type: "movie" | "tv") => {
    try {
      const item = await searchContentByTitle(title, type);
      await fetchContentWithProviders(item, { showToast: false, requireBrAvailability: true });
      return true;
    } catch {
      return false;
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText ?? input;
    if (!textToSend.trim()) return;

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
        text: textToSend,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      const today = new Date();
      const todayFormatted = today.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const buildPrompt = (excludedTitles: string[]) => `Você é o Filmin.IA, um assistente de descoberta de filmes e séries. Converse de forma natural e simpática, como um amigo cinéfilo — não como um robô que só cospe recomendações.

A data de hoje é ${todayFormatted}. Essa é a data real e atual — ignore qualquer suposição sobre "o ano atual" baseada nos seus dados de treinamento, e use a busca do Google quando precisar confirmar lançamentos recentes ou futuros.

Regras:
- Se a pessoa só cumprimentou ou ainda não deu nenhuma pista do que quer assistir, pode fazer UMA pergunta pra entender o gosto dela (humor, gênero, tempo disponível, etc.) antes de recomendar.
- Assim que a pessoa der qualquer preferência (humor, gênero, duração, "algo tenso", "uma comédia", etc.), já é o suficiente — recomende um título específico nessa mesma resposta. Não fique encadeando perguntas de esclarecimento; no máximo UMA pergunta de acompanhamento na conversa inteira antes de recomendar.
- Nunca recomende títulos que a pessoa já assistiu ou que já foram recomendados antes (listas abaixo), nem repita um título já sugerido nesta conversa.
- NUNCA recomende filmes ou séries que ainda não foram lançados (anunciados, "em produção", com data de estreia futura). Só recomende títulos que já estrearam e já podem ser assistidos hoje. Na dúvida sobre se algo já lançou, use a busca do Google para confirmar antes de recomendar — se não tiver certeza, prefira um título mais antigo e comprovadamente disponível.
- Só recomende títulos disponíveis em alguma plataforma de streaming por assinatura no Brasil (Netflix, Prime Video, Max, Disney+, Globoplay, Star+, Apple TV+, etc.). Evite lançamentos de festival, exclusivos de outro país ou só em cartaz no cinema — se não tiver certeza da disponibilidade em streaming no Brasil, prefira um título mais popular e comprovadamente disponível.${
        excludedTitles.length
          ? `\n- Os títulos a seguir JÁ FORAM VERIFICADOS e NÃO estão disponíveis em nenhum streaming no Brasil — não sugira nenhum deles de novo: ${excludedTitles.join(", ")}.`
          : ""
      }
- Seja breve (2-4 frases) e use emojis com moderação.

Títulos que a pessoa já assistiu: ${watchedTitles || "nenhum"}.
Últimas recomendações já feitas (não repetir): ${recentTitles || "nenhuma"}.

Conversa até agora:
${conversationHistory || "(início da conversa)"}
Usuário: "${textToSend}"

Responda SEMPRE em JSON válido, sem nenhum texto fora do JSON, neste formato exato:
{
  "chat": "sua resposta para a pessoa, em português",
  "recommendation": { "title": "Nome exato do título", "type": "movie" } ou null se não estiver recomendando nada agora
}`;

      const askGemini = async (prompt: string) => {
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
        if (!aiResponse) return null;

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
          return { chat: jsonResponse.chat as string, recommendation };
        } catch (error) {
          console.error("Error parsing AI response:", error);
          // Fallback se o JSON falhar
          return { chat: aiResponse as string, recommendation: extractRecommendation(aiResponse) };
        }
      };

      // Ask up to MAX_RECOMMENDATION_ATTEMPTS times, excluding any title that
      // fails the Brazil-availability check, until we get a clean answer.
      const excludedTitles: string[] = [];
      let finalChat =
        "Hmm, não encontrei um título certeiro disponível em streaming agora. Me conta mais um detalhe do que você quer assistir? 🤔";
      let finalRecommendation: Message["recommendation"];

      for (let attempt = 0; attempt < MAX_RECOMMENDATION_ATTEMPTS; attempt++) {
        const result = await askGemini(buildPrompt(excludedTitles));
        if (!result) break;

        if (!result.recommendation) {
          // No specific title this turn (greeting, clarifying question) — nothing to verify.
          finalChat = result.chat;
          finalRecommendation = undefined;
          break;
        }

        const available = await isAvailableInBrazil(result.recommendation.title, result.recommendation.type);
        if (available) {
          finalChat = result.chat;
          finalRecommendation = result.recommendation;
          break;
        }

        // Not actually available — don't show it. Try again, excluding this title.
        excludedTitles.push(result.recommendation.title);
      }

      if (finalRecommendation) {
        await addToWatchHistory({
          id: Date.now(), // Temporary ID until we get the real one
          media_type: finalRecommendation.type,
          title: finalRecommendation.title,
          name: finalRecommendation.title, // For TV shows
          poster_path: null // We'll update this when we get the real content details
        }, userId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: finalChat,
          sender: "ai",
          timestamp: new Date(),
          recommendation: finalRecommendation,
        },
      ]);
      setIsTyping(false);
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
        {messages.length === 0 && !isTyping && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-filmeja-purple/15 flex items-center justify-center mb-4">
              <Clapperboard className="w-8 h-8 text-filmeja-purple" />
            </div>
            <h4 className="text-white font-semibold text-base mb-1">
              O que vamos assistir hoje?
            </h4>
            <p className="text-gray-400 text-sm max-w-xs mb-5">
              Me conta seu humor, um gênero ou manda um "oi" que eu te ajudo a escolher.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => handleSend(starter)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200 hover:bg-white/10 hover:border-filmeja-purple/50 transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
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
            onClick={() => handleSend()}
            className="bg-filmeja-purple hover:bg-filmeja-purple/90 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
