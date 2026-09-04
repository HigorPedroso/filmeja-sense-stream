import type { Message } from "@/components/AiChat/AiChat";
import i18n from "@/i18n";

export interface FilminConversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const CONVERSATIONS_KEY = "filmin_conversations";
// Older builds kept a single global chat under this key — folded into the
// new list on first read so existing users don't lose their history.
const LEGACY_MESSAGES_KEY = "chat_messages";

export function deriveTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.sender === "user");
  if (!firstUserMessage) return i18n.t("filminChat.newConversationTitle");
  const text = firstUserMessage.text.trim();
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

// The conversation's "cover" is the poster of the first title it actually
// recommended — falls back to the Filmin.IA mascot (handled by the caller)
// when nothing's been recommended in it yet.
export function getConversationCoverPosterPath(conversation: FilminConversation): string | undefined {
  return conversation.messages.find((m) => m.recommendation?.posterPath)?.recommendation?.posterPath;
}

function readAll(): FilminConversation[] {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_MESSAGES_KEY);
  if (legacyRaw) {
    try {
      const legacyMessages = JSON.parse(legacyRaw);
      if (Array.isArray(legacyMessages) && legacyMessages.length > 0) {
        const migrated: FilminConversation[] = [
          {
            id: "legacy",
            title: deriveTitle(legacyMessages),
            messages: legacyMessages,
            updatedAt: Date.now(),
          },
        ];
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_MESSAGES_KEY);
        return migrated;
      }
    } catch {
      // Malformed legacy data — nothing worth carrying over.
    }
  }

  return [];
}

function writeAll(conversations: FilminConversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export function getConversations(): FilminConversation[] {
  return [...readAll()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): FilminConversation | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveConversation(conversation: FilminConversation) {
  const all = readAll();
  const index = all.findIndex((c) => c.id === conversation.id);
  if (index >= 0) {
    all[index] = conversation;
  } else {
    all.push(conversation);
  }
  writeAll(all);
}

export function deleteConversation(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function createConversation(): FilminConversation {
  const conversation: FilminConversation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: i18n.t("filminChat.newConversationTitle"),
    messages: [],
    updatedAt: Date.now(),
  };
  saveConversation(conversation);
  return conversation;
}
