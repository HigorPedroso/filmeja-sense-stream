import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getConversations,
  createConversation,
  deleteConversation,
  getConversationCoverPosterPath,
  type FilminConversation,
} from "@/lib/filminConversations";

// Width (px) of the red delete area revealed by the iOS-style swipe.
const DELETE_WIDTH = 84;

interface ConversationRowProps {
  conversation: FilminConversation;
  isOpen: boolean;
  onOpenChange: (id: string | null) => void;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationRow = ({ conversation, isOpen, onOpenChange, onSelect, onDelete }: ConversationRowProps) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const coverPosterPath = getConversationCoverPosterPath(conversation);
  // framer-motion's own tap/drag gesture resolution (info.offset /
  // info.velocity from onDragEnd + onTap) turned out unreliable on real
  // touch hardware — plain taps kept getting misread as drags. This tracks
  // the raw pointerdown→pointerup distance ourselves, via native pointer
  // events, and uses that single number as the only source of truth for
  // "was this a tap or a drag".
  const pointerDownX = useRef<number | null>(null);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={onDelete}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-white"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-xs font-medium">Excluir</span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -DELETE_WIDTH, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        animate={{ x: isOpen ? -DELETE_WIDTH : 0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        onPointerDown={(e) => {
          pointerDownX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (pointerDownX.current === null) return;
          const delta = e.clientX - pointerDownX.current;
          pointerDownX.current = null;

          // 24px is well past normal touch jitter but still far short of
          // a deliberate swipe — anything under that is unambiguously a tap.
          if (Math.abs(delta) < 24) {
            if (isOpen) {
              onOpenChange(null);
            } else {
              onSelect();
            }
          } else {
            onOpenChange(delta < -DELETE_WIDTH / 2 ? conversation.id : null);
          }
        }}
        className="relative z-10 w-full flex items-center gap-3 py-3 px-2 bg-filmeja-dark cursor-pointer"
      >
        <div className="w-11 h-11 rounded-xl bg-filmeja-purple/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {coverPosterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w200${coverPosterPath}`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <img src="/mascote.png" alt="" className="w-8 h-8 object-contain" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{conversation.title}</h3>
          <p className="text-gray-400 text-sm truncate">
            {lastMessage ? lastMessage.text : "Nenhuma mensagem ainda"}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            há{" "}
            {formatDistanceToNow(new Date(conversation.updatedAt), { locale: ptBR }).replace(/^cerca de /, "")}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </motion.div>
    </div>
  );
};

const FilminConversations = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<FilminConversation[]>([]);
  const [query, setQuery] = useState("");
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setConversations(getConversations());
  }, []);

  const handleNewChat = () => {
    const conversation = createConversation();
    navigate(`/filmin-ia/${conversation.id}`);
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setOpenRowId(null);
  };

  // Routes don't get exit animations for free (no AnimatePresence around
  // <Routes>), so we fake it: animate back out to the right first, then
  // navigate away once that animation actually finishes.
  const handleBack = () => setIsClosing(true);

  const filteredConversations = conversations.filter((conversation) => {
    if (!query.trim()) return true;
    const haystack = `${conversation.title} ${conversation.messages.map((m) => m.text).join(" ")}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isClosing ? "100%" : 0 }}
      transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (isClosing) navigate(-1);
      }}
      className="h-[100dvh] bg-filmeja-dark flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-gray-300 hover:text-white p-1 -ml-1"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white">Conversas</h1>
        <button
          onClick={handleNewChat}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-filmeja-purple to-filmeja-blue flex items-center justify-center text-white flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em conversas"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" onClick={() => setOpenRowId(null)}>
        {filteredConversations.length === 0 ? (
          conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <MessageSquare className="w-16 h-16 text-gray-600 mb-6" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-white mb-2">Inicie sua primeira conversa</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Toque no botão + para criar sua próxima conversa
              </p>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 text-filmeja-purple font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Chat
              </button>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              Nenhuma conversa encontrada para "{query}"
            </p>
          )
        ) : (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            {filteredConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isOpen={openRowId === conversation.id}
                onOpenChange={setOpenRowId}
                onSelect={() => navigate(`/filmin-ia/${conversation.id}`)}
                onDelete={() => handleDelete(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FilminConversations;
