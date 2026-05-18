// ─── Typen ────────────────────────────────────────────────────────────────────

export type ProposalStatus = "pending" | "accepted" | "declined";

export type MessageProposal = {
  coverbild: string;
  locationId?: string; // bei Zu-zweit-Vorschlägen über DEMO_LOCATIONS gesetzt
  aktivitaetId?: string; // bei Gruppentreffen-Vorschlägen gesetzt
  // Bei "Eigenes Treffen vorschlagen" (Zu-zweit, freie Adresse) gesetzt –
  // weder locationId noch aktivitaetId, sondern komplett eigene Daten.
  customAdresse?: { strasse: string; plzOrt: string };
  customKoordinaten?: { latitude: number; longitude: number };
  customBilder?: string[];
  aktivitaet: string;
  datum: string; // frei formatiert, z.B. "25/04/2026"
  uhrzeit: string; // frei formatiert, z.B. "19:30"
  status?: ProposalStatus;
};

export type Message = {
  id: string;
  fromMe: boolean;
  time: string; // "HH:MM"
  senderName?: string; // nur in Gruppen-Chats: Anzeigename des Absenders
  text?: string; // bei Textnachrichten gesetzt
  proposal?: MessageProposal; // bei Treffensvorschlägen gesetzt
};

export type ChatItem = {
  id: string;
  name: string;
  image: string | null; // null → grauer Platzhalter
  messages: Message[];
  linkType?: "person" | "activity"; // worauf der Header verweist
  linkId?: string; // ID der verknüpften Person/Aktivität
};

// ─── Demo-Daten ───────────────────────────────────────────────────────────────

export const INITIAL_CHATS: ChatItem[] = [
  // Aktivitäts-Chats (Bilder aus dem Treffen-Tab)
  {
    id: "activity-1",
    name: "Volleyball am Strand",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800",
    linkType: "activity",
    linkId: "1",
    messages: [
      { id: "a1m1", text: "Hey alle! Wann treffen wir uns genau?", fromMe: false, time: "14:30", senderName: "Anna" },
      { id: "a1m2", text: "Ich würde 15 Uhr vorschlagen, passt das allen?", fromMe: true, time: "14:32" },
      { id: "a1m3", text: "Passt mir super 👍", fromMe: false, time: "14:35", senderName: "Ben" },
      { id: "a1m4", text: "Mir auch! Ich bring einen Ball mit.", fromMe: false, time: "14:37", senderName: "Clara" },
    ],
  },
  {
    id: "activity-2",
    name: "Kaffee & Lerngruppe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    linkType: "activity",
    linkId: "2",
    messages: [
      { id: "a2m1", text: "Bringt bitte eure Unterlagen und Laptops mit!", fromMe: false, time: "10:00", senderName: "David" },
      { id: "a2m2", text: "Klar, ich hab auch Karteikarten dabei.", fromMe: true, time: "10:04" },
      { id: "a2m3", text: "Super, bis morgen dann! ☕", fromMe: false, time: "10:06", senderName: "Eva" },
    ],
  },

  // Personen-Chats (kein Profilbild)
  {
    id: "person-1",
    name: "Sophie Wagner",
    image: null,
    linkType: "person",
    linkId: "1",
    messages: [
      { id: "p1m1", text: "Hey, hast du die Vorlesung heute besucht?", fromMe: false, time: "09:15" },
      { id: "p1m2", text: "Nein leider nicht – kannst du mir die Notizen schicken?", fromMe: true, time: "09:20" },
      { id: "p1m3", text: "Natürlich, schick ich dir gleich! 📝", fromMe: false, time: "09:21" },
      {
        id: "p1m4",
        fromMe: false,
        time: "18:42",
        proposal: {
          coverbild:
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
          locationId: "loc1",
          aktivitaet: "Gamestate",
          datum: "26/04/2026",
          uhrzeit: "19:30",
          status: "pending",
        },
      },
    ],
  },
  {
    id: "person-2",
    name: "Luca Bauer",
    image: null,
    linkType: "person",
    linkId: "2",
    messages: [
      { id: "p2m1", text: "Wollen wir heute Abend zusammen essen gehen?", fromMe: true, time: "12:00" },
      { id: "p2m2", text: "Ja gerne! Um 19 Uhr am Marktplatz?", fromMe: false, time: "12:10" },
      {
        id: "p2m3",
        fromMe: false,
        time: "17:05",
        proposal: {
          coverbild:
            "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400",
          aktivitaetId: "1",
          aktivitaet: "Volleyball am Strand",
          datum: "28/04/2026",
          uhrzeit: "16:00",
          status: "pending",
        },
      },
    ],
  },
  {
    id: "person-3",
    name: "Mia Hoffmann",
    image: null,
    linkType: "person",
    linkId: "3",
    messages: [
      { id: "p3m1", text: "War heute wirklich schön, danke dir! 😊", fromMe: false, time: "20:45" },
    ],
  },
];
