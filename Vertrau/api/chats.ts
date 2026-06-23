import { apiFetch } from "../lib/api";
import { getCurrentSession } from "../lib/supabase";
import type {
  ChatItem,
  Message as UIMessage,
  MessageProposal as UIProposal,
  ProposalStatus,
} from "../data/chats";
import type {
  ChatLastMessage,
  ChatListItem,
  EinladungsStatus,
  GetChatMessagesResponse,
  GetMeChatsResponse,
  MeetingProposal as ApiProposal,
  Message as ApiMessage,
  PatchProposalResponse,
  PostMessageResponse,
  PostProposalResponse,
} from "../types/api";

// Cover-Fallback, falls ein Proposal (noch) kein Bild trägt.
const PROPOSAL_FALLBACK_BILD =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=400";

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

function datum(iso: string): string {
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function mapProposalStatus(s: EinladungsStatus): ProposalStatus {
  return s === "ACCEPTED" ? "accepted" : s === "DECLINED" ? "declined" : "pending";
}

// Backend-MeetingProposal → UI-Proposal. Drei Quellen: aktivitaetId
// (Gruppentreffen), locationId (Zu-zweit an Location) oder custom (freie
// Adresse). bilder[0] dient als Cover; bei custom sind es die User-Uploads.
function mapProposal(mp: ApiProposal): UIProposal {
  const istCustom =
    !mp.aktivitaetId &&
    !mp.locationId &&
    !!mp.customAdresseStrasse &&
    !!mp.customAdressePlzOrt;
  return {
    proposalId: mp.id,
    coverbild: mp.bilder[0] ?? PROPOSAL_FALLBACK_BILD,
    aktivitaetId: mp.aktivitaetId ?? undefined,
    locationId: mp.locationId ?? undefined,
    aktivitaet: mp.titel,
    datum: datum(mp.startAt),
    uhrzeit: uhrzeit(mp.startAt),
    status: mapProposalStatus(mp.status),
    ...(istCustom
      ? {
          customAdresse: {
            strasse: mp.customAdresseStrasse as string,
            plzOrt: mp.customAdressePlzOrt as string,
          },
          customKoordinaten:
            mp.customKoordinatenLat != null && mp.customKoordinatenLng != null
              ? {
                  latitude: mp.customKoordinatenLat,
                  longitude: mp.customKoordinatenLng,
                }
              : undefined,
          customBilder: mp.bilder,
        }
      : {}),
  };
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
    name: c.aktivitaet?.titel ?? "Gruppe",
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
    proposal: m.meetingProposal ? mapProposal(m.meetingProposal) : undefined,
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

// Auf einen Treffens-Vorschlag antworten (PATCH /meeting-proposals/:id).
// Bei einem Gruppentreffen-Vorschlag (aktivitaetId) macht "accepted" den
// Empfänger backend-seitig zum Teilnehmer + Gruppenchat-Mitglied.
export async function beantworteProposal(
  proposalId: string,
  antwort: "accepted" | "declined"
): Promise<void> {
  await apiFetch<PatchProposalResponse>(`/meeting-proposals/${proposalId}`, {
    method: "PATCH",
    body: { status: antwort === "accepted" ? "ACCEPTED" : "DECLINED" },
  });
}

export type VorschlagInput = {
  titel: string;
  startAt: string; // ISO
  bilder?: string[];
  locationId?: string;
  aktivitaetId?: string;
  customAdresseStrasse?: string;
  customAdressePlzOrt?: string;
  customKoordinatenLat?: number;
  customKoordinatenLng?: number;
};

// POST /chats/:chatId/proposals — Treffens-Vorschlag (zu zweit) senden.
// Genau eine Quelle: locationId | aktivitaetId | custom (Adresse + Koordinaten).
// bilder = Cover-Snapshot für die Chat-Karte.
export async function sendeVorschlag(
  chatId: string,
  input: VorschlagInput
): Promise<void> {
  await apiFetch<PostProposalResponse>(`/chats/${chatId}/proposals`, {
    method: "POST",
    body: input,
  });
}
