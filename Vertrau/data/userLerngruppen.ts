import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Teilnehmer } from "./aktivitaeten";
import { type ChatItem } from "./chats";
import { joinAktivitaet } from "./joined";
import { speichereUserChat } from "./userAktivitaeten";

const LERNGRUPPEN_KEY = "user_lerngruppen_v1";

export type Lerngruppe = {
  id: string;
  kursId: string;
  titel: string;
  ort: string;
  beschreibung: string;
  hintergrundbild: string;
  bilder: string[];
  adresse: {
    strasse: string;
    plzOrt: string;
  };
  koordinaten: {
    latitude: number;
    longitude: number;
  };
  datum: string;
  uhrzeit: string;
  maxPlaetze: number;
  teilnehmer: Teilnehmer[];
};

export async function ladeUserLerngruppen(): Promise<Lerngruppe[]> {
  const gespeichert = await AsyncStorage.getItem(LERNGRUPPEN_KEY);
  return gespeichert ? JSON.parse(gespeichert) : [];
}

export async function ladeUserLerngruppenFuerKurs(
  kursId: string
): Promise<Lerngruppe[]> {
  const alle = await ladeUserLerngruppen();
  return alle.filter((gruppe) => gruppe.kursId === kursId);
}

export async function speichereUserLerngruppe(
  lerngruppe: Lerngruppe
): Promise<void> {
  const liste = await ladeUserLerngruppen();
  const neu = [
    lerngruppe,
    ...liste.filter((gruppe) => gruppe.id !== lerngruppe.id),
  ];
  await AsyncStorage.setItem(LERNGRUPPEN_KEY, JSON.stringify(neu));
}

export async function erstelleLerngruppe(
  lerngruppe: Lerngruppe
): Promise<{ chatId: string }> {
  await speichereUserLerngruppe(lerngruppe);

  const chatId = `activity-${lerngruppe.id}`;
  const chat: ChatItem = {
    id: chatId,
    name: lerngruppe.titel,
    image: lerngruppe.hintergrundbild,
    linkType: "activity",
    linkId: lerngruppe.id,
    messages: [],
  };
  await speichereUserChat(chat);
  await joinAktivitaet(lerngruppe.id);
  return { chatId };
}
