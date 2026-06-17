import { apiFetch } from "../lib/api";
import { getCurrentSession } from "../lib/supabase";
import type { ChatItem, Message as UIMessage } from "../data/chats";
import type {
  ChatLastMessage,
  ChatListItem,
  GetChatMessagesResponse,
  GetMeChatsResponse,
  Message as ApiMessage,
  PostMessageResponse,
} from "../types/api";

// Datenschicht für den Chat-Tab. Mappt das Backend-Chat-Shape auf das
// namensbasierte UI-Shape (data/chats.ts), damit die Designer-UI bleibt.
// Ohne Realtime: Nachrichten werden beim Öffnen geladen und nach dem
// Senden aktualisiert (Entscheidung 2026-06-17).

async function eigeneId(): Promise<string | null> {
  const s = await getCurrentSession();
  return s?.user.id ?? null;
}

function uhrzeit(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Die letzte Nachricht als einzelnes UI-Message-Element — die Chat-Liste
// nutzt sie für die Vorschau (messages[last]). Spart einen Extra-Call.
function mapLastMessage(m: ChatLastMessage, ich: string | null): UIMessage {
  return {
    id: m.id,
    fromMe: !!m.senderId && m.senderId === ich,
    time: uhrzeit(m.createdAt),
    text: m.text ?? undefined,
  };
}

// Bei 1:1-Chats ist der "Name" der andere Teilnehmer, bei Gruppen die
// Aktivität. linkType/linkId steuern, worauf der Chat-Header verweist.
function mapChat(c: ChatListItem, ich: string | null): ChatItem {
  const messages = c.lastMessage ? [mapLastMessage(c.lastMessage, ich)] : [];
  if (c.typ === "DIRECT") {
    const other = c.teilnehmer.find((t) => t.id !== ich) ?? c.teilnehmer[0];
    return {
      id: c.id,
      name: other?.name ?? "Chat",
      image: other?.bild ?? null,
      messages,
      linkType: "person",
      linkId: other?.id,
    };
  }
  return {
    id: c.id,
    name: c.aktivitaet?.name ?? "Gruppe",
    image: c.aktivitaet?.bild ?? null,
    messages,
    linkType: "activity",
    linkId: c.aktivitaet?.id,
  };
}

function mapMessage(m: ApiMessage, ich: string | null): UIMessage {
  return {
    id: m.id,
    fromMe: !!m.senderId && m.senderId === ich,
    time: uhrzeit(m.createdAt),
    senderName: m.sender?.name,
    text: m.text ?? undefined,
    // Meeting-Proposals folgen in einem späteren Schritt.
  };
}

export async function ladeChats(): Promise<ChatItem[]> {
  const ich = await eigeneId();
  const res = await apiFetch<GetMeChatsResponse>("/me/chats");
  return res.chats.map((c) => mapChat(c, ich));
}

// Nachrichten eines Chats, chronologisch (älteste zuerst). Das Backend
// liefert neueste zuerst → hier umkehren.
export async function ladeNachrichten(chatId: string): Promise<UIMessage[]> {
  const ich = await eigeneId();
  const res = await apiFetch<GetChatMessagesResponse>(`/chats/${chatId}/messages?limit=50`);
  return res.messages.map((m) => mapMessage(m, ich)).reverse();
}

export async function sendeNachricht(chatId: string, text: string): Promise<UIMessage> {
  const ich = await eigeneId();
  const res = await apiFetch<PostMessageResponse>(`/chats/${chatId}/messages`, {
    method: "POST",
    body: { text },
  });
  return mapMessage(res.message, ich);
}
