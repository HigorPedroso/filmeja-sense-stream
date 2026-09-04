import { useState, useRef, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Send, Target, Clock, Users, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addToWatchHistory } from "@/lib/utils/watch-history";
import { searchContentByTitle, fetchContentWithProviders } from "@/lib/utils/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { getConversation, saveConversation, deriveTitle } from "@/lib/filminConversations";
import { getTmdbLanguage } from "@/lib/tmdbLanguage";

// iOS/WKWebView zooms the whole page in on focus whenever the focused
// input's font-size is under 16px — Android has no such behavior. Forcing
// 16px (text-base) only on iOS avoids the zoom without touching Android's
// existing text-sm-on-mobile sizing.
const isIOS = Capacitor.getPlatform() === "ios";

// How many times we'll ask the AI for a different title before giving up and
// showing a plain response with no recommendation attached. Each attempt
// costs a real TMDB lookup, so this stays small.
const MAX_RECOMMENDATION_ATTEMPTS = 3;

// Quick conversation starters shown on the empty state. Mood and genre
// already have their own dedicated pickers on the dashboard, so these lean
// into what only the chat can do: specific, contextual requests. Built
// inside the component (not as a module-level constant) since the label/
// message text depends on the current language.
const QUICK_STARTER_ICONS = [Target, Clock, Users, Shuffle];
const QUICK_STARTER_KEYS = ["similar", "shortOnTime", "family", "surpriseMe"] as const;

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
  const { t } = useTranslation();
  const QUICK_STARTERS = QUICK_STARTER_KEYS.map((key, index) => ({
    icon: QUICK_STARTER_ICONS[index],
    label: t(`filminChat.quickStarters.${key}.label`),
    message: t(`filminChat.quickStarters.${key}.message`),
  }));
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
    const lowerText = text.toLowerCase();
    const typeMatch = /série|series|show/.test(lowerText) ? "tv" : "movie";
    return titleMatch ? { title: titleMatch[1], type: typeMatch as "movie" | "tv" } : null;
  };

  // Ground truth check: is this title actually on a streaming platform in
  // the user's region right now? The prompt tells the AI to only recommend
  // available titles, but that's advisory — the model can still get it
  // wrong, and this is a premium feature, so we verify against TMDB before
  // ever showing a recommendation to the user instead of trusting the AI's
  // word for it. Also returns the poster, already fetched as part of this
  // same check, so the recommendation can double as this conversation's
  // cover image.
  const checkRegionAvailability = async (title: string, type: "movie" | "tv", releaseYear?: number) => {
    try {
      const item = await searchContentByTitle(title, type, releaseYear);
      const details = await fetchContentWithProviders(item, { showToast: false, requireRegionAvailability: true });
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
    const tmdbLang = getTmdbLanguage();
    const chatLang: "en" | "es" | "pt" = tmdbLang === "en-US" ? "en" : tmdbLang === "es-MX" ? "es" : "pt";
    const userLabel = chatLang === "en" ? "User" : chatLang === "es" ? "Usuario" : "Usuário";

    // Last turns of the actual conversation (before this new message), so
    // the model has real context instead of treating every message as a
    // fresh, isolated request.
    const conversationHistory = messages
      .slice(-12)
      .map((m) => `${m.sender === "user" ? userLabel : "Filmin.IA"}: ${m.text}`)
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
      const todayFormatted = today.toLocaleDateString(
        chatLang === "en" ? "en-US" : chatLang === "es" ? "es-MX" : "pt-BR",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

      // Bilingual system prompt — the model's "chat" reply is shown to the
      // user verbatim (unlike the mood/genre recommendation prompts, whose
      // Gemini-authored text is discarded in favor of TMDB's own overview),
      // so this has to actually be written in the target language, not just
      // instructed to answer in it.
      const buildPrompt = (excludedTitles: string[]) => chatLang === "en" ? `You are Filmin.IA, a movie and TV show discovery assistant. Talk naturally and warmly, like a movie-loving friend — not like a robot that just spits out recommendations.

${userName ? `You're chatting with ${userName}. Feel free to use their name once in a while to keep things personal, without overdoing it.` : ""}

Today's date is ${todayFormatted}. This is the real, current date — ignore any assumption about "the current year" based on your training data, and use Google search when you need to confirm recent or upcoming releases.

Rules:
- If the person just said hi or hasn't given any hint of what they want to watch yet, you can ask ONE question to get a sense of their taste (mood, genre, time available, etc.) before recommending.
- As soon as the person gives any preference at all (mood, genre, length, "something tense", "a comedy", etc.), that's enough — recommend a specific title in that same reply. Don't chain clarifying questions; at most ONE follow-up question in the whole conversation before recommending.
- Never recommend titles the person has already watched or that were already recommended before (lists below), and don't repeat a title already suggested in this conversation.
- NEVER recommend movies or shows that haven't been released yet (announced, "in production", with a future release date). Only recommend titles that have already premiered and can be watched today. If you're unsure whether something has released, use Google search to confirm before recommending — when in doubt, prefer an older title that's confirmed available.
- Only recommend titles available on a paid streaming platform in the US (Netflix, Prime Video, Max, Disney+, Hulu, Apple TV+, etc.). Avoid festival releases, titles exclusive to another country, or theatrical-only releases — if you're not sure it's streaming in the US, prefer a more popular, confirmed-available title.${
        excludedTitles.length
          ? `\n- The following titles have ALREADY BEEN CHECKED and are NOT available on any streaming service in the US — don't suggest any of them again: ${excludedTitles.join(", ")}.`
          : ""
      }
- Keep it short (2-4 sentences) and use emoji sparingly.

Titles the person has already watched: ${watchedTitles || "none"}.
Recent recommendations already made (don't repeat): ${recentTitles || "none"}.

Conversation so far:
${conversationHistory || "(start of conversation)"}
User: "${textToSend}"

ALWAYS respond in valid JSON, with no text outside the JSON, in this exact format:
{
  "chat": "your reply to the person, in English",
  "recommendation": { "title": "Exact title name", "type": "movie or tv", "releaseYear": 2019 } or null if you're not recommending anything right now
}
IMPORTANT:
- "type" has to reflect what you're actually recommending: "movie" for a movie, "tv" for a show. NEVER default to "movie" — if it's a show, it's "tv". Getting this wrong makes the app search the wrong category and show a completely different title to the person.
- "releaseYear" is the title's REAL release year (the year it premiered) — without it we can't tell apart remakes and reboots that reuse the same name (e.g. "Dune" 2021 vs 1984), so always include it whenever there's a recommendation.` : chatLang === "es" ? `Eres Filmin.IA, un asistente para descubrir películas y series. Habla de forma natural y cercana, como un amigo cinéfilo — no como un robot que solo suelta recomendaciones.

${userName ? `Estás charlando con ${userName}. Puedes usar su nombre de vez en cuando para que la conversación se sienta más personal, sin exagerar.` : ""}

Hoy es ${todayFormatted}. Esta es la fecha real y actual — ignora cualquier suposición sobre "el año actual" basada en tus datos de entrenamiento, y usa la búsqueda de Google cuando necesites confirmar estrenos recientes o próximos.

Reglas:
- Si la persona solo saludó o todavía no dio ninguna pista de qué quiere ver, puedes hacer UNA pregunta para conocer su gusto (ánimo, género, tiempo disponible, etc.) antes de recomendar.
- En cuanto la persona dé cualquier preferencia (ánimo, género, duración, "algo tenso", "una comedia", etc.), ya es suficiente — recomienda un título específico en esa misma respuesta. No encadenes preguntas de aclaración; como máximo UNA pregunta de seguimiento en toda la conversación antes de recomendar.
- Nunca recomiendes títulos que la persona ya vio o que ya fueron recomendados antes (listas abajo), ni repitas un título ya sugerido en esta conversación.
- NUNCA recomiendes películas o series que todavía no se hayan estrenado (anunciadas, "en producción", con fecha de estreno futura). Solo recomienda títulos que ya se estrenaron y que se pueden ver hoy. Si tienes dudas sobre si algo ya se estrenó, usa la búsqueda de Google para confirmarlo antes de recomendar — en caso de duda, prefiere un título más antiguo y con disponibilidad confirmada.
- Solo recomienda títulos disponibles en alguna plataforma de streaming por suscripción en México (Netflix, Prime Video, Max, Disney+, Star+, Apple TV+, etc.). Evita estrenos de festival, exclusivos de otro país o solo en cines — si no estás seguro de la disponibilidad en streaming en México, prefiere un título más popular y con disponibilidad confirmada.${
        excludedTitles.length
          ? `\n- Los siguientes títulos YA FUERON VERIFICADOS y NO están disponibles en ningún streaming en México — no sugieras ninguno de nuevo: ${excludedTitles.join(", ")}.`
          : ""
      }
- Sé breve (2-4 frases) y usa emojis con moderación.

Títulos que la persona ya vio: ${watchedTitles || "ninguno"}.
Últimas recomendaciones ya hechas (no repetir): ${recentTitles || "ninguna"}.

Conversación hasta ahora:
${conversationHistory || "(inicio de la conversación)"}
Usuario: "${textToSend}"

Responde SIEMPRE en JSON válido, sin ningún texto fuera del JSON, en este formato exacto:
{
  "chat": "tu respuesta para la persona, en español",
  "recommendation": { "title": "Nombre exacto del título", "type": "movie o tv", "releaseYear": 2019 } o null si no estás recomendando nada ahora
}
IMPORTANTE:
- "type" tiene que reflejar lo que realmente estás recomendando: "movie" para película, "tv" para serie. NUNCA pongas "movie" por defecto — si es una serie, es "tv". Si te equivocas, la app busca en la categoría equivocada y le muestra a la persona un título completamente distinto.
- "releaseYear" es el año de estreno REAL del título (el año en que se estrenó) — sin él no podemos distinguir remakes y reboots que usan el mismo nombre (por ejemplo, "Dune" 2021 vs 1984), así que inclúyelo siempre que haya una recomendación.` : `Você é o Filmin.IA, um assistente de descoberta de filmes e séries. Converse de forma natural e simpática, como um amigo cinéfilo — não como um robô que só cospe recomendações.

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
      // fails the region-availability check, until we get a clean answer.
      const excludedTitles: string[] = [];
      let finalChat = t("filminChat.fallbackReply");
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

        const { available, posterPath } = await checkRegionAvailability(
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
          <span className="truncate">{t("filminChat.headerSubtitle")}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="pt-4 px-2">
            <img src="/mascote.png" alt="Filmin.IA" className="w-14 h-14 object-contain mb-3" />
            <h2 className="text-3xl font-bold text-white mb-1">
              {t("filminChat.greeting")}{userName ? ` ${userName.split(" ")[0]}` : ""}
            </h2>
            <p className="text-gray-400 text-lg mb-6">{t("filminChat.greetingSubtitle")}</p>

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
                      {t("filminChat.viewDetails")}
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
            placeholder={t("filminChat.inputPlaceholder")}
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
