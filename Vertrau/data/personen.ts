// ─── Typen ────────────────────────────────────────────────────────────────────

export type Person = {
  id: string;
  name: string;
  alter: number;
  bilder: (string | null)[]; // mehrere Bilder für den Fotostreifen
  kurzbeschreibung: string;
  hobbies: string[];
  module: string[];
  uni: string;
  studiengang: string;
};

// ─── Demo-Daten ───────────────────────────────────────────────────────────────

export const DEMO_PERSONEN: Person[] = [
  {
    id: "1",
    name: "Sophie Wagner",
    alter: 22,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Kaffee-Enthusiastin & Nachteule. Ich lerne am liebsten in Gruppen und bin immer für spontane Unternehmungen zu haben.",
    hobbies: ["Gitarre", "Lesen", "Yoga", "Filme"],
    module: ["Statistik II", "Mikroökonomie", "BWL-Grundlagen"],
    uni: "LMU München",
    studiengang: "Wirtschaftswissenschaften",
  },
  {
    id: "2",
    name: "Luca Bauer",
    alter: 24,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Sportbegeistert und immer hungrig – auf Wissen und Pizza. Suche Leute für gemeinsames Lernen und Freizeit.",
    hobbies: ["Fußball", "Gym", "Gaming", "Kochen"],
    module: ["Algorithmen", "Datenbanken", "Softwaretechnik"],
    uni: "TU München",
    studiengang: "Informatik",
  },
  {
    id: "3",
    name: "Mia Hoffmann",
    alter: 21,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Kreativkopf mit zu vielen Ideen und zu wenig Zeit. Liebe es, neue Menschen kennenzulernen und Projekte zu starten.",
    hobbies: ["Zeichnen", "Fotografie", "Pflanzen", "Cafés"],
    module: ["Designtheorie", "UX Research", "Typografie"],
    uni: "HfG Ulm",
    studiengang: "Kommunikationsdesign",
  },
  {
    id: "4",
    name: "Jonas Kern",
    alter: 23,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Zahlenmensch tagsüber, Hobbyastronom nachts. Glaube, dass man alles mit genug Kaffee und Optimismus schaffen kann.",
    hobbies: ["Astronomie", "Schach", "Radfahren", "Musik"],
    module: ["Analysis III", "Lineare Algebra", "Numerik"],
    uni: "Uni Heidelberg",
    studiengang: "Mathematik",
  },
  {
    id: "5",
    name: "Lena Fischer",
    alter: 22,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Weltverbessererin in Ausbildung. Interessiert an allem, was mit Nachhaltigkeit und Menschen zu tun hat.",
    hobbies: ["Reisen", "Podcasts", "Wandern", "Nachhaltigkeit"],
    module: ["Umweltrecht", "Soziologie", "Politikwissenschaft"],
    uni: "Uni Freiburg",
    studiengang: "Umweltwissenschaften",
  },
];
