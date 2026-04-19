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
  personId?: string;   // ID in DEMO_PERSONEN, falls Profil verknüpft
};

export type Modul = {
  id: string;
  name: string;
  ects?: number;
  semester?: number;
  teilnehmer?: Teilnehmer[];
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

// ─── Helfer: Modul anhand seiner ID im gesamten Baum finden ─────────────────

export function findeModul(bereiche: Bereich[], modulId: string): Modul | null {
  for (const bereich of bereiche) {
    if (bereich.module) {
      const gefunden = bereich.module.find((m) => m.id === modulId);
      if (gefunden) return gefunden;
    }
    if (bereich.bereiche) {
      const gefunden = findeModul(bereich.bereiche, modulId);
      if (gefunden) return gefunden;
    }
  }
  return null;
}

// ─── Demo-Teilnehmer (wiederverwendet) ────────────────────────────────────────

const DEMO_TEILNEHMER: Teilnehmer[] = [
  { id: "t1", name: "Sophie Wagner", bild: null, personId: "1" },
  { id: "t2", name: "Luca Bauer",    bild: null, personId: "2" },
  { id: "t3", name: "Mia Hoffmann",  bild: null, personId: "3" },
  { id: "t4", name: "Jonas Kern",    bild: null, personId: "4" },
  { id: "t5", name: "Lena Fischer",  bild: null, personId: "5" },
  { id: "t6", name: "Paul Schmidt",  bild: null },
  { id: "t7", name: "Anna Richter",  bild: null },
  { id: "t8", name: "Ben Müller",    bild: null },
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
        { id: "ib1", name: "Technisches Projekt",                    ects: 9, teilnehmer: DEMO_TEILNEHMER.slice(0, 4) },
        { id: "ib2", name: "Wirtschaftswissenschaftliches Projekt",  ects: 9, teilnehmer: DEMO_TEILNEHMER.slice(2, 6) },
        { id: "ib3", name: "Integrationsseminar",                    ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(4, 8) },
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
            { id: "bwl1", name: "Marketing",                  ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 3) },
            { id: "bwl2", name: "Unternehmensführung",        ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(1, 5) },
            { id: "bwl3", name: "Controlling",                ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(3, 7) },
            { id: "bwl4", name: "Investition & Finanzierung", ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(2, 6) },
          ],
        },
        {
          id: "vwl",
          name: "VWL",
          module: [
            { id: "vwl1", name: "Makroökonomie",      ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 4) },
            { id: "vwl2", name: "Mikroökonomie II",   ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(1, 6) },
            { id: "vwl3", name: "Wirtschaftspolitik", ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(3, 8) },
          ],
        },
        {
          id: "recht",
          name: "Recht",
          module: [
            { id: "r1", name: "Bürgerliches Recht", ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 3) },
            { id: "r2", name: "Handelsrecht",        ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(2, 5) },
            { id: "r3", name: "Arbeitsrecht",        ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(4, 8) },
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
            { id: "log1", name: "Supply Chain Management", ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 5) },
            { id: "log2", name: "Transportsysteme",         ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(1, 4) },
            { id: "log3", name: "Lagerhaltung",             ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(3, 7) },
          ],
        },
        {
          id: "produktion",
          name: "Produktionstechnik",
          module: [
            { id: "p1", name: "Fabrikbetrieb",     ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 4) },
            { id: "p2", name: "Fertigungstechnik",  ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(2, 6) },
            { id: "p3", name: "Industrie 4.0",      ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(4, 8) },
          ],
        },
        {
          id: "energie",
          name: "Energie- und Ressourcenmanagement",
          module: [
            { id: "e1", name: "Nachhaltige Energiesysteme", ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(0, 3) },
            { id: "e2", name: "Ressourceneffizienz",         ects: 6, teilnehmer: DEMO_TEILNEHMER.slice(3, 7) },
          ],
        },
      ],
    },
  ],
};
