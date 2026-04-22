// ─── Datentypen ───────────────────────────────────────────────────────────────

export type Location = {
  id: string;
  name: string;
  coverbild: string;
};

// ─── Demo-Daten (später aus Datenbank) ────────────────────────────────────────

export const DEMO_LOCATIONS: Location[] = [
  {
    id: "loc1",
    name: "Gamestate",
    coverbild:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
  },
  {
    id: "loc2",
    name: "Mensa",
    coverbild:
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400",
  },
  {
    id: "loc3",
    name: "Mauerpark",
    coverbild:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400",
  },
  {
    id: "loc4",
    name: "Boulderhalle",
    coverbild:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400",
  },
  {
    id: "loc5",
    name: "Tempelhofer Feld",
    coverbild:
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400",
  },
  {
    id: "loc6",
    name: "Eiscafé am Kanal",
    coverbild:
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400",
  },
];
