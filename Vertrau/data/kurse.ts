// ─── Typen ────────────────────────────────────────────────────────────────────
//
// Die Struktur ist so aufgebaut, dass sie später 1:1 aus einer Datenbank /
// einem Backend befüllt werden kann. Alle IDs sind Strings, Felder die
// optional sind (z.B. Bild, Unterbereiche) können bei fehlenden Daten
// weggelassen werden.
//

export type Teilnehmer = {
  id: string;
  name: string;
  bild: string | null; // null → Platzhalter (Apple-Kontakt-Stil)
};

export type Modul = {
  id: string;
  name: string;
  ects?: number;
  semester?: number;
  teilnehmer?: Teilnehmer[]; // bei "Meine Kurse" relevant
};

// Rekursive Struktur: ein Bereich kann wiederum Unterbereiche ODER Module
// als Blätter enthalten.
export type Bereich = {
  id: string;
  name: string;
  bereiche?: Bereich[];
  module?: Modul[];
};

export type Studiengang = {
  name: string;
  uni: string;
  uniLogo: string | null; // Logo-URL oder null (dann Initialen-Platzhalter)
  meineKurse: Modul[];
  moduldatenbank: Bereich[];
};

// ─── Helfer: Bereich anhand eines Pfads finden ────────────────────────────────

export function findeBereich(
  wurzel: Bereich[],
  pfad: string[]
): { bereich: Bereich | null; pfadNamen: string[] } {
  const pfadNamen: string[] = [];
  let aktuell: Bereich | null = null;
  let liste = wurzel;

  for (const id of pfad) {
    const gefunden = liste.find((b) => b.id === id);
    if (!gefunden) return { bereich: null, pfadNamen };
    aktuell = gefunden;
    pfadNamen.push(gefunden.name);
    liste = gefunden.bereiche ?? [];
  }

  return { bereich: aktuell, pfadNamen };
}

// ─── Demo-Teilnehmer (wiederverwendet) ────────────────────────────────────────

const DEMO_TEILNEHMER: Teilnehmer[] = [
  { id: "t1", name: "Sophie Wagner", bild: null },
  { id: "t2", name: "Luca Bauer", bild: null },
  { id: "t3", name: "Mia Hoffmann", bild: null },
  { id: "t4", name: "Jonas Kern", bild: null },
  { id: "t5", name: "Lena Fischer", bild: null },
  { id: "t6", name: "Paul Schmidt", bild: null },
  { id: "t7", name: "Anna Richter", bild: null },
  { id: "t8", name: "Ben Müller", bild: null },
];

// ─── Demo-Daten: Wirtschaftsingenieurwesen TU Berlin ─────────────────────────

export const DEMO_STUDIENGANG: Studiengang = {
  name: "Wirtschaftsingenieurwesen",
  uni: "TU Berlin",
  uniLogo: null,

  meineKurse: [
    { id: "k1", name: "Finanzwirtschaft",        ects: 6, semester: 3, teilnehmer: DEMO_TEILNEHMER.slice(0, 5) },
    { id: "k2", name: "Technische Mechanik II",  ects: 6, semester: 3, teilnehmer: DEMO_TEILNEHMER.slice(1, 6) },
    { id: "k3", name: "Statistik I",             ects: 6, semester: 3, teilnehmer: DEMO_TEILNEHMER.slice(2, 8) },
    { id: "k4", name: "Mikroökonomie",           ects: 6, semester: 3, teilnehmer: DEMO_TEILNEHMER.slice(0, 4) },
    { id: "k5", name: "Operations Research",     ects: 6, semester: 3, teilnehmer: DEMO_TEILNEHMER.slice(3, 8) },
  ],

  moduldatenbank: [
    {
      id: "integrationsbereich",
      name: "Integrationsbereich",
      module: [
        { id: "ib1", name: "Technisches Projekt",            ects: 9 },
        { id: "ib2", name: "Wirtschaftswissenschaftliches Projekt", ects: 9 },
        { id: "ib3", name: "Integrationsseminar",            ects: 6 },
      ],
    },
    {
      id: "wiwi",
      name: "Wirtschaftswissenschaften",
      bereiche: [
        {
          id: "bwl",
          name: "BWL",
          module: [
            { id: "bwl1", name: "Marketing",               ects: 6 },
            { id: "bwl2", name: "Unternehmensführung",     ects: 6 },
            { id: "bwl3", name: "Controlling",             ects: 6 },
            { id: "bwl4", name: "Investition & Finanzierung", ects: 6 },
          ],
        },
        {
          id: "vwl",
          name: "VWL",
          module: [
            { id: "vwl1", name: "Makroökonomie",            ects: 6 },
            { id: "vwl2", name: "Mikroökonomie II",         ects: 6 },
            { id: "vwl3", name: "Wirtschaftspolitik",       ects: 6 },
          ],
        },
        {
          id: "recht",
          name: "Recht",
          module: [
            { id: "r1", name: "Bürgerliches Recht",   ects: 6 },
            { id: "r2", name: "Handelsrecht",         ects: 6 },
            { id: "r3", name: "Arbeitsrecht",         ects: 6 },
          ],
        },
      ],
    },
    {
      id: "vertiefung",
      name: "Vertiefungsrichtung",
      bereiche: [
        {
          id: "logistik",
          name: "Logistik",
          module: [
            { id: "log1", name: "Supply Chain Management", ects: 6 },
            { id: "log2", name: "Transportsysteme",         ects: 6 },
            { id: "log3", name: "Lagerhaltung",             ects: 6 },
          ],
        },
        {
          id: "produktion",
          name: "Produktionstechnik",
          module: [
            { id: "p1", name: "Fabrikbetrieb",          ects: 6 },
            { id: "p2", name: "Fertigungstechnik",      ects: 6 },
            { id: "p3", name: "Industrie 4.0",          ects: 6 },
          ],
        },
        {
          id: "energie",
          name: "Energie- und Ressourcenmanagement",
          module: [
            { id: "e1", name: "Nachhaltige Energiesysteme", ects: 6 },
            { id: "e2", name: "Ressourceneffizienz",         ects: 6 },
          ],
        },
      ],
    },
  ],
};
