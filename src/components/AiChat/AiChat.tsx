import { useState, useRef, useEffect, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Send, Target, Clock, Users, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addToWatchHistory } from "@/lib/utils/watch-history";
import { searchContentByTitle, fetchContentWithProviders } from "@/lib/utils/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { getConversation, saveConversation, deriveTitle } from "@/lib/filminConversations";

// iOS/WKWebView zooms the whole page in on focus whenever the focused
// input's font-size is under 16px — Android has no such behavior. Forcing
// 16px (text-base) only on iOS avoids the zoom without touching Android's
// existing text-sm-on-mobile sizing.
const isIOS = Capacitor.getPlatform() === "ios";

// How many times we'll ask the AI for a different title before giving up and
// showing a plain response with no recommendation attached. Each attempt
// costs a real TMDB lookup, so this stays small.
const MAX_RECOMMENDATION_ATTEMPTS = 3;

// Quick conversation starters shown on the empty state. Humor and gênero
// already have their own dedicated pickers on the dashboard, so these lean
// into what only the chat can do: specific, contextual requests.
const QUICK_STARTERS = [
  { icon: Target, label: "Algo parecido com o que eu gostei", message: "Quero algo parecido com um filme ou série que eu gostei muito" },
  { icon: Clock, label: "Tenho pouco tempo hoje", message: "Quero um filme curto, tenho pouco tempo hoje" },
  { icon: Users, label: "Pra assistir em família", message: "Quero algo pra assistir em família" },
  { icon: Shuffle, label: "Me surpreenda", message: "Me surpreenda com uma recomendação" },
];

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  recommendation?: {
    title: string;
    type?: "movie" | "tv"; // Ensure this is strictly typed as "movie" | "tv"
    releaseYear?: number;
    posterPath?: string;
  };
}

// Add these props to the component
interface AiChatProps {
  conversationId: string;
  onShowContent: (title: string, type?: "movie" | "tv", releaseYear?: number) => void;
  watchedContent?: Array<{ title?: string; name?: string; type?: "movie" | "tv" }>;
  userId: string; // Add this line
  userName?: string;
  fullScreen?: boolean;
  headerLeft?: ReactNode;
}

// Update the component parameters
export function AiChat({
  conversationId,
  onShowContent,
  watchedContent = [],
  userId,
  userName,
  fullScreen = false,
  headerLeft,
}: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    () => getConversation(conversationId)?.messages || []
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractRecommendation = (text: string): Message["recommendation"] | null => {
    const titleMatch = text.match(/["']([^"']+)["']/);
    const typeMatch = text.toLowerCase().includes("série") ? "tv" : "movie";
    return titleMatch ? { title: titleMatch[1], type: typeMatch as "movie" | "tv" } : null;
  };

  // Ground truth check: is this title actually on a streaming platform in
  // Brazil right now? The prompt tells the AI to only recommend available
  // titles, but that's advisory — the model can still get it wrong, and this
  // is a premium feature, so we verify against TMDB before ever showing a
  // recommendation to the user instead of trusting the AI's word for it.
  // Also returns the poster, already fetched as part of this same check, so
  // the recommendation can double as this conversation's cover image.
  const checkAvailabilityInBrazil = async (title: string, type: "movie" | "tv", releaseYear?: number) => {
    try {
      const item = await searchContentByTitle(title, type, releaseYear);
      const details = await fetchContentWithProviders(item, { showToast: false, requireBrAvailability: true });
      return { available: true, posterPath: details?.poster_path as string | undefined };
    } catch {
      return { available: false, posterPath: undefined };
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText ?? input;
    if (!textToSend.trim()) return;

    // Show the user's message and clear the input right away — everything
    // else here is async network work (watch history, Gemini, TMDB checks)
    // that shouldn't make the message feel like it's taking forever to send.
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };
    // Last turns of the actual conversation (before this new message), so
    // the model has real context instead of treating every message as a
    // fresh, isolated request.
    const conversationHistory = messages
      .slice(-12)
      .map((m) => `${m.sender === "user" ? "Usuário" : "Filmin.IA"}: ${m.text}`)
      .join("\n");

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

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

      const today = new Date();
      const todayFormatted = today.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const buildPrompt = (excludedTitles: string[]) => `Você é o Filmin.IA, um assistente de descoberta de filmes e séries. Converse de forma natural e simpática, como um amigo cinéfilo — não como um robô que só cospe recomendações.

${userName ? `Você está conversando com ${userName}. Pode chamá-lo(a) pelo nome de vez em quando para deixar a conversa mais pessoal, sem exagerar.` : ""}

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
  "recommendation": { "title": "Nome exato do título", "type": "movie ou tv", "releaseYear": 2019 } ou null se não estiver recomendando nada agora
}
IMPORTANTE:
- "type" tem que refletir o que você está de fato recomendando: "movie" para filme, "tv" para série. NUNCA coloque "movie" por padrão — se for uma série, é "tv". Errar isso faz o app buscar na categoria errada e mostrar um título completamente diferente pra pessoa.
- "releaseYear" é o ano de lançamento REAL do título (ano em que estreou) — sem ele não conseguimos diferenciar remakes e refilmagens que usam o mesmo nome (ex: "Duna" 2021 vs 1984), então sempre inclua quando houver uma recomendação.`;

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
                  releaseYear: Number(rawRecommendation.releaseYear) || undefined,
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

        const { available, posterPath } = await checkAvailabilityInBrazil(
          result.recommendation.title,
          result.recommendation.type,
          result.recommendation.releaseYear
        );
        if (available) {
          finalChat = result.chat;
          finalRecommendation = { ...result.recommendation, posterPath };
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
          poster_path: finalRecommendation.posterPath || null
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

  // Persist to this conversation's slot every time messages change, so the
  // conversations list (title + preview) always reflects the latest state.
  useEffect(() => {
    saveConversation({
      id: conversationId,
      title: deriveTitle(messages),
      messages,
      updatedAt: Date.now(),
    });
  }, [conversationId, messages]);

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
          <img src="/mascote.png" alt="Filmin.IA" className="w-6 h-6 object-contain flex-shrink-0" />
          <span className="truncate">Filmin.AI te ajuda</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="pt-4 px-2">
            <img src="/mascote.png" alt="Filmin.IA" className="w-14 h-14 object-contain mb-3" />
            <h2 className="text-3xl font-bold text-white mb-1">
              Oi{userName ? ` ${userName.split(" ")[0]}` : ""}
            </h2>
            <p className="text-gray-400 text-lg mb-6">Vamos escolher algo bom pra assistir!</p>

            <div className="space-y-3">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => handleSend(starter.message)}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-3.5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <starter.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{starter.label}</span>
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
              <div className="max-w-[80%]">
                <div
                  className={`p-3 rounded-xl ${message.sender === "user" ? "bg-filmeja-purple text-white" : "bg-white/10 text-white"}`}
                >
                  {message.sender === "ai" ? message.text : message.text}
                  {message.sender === "ai" && message.recommendation && (
                    <Button
                      onClick={() => {
                        const title = message.recommendation?.title || "";
                        const type = message.recommendation?.type || "movie";
                        onShowContent(title, type, message.recommendation?.releaseYear);
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
              className="flex justify-start"
            >
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
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-3xl pl-5 pr-2 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte qualquer coisa..."
            className={`flex-1 bg-transparent text-white py-2 placeholder:text-gray-400 focus:outline-none ${
              isIOS ? "text-base" : "text-sm md:text-base"
            }`}
          />
          <button
            onClick={() => handleSend()}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-filmeja-purple to-filmeja-blue flex items-center justify-center text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
