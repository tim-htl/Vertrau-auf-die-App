// ─── Datentypen ───────────────────────────────────────────────────────────────

export type Teilnehmer = {
  id: string;
  name: string;
  bild: string | null;
};

export type Aktivitaet = {
  id: string;
  titel: string;
  ort: string;
  beschreibung: string;
  hintergrundbild: string;
  teilnehmer: Teilnehmer[];
};

// ─── Demo-Daten ───────────────────────────────────────────────────────────────

export const DEMO_AKTIVITAETEN: Aktivitaet[] = [
  {
    id: "1",
    titel: "Volleyball am Strand",
    ort: "Strandbad Wannsee, Berlin",
    beschreibung:
      "Entspanntes Beachvolleyball für alle Level. Wir treffen uns direkt am Netz und spielen ein paar lockere Runden. Getränke und Snacks kommen wir danach gemeinsam holen!",
    hintergrundbild:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800",
    teilnehmer: [
      { id: "t1", name: "Anna", bild: null },
      { id: "t2", name: "Ben", bild: null },
      { id: "t3", name: "Clara", bild: null },
    ],
  },
  {
    id: "2",
    titel: "Kaffee & Lerngruppe",
    ort: "Café Latte, Mitte",
    beschreibung:
      "Gemeinsam für die Prüfungsphase lernen – Statistik, BWL, whatever. Jeder bringt seinen Stoff mit, wir helfen uns gegenseitig und bestellen zu viel Kaffee.",
    hintergrundbild:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    teilnehmer: [
      { id: "t4", name: "David", bild: null },
      { id: "t5", name: "Eva", bild: null },
      { id: "t6", name: "Felix", bild: null },
      { id: "t7", name: "Gina", bild: null },
    ],
  },
];
