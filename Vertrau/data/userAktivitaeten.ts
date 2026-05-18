import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Aktivitaet } from "./aktivitaeten";
import { type ChatItem, type Message, type MessageProposal } from "./chats";
import { joinAktivitaet } from "./joined";

const AKT_KEY = "user_aktivitaeten_v1";
const CHAT_KEY = "user_chats_v1";
export const MESSAGES_PREFIX = "messages_v4_";

// ─── Aktivitäten ──────────────────────────────────────────────────────────────

export async function ladeUserAktivitaeten(): Promise<Aktivitaet[]> {
  const gespeichert = await AsyncStorage.getItem(AKT_KEY);
  return gespeichert ? JSON.parse(gespeichert) : [];
}

export async function speichereUserAktivitaet(a: Aktivitaet): Promise<void> {
  const liste = await ladeUserAktivitaeten();
  const neu = [...liste.filter((x) => x.id !== a.id), a];
  await AsyncStorage.setItem(AKT_KEY, JSON.stringify(neu));
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export async function ladeUserChats(): Promise<ChatItem[]> {
  const gespeichert = await AsyncStorage.getItem(CHAT_KEY);
  return gespeichert ? JSON.parse(gespeichert) : [];
}

export async function speichereUserChat(c: ChatItem): Promise<void> {
  const liste = await ladeUserChats();
  const neu = [...liste.filter((x) => x.id !== c.id), c];
  await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(neu));
}

// ─── Komplette Erstellung (Aktivität + Chat + Join) ───────────────────────────

export async function erstelleAktivitaet(
  aktivitaet: Aktivitaet
): Promise<{ chatId: string }> {
  await speichereUserAktivitaet(aktivitaet);

  const chatId = `activity-${aktivitaet.id}`;
  const chat: ChatItem = {
    id: chatId,
    name: aktivitaet.titel,
    image: aktivitaet.hintergrundbild,
    linkType: "activity",
    linkId: aktivitaet.id,
    messages: [],
  };
  await speichereUserChat(chat);

  await joinAktivitaet(aktivitaet.id);
  return { chatId };
}

// ─── Treffens-Vorschlag in einen Personen-Chat senden ─────────────────────────

export async function sendeAktivitaetsVorschlag(
  chatId: string,
  proposal: MessageProposal
): Promise<void> {
  const key = MESSAGES_PREFIX + chatId;
  const jetzt = new Date();
  const zeit = `${jetzt.getHours().toString().padStart(2, "0")}:${jetzt
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const neu: Message = {
    id: `m_${jetzt.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
    fromMe: true,
    time: zeit,
    proposal,
  };
  const gespeichert = await AsyncStorage.getItem(key);
  const bestehend: Message[] = gespeichert ? JSON.parse(gespeichert) : [];
  await AsyncStorage.setItem(key, JSON.stringify([...bestehend, neu]));
}
