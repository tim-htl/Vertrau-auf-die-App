// ─── Typen ────────────────────────────────────────────────────────────────────

import { type FrageAntwort } from "./fragen";

export type Person = {
  id: string;
  name: string;
  alter: number;
  bilder: (string | null)[]; // mehrere Bilder für den Fotostreifen
  kurzbeschreibung: string;
  hobbies: string[];
  module: string[];
  // Optional: Module mit id (für klickbare Kurse → Teilnehmer-Übersicht).
  // Setzt der Backend-Mapper; die Mock-Daten lassen es weg.
  moduleItems?: { id: string; name: string }[];
  uni: string;
  studiengang: string;
  // Antworten auf Profil-Fragen (max. 5, Reihenfolge = Anzeige-Reihenfolge).
  // Nur in der ausführlichen Profilansicht sichtbar, nicht in der Karte.
  frageAntworten: FrageAntwort[];
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
    hobbies: ["Live-Musik", "Lesen", "Yoga", "Filme"],
    module: ["Statistik II", "Mikroökonomie", "BWL-Grundlagen"],
    uni: "LMU München",
    studiengang: "Wirtschaftswissenschaften",
    frageAntworten: [
      { frageId: "f02", antwort: "Bohemian Rhapsody — und ja, ich singe alle Stimmen mit." },
      { frageId: "f16", antwort: "Ich putze plötzlich sehr gründlich die ganze WG. Meine Mitbewohner lieben Klausurenphasen." },
      { frageId: "f07", antwort: "Teleportation. Nie wieder 40 Minuten U-Bahn zur Uni." },
    ],
  },
  {
    id: "2",
    name: "Luca Bauer",
    alter: 24,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Sportbegeistert und immer hungrig – auf Wissen und Pizza. Suche Leute für gemeinsames Lernen und Freizeit.",
    hobbies: ["Fußball", "Fitness", "Videospiele", "Kochen"],
    module: ["Algorithmen", "Datenbanken", "Softwaretechnik"],
    uni: "TU München",
    studiengang: "Informatik",
    frageAntworten: [
      { frageId: "f05", antwort: "Pommes in Vanilleeis dippen. Erst probieren, dann urteilen!" },
      { frageId: "f01", antwort: "Ich war mal Bayern-Fan. Ich habe einen Halbmarathon gelaufen. Ich kann jonglieren." },
      { frageId: "f09", antwort: "Ich kann das Intro von ~30 Animes in unter 3 Sekunden erkennen." },
      { frageId: "f13", antwort: "Einmal im Stadion bei einem Champions-League-Finale sein." },
    ],
  },
  {
    id: "3",
    name: "Mia Hoffmann",
    alter: 21,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Kreativkopf mit zu vielen Ideen und zu wenig Zeit. Liebe es, neue Menschen kennenzulernen und Projekte zu starten.",
    hobbies: ["Kunst", "Fotografie", "Pflanzen", "Kaffee"],
    module: ["Designtheorie", "UX Research", "Typografie"],
    uni: "HfG Ulm",
    studiengang: "Kommunikationsdesign",
    frageAntworten: [
      { frageId: "f04", antwort: "Studio Ghibli, ganz klar. Ich will in Chihiros Badehaus arbeiten." },
      { frageId: "f12", antwort: "Mit einer Freundin spontan ein Wochenende nach Lissabon — gebucht um 23 Uhr, Flug um 6." },
    ],
  },
  {
    id: "4",
    name: "Jonas Kern",
    alter: 23,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Zahlenmensch tagsüber, Hobbyastronom nachts. Glaube, dass man alles mit genug Kaffee und Optimismus schaffen kann.",
    hobbies: ["Schach", "Radsport", "Musik hören", "Technologie"],
    module: ["Analysis III", "Lineare Algebra", "Numerik"],
    uni: "Uni Heidelberg",
    studiengang: "Mathematik",
    frageAntworten: [
      { frageId: "f11", antwort: "Ein Tag auf der Venus dauert länger als ihr Jahr. Bitte sehr." },
      { frageId: "f08", antwort: "1969, Apollo 11. Ich will die Mondlandung live im Kontrollzentrum erleben." },
      { frageId: "f10", antwort: "Kaffee schmeckt schwarz am besten. Hafermilch ist ein Verbrechen an der Bohne." },
    ],
  },
  {
    id: "5",
    name: "Lena Fischer",
    alter: 22,
    bilder: [null, null, null, null, null],
    kurzbeschreibung:
      "Weltverbessererin in Ausbildung. Interessiert an allem, was mit Nachhaltigkeit und Menschen zu tun hat.",
    hobbies: ["Reisen", "Podcasts", "Wandern", "Nachhaltigkeit"], // alle im Katalog
    module: ["Umweltrecht", "Soziologie", "Politikwissenschaft"],
    uni: "Uni Freiburg",
    studiengang: "Umweltwissenschaften",
    frageAntworten: [
      { frageId: "f06", antwort: "Patagonien. Weite, Berge, niemand der drängelt — perfekt zum Kopf-Auslüften." },
      { frageId: "f14", antwort: "Tierärztin. Dann kam die erste Spritze und ich bin umgekippt." },
      { frageId: "f15", antwort: "Warum Pfandsysteme genial sind. Ungelogen, ich habe Quellen." },
      { frageId: "f03", antwort: "Jane Goodall — ich will wissen, wie man 60 Jahre lang Hoffnung behält." },
    ],
  },
];
