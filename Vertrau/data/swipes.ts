import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ChatItem } from "./chats";
import { type Person } from "./personen";
import { speichereUserChat } from "./userAktivitaeten";

// Swipe-Mock-Store. Spiegelt die Backend-Mechanik aus Phase 2f:
// POST /likes speichert das Like und erzeugt bei Gegenseitigkeit in einer
// Transaktion Match + DIRECT-Chat. Hier simuliert: eine feste Menge von
// Demo-Personen "likt zurück" — Rechts-Swipe auf sie wird sofort zum Match
// ("Freunde"). In Phase 4e ersetzt POST /likes diesen Store, die UI bleibt.

const LIKES_KEY = "swipe_likes_v1";

// Jonas (4) und Lena (5) liken zurück — die drei anderen Demo-Personen
// haben bereits Chats in INITIAL_CHATS, diese zwei nicht. So entsteht
// beim Match sichtbar ein NEUER Chat im Chat-Tab.
const LIKT_ZURUECK = new Set(["4", "5"]);

export async function ladeGelikte(): Promise<string[]> {
  const gespeichert = await AsyncStorage.getItem(LIKES_KEY);
  return gespeichert ? JSON.parse(gespeichert) : [];
}

export type LikeErgebnis = {
  match: boolean;
  chatId?: string;
};

export async function likePerson(person: Person): Promise<LikeErgebnis> {
  const likes = await ladeGelikte();
  if (!likes.includes(person.id)) {
    await AsyncStorage.setItem(LIKES_KEY, JSON.stringify([...likes, person.id]));
  }

  if (!LIKT_ZURUECK.has(person.id)) return { match: false };

  // Match → 1:1-Chat anlegen (analog zur Backend-Transaktion)
  const chatId = `person-${person.id}`;
  const chat: ChatItem = {
    id: chatId,
    name: person.name,
    image: person.bilder.find((b): b is string => !!b) ?? null,
    linkType: "person",
    linkId: person.id,
    messages: [],
  };
  await speichereUserChat(chat);

  return { match: true, chatId };
}

// Nur für die Demo: Likes zurücksetzen, damit der Feed wieder voll ist.
// (Die erzeugten Chats bleiben bestehen.)
export async function resetSwipes(): Promise<void> {
  await AsyncStorage.removeItem(LIKES_KEY);
}
