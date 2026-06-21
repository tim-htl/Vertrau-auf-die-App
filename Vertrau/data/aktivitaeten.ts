// ─── Datentypen ───────────────────────────────────────────────────────────────

export type Teilnehmer = {
  id: string;
  name: string;
  bild: string | null;
};

export type Sichtbarkeit = "public" | "private";

export type Aktivitaet = {
  id: string;
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
  datum: string; // vom erstellenden User festgelegt, z.B. "28/04/2026"
  uhrzeit: string; // z.B. "16:00"
  maxPlaetze: number;
  teilnehmer: Teilnehmer[];
  // "public" = jeder kann beitreten (Standard). "private" = nur Eingeladene.
  // Optional aus Backward-Compat-Gründen mit DEMO_AKTIVITAETEN.
  sichtbarkeit?: Sichtbarkeit;
  // Profile-id des Admins (vom Backend gesetzt) — für "bin ich Admin?".
  adminId?: string;
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
    bilder: [
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1000",
      "https://images.unsplash.com/photo-1592656094267-5ab2fa1da3b5?w=1000",
      "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=1000",
    ],
    adresse: { strasse: "Wannseebadweg 25", plzOrt: "14129 Berlin" },
    koordinaten: { latitude: 52.4357, longitude: 13.1737 },
    datum: "28/04/2026",
    uhrzeit: "16:00",
    maxPlaetze: 8,
    teilnehmer: [
      {
        id: "t1",
        name: "Anna",
        bild: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      },
      {
        id: "t2",
        name: "Ben",
        bild: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      },
      {
        id: "t3",
        name: "Clara",
        bild: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
      },
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
    bilder: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1000",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1000",
    ],
    adresse: { strasse: "Torstraße 142", plzOrt: "10119 Berlin" },
    koordinaten: { latitude: 52.5294, longitude: 13.4017 },
    datum: "26/04/2026",
    uhrzeit: "15:00",
    maxPlaetze: 6,
    teilnehmer: [
      {
        id: "t4",
        name: "David",
        bild: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
      },
      {
        id: "t5",
        name: "Eva",
        bild: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      },
      {
        id: "t6",
        name: "Felix",
        bild: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
      },
      {
        id: "t7",
        name: "Gina",
        bild: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200",
      },
    ],
  },
];
