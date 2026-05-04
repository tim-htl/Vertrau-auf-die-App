// ─── Datentypen ───────────────────────────────────────────────────────────────

export type Location = {
  id: string;
  name: string;
  coverbild: string;
  bilder: string[];
  beschreibung: string;
  adresse: {
    strasse: string;
    plzOrt: string;
  };
  kartenBild: string;
};

// Gemeinsames „Kartenbild" – Platzhalter für den späteren echten Kartenausschnitt.
const DEMO_KARTE =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200";

// ─── Demo-Daten (später aus Datenbank) ────────────────────────────────────────

export const DEMO_LOCATIONS: Location[] = [
  {
    id: "loc1",
    name: "Gamestate",
    coverbild:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000",
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1000",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000",
    ],
    beschreibung:
      "Moderne Spielhalle mit Billard, Bowling, Arcade und Bar – perfekt für einen entspannten Abend zu zweit.",
    adresse: { strasse: "Auguststraße 24", plzOrt: "10117 Berlin" },
    kartenBild: DEMO_KARTE,
  },
  {
    id: "loc2",
    name: "Mensa",
    coverbild:
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1000",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1000",
    ],
    beschreibung:
      "Die Uni-Mensa – günstig, zentral und immer ein guter Ort, um sich zwischen den Vorlesungen zu sehen.",
    adresse: { strasse: "Hardenbergstraße 34", plzOrt: "10623 Berlin" },
    kartenBild: DEMO_KARTE,
  },
  {
    id: "loc3",
    name: "Mauerpark",
    coverbild:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=1000",
      "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=1000",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1000",
    ],
    beschreibung:
      "Großer Park im Prenzlauer Berg mit Flohmarkt, Karaoke am Sonntag und viel Platz zum Abhängen.",
    adresse: { strasse: "Gleimstraße 55", plzOrt: "10437 Berlin" },
    kartenBild: DEMO_KARTE,
  },
  {
    id: "loc4",
    name: "Boulderhalle",
    coverbild:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1000",
      "https://images.unsplash.com/photo-1516592066400-e77c4eaa4d90?w=1000",
      "https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=1000",
    ],
    beschreibung:
      "Kletterhalle mit Routen für Einsteiger bis Fortgeschrittene. Schuhe kann man vor Ort leihen.",
    adresse: { strasse: "Revaler Straße 99", plzOrt: "10245 Berlin" },
    kartenBild: DEMO_KARTE,
  },
  {
    id: "loc5",
    name: "Tempelhofer Feld",
    coverbild:
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=1000",
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1000",
      "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=1000",
    ],
    beschreibung:
      "Ehemaliger Flughafen, heute riesige Freifläche – ideal zum Skaten, Picknicken oder einfach Laufen.",
    adresse: { strasse: "Tempelhofer Damm", plzOrt: "12101 Berlin" },
    kartenBild: DEMO_KARTE,
  },
  {
    id: "loc6",
    name: "Eiscafé am Kanal",
    coverbild:
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400",
    bilder: [
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1000",
      "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1000",
      "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1000",
    ],
    beschreibung:
      "Kleines Eiscafé direkt am Landwehrkanal mit wechselnden Sorten und Plätzen am Wasser.",
    adresse: { strasse: "Paul-Lincke-Ufer 39", plzOrt: "10999 Berlin" },
    kartenBild: DEMO_KARTE,
  },
];
