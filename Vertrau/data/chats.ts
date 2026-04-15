// ─── Typen ────────────────────────────────────────────────────────────────────

export type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string; // "HH:MM"
};

export type ChatItem = {
  id: string;
  name: string;
  image: string | null; // null → grauer Platzhalter
  messages: Message[];
};

// ─── Demo-Daten ───────────────────────────────────────────────────────────────

export const INITIAL_CHATS: ChatItem[] = [
  // Aktivitäts-Chats (Bilder aus dem Treffen-Tab)
  {
    id: "activity-1",
    name: "Volleyball am Strand",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800",
    messages: [
      { id: "a1m1", text: "Hey alle! Wann treffen wir uns genau?", fromMe: false, time: "14:30" },
      { id: "a1m2", text: "Ich würde 15 Uhr vorschlagen, passt das allen?", fromMe: true, time: "14:32" },
      { id: "a1m3", text: "Passt mir super 👍", fromMe: false, time: "14:35" },
      { id: "a1m4", text: "Mir auch! Ich bring einen Ball mit.", fromMe: false, time: "14:37" },
    ],
  },
  {
    id: "activity-2",
    name: "Kaffee & Lerngruppe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    messages: [
      { id: "a2m1", text: "Bringt bitte eure Unterlagen und Laptops mit!", fromMe: false, time: "10:00" },
      { id: "a2m2", text: "Klar, ich hab auch Karteikarten dabei.", fromMe: true, time: "10:04" },
      { id: "a2m3", text: "Super, bis morgen dann! ☕", fromMe: false, time: "10:06" },
    ],
  },

  // Personen-Chats (kein Profilbild)
  {
    id: "person-1",
    name: "Sophie Wagner",
    image: null,
    messages: [
      { id: "p1m1", text: "Hey, hast du die Vorlesung heute besucht?", fromMe: false, time: "09:15" },
      { id: "p1m2", text: "Nein leider nicht – kannst du mir die Notizen schicken?", fromMe: true, time: "09:20" },
      { id: "p1m3", text: "Natürlich, schick ich dir gleich! 📝", fromMe: false, time: "09:21" },
    ],
  },
  {
    id: "person-2",
    name: "Luca Bauer",
    image: null,
    messages: [
      { id: "p2m1", text: "Wollen wir heute Abend zusammen essen gehen?", fromMe: true, time: "12:00" },
      { id: "p2m2", text: "Ja gerne! Um 19 Uhr am Marktplatz?", fromMe: false, time: "12:10" },
    ],
  },
  {
    id: "person-3",
    name: "Mia Hoffmann",
    image: null,
    messages: [
      { id: "p3m1", text: "War heute wirklich schön, danke dir! 😊", fromMe: false, time: "20:45" },
    ],
  },
];
