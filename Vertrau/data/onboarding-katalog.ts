import { alleModule, DEMO_STUDIENGANG } from "./kurse";

// Mock-Katalog für den Onboarding-Wizard: Uni → Studiengang → Module.
// Flache Listen (keine Bereichs-Hierarchie nötig, das Onboarding wählt
// nur Modul-Namen). Spiegelt die spätere API-Form (getUnis →
// getStudiengaenge(uniId) → Modulliste), damit der Tausch auf echtes
// Backend in 4c/4d nur die Datenquelle betrifft, nicht den Wizard-Code.

export type KatalogUni = {
  id: string;
  name: string;
};

export type KatalogStudiengang = {
  id: string;
  name: string;
  module: string[]; // Modul-Namen für den Autofill-Schritt
};

// Module der TU-Berlin-Demo aus kurse.ts wiederverwenden (dedupliziert).
const WING_MODULE = [...new Set(alleModule(DEMO_STUDIENGANG.moduldatenbank).map((m) => m.name))];

export const KATALOG_UNIS: KatalogUni[] = [
  { id: "tub", name: "Technische Universität Berlin" },
  { id: "fub", name: "Freie Universität Berlin" },
  { id: "hub", name: "Humboldt-Universität zu Berlin" },
];

// Studiengänge je Uni. Nur diese werden im Schritt nach der Uni-Wahl
// angeboten (Autofill gefiltert auf die gewählte Uni).
export const KATALOG_STUDIENGAENGE: Record<string, KatalogStudiengang[]> = {
  tub: [
    { id: "tub-wing-bsc", name: "Wirtschaftsingenieurwesen (B.Sc.)", module: WING_MODULE },
    {
      id: "tub-wing-msc",
      name: "Wirtschaftsingenieurwesen (M.Sc.)",
      module: ["Strategisches Management", "Advanced Operations Research", "Energiewirtschaft", "Technologiemanagement"],
    },
    {
      id: "tub-inf-bsc",
      name: "Informatik (B.Sc.)",
      module: ["Analysis I", "Lineare Algebra", "Algorithmen und Datenstrukturen", "Rechnerorganisation", "Softwaretechnik", "Datenbanksysteme"],
    },
  ],
  fub: [
    {
      id: "fub-bwl-bsc",
      name: "Betriebswirtschaftslehre (B.Sc.)",
      module: ["Grundlagen der BWL", "Buchführung", "Marketing", "Investition und Finanzierung", "Statistik"],
    },
    {
      id: "fub-psy-bsc",
      name: "Psychologie (B.Sc.)",
      module: ["Allgemeine Psychologie", "Statistik I", "Sozialpsychologie", "Biopsychologie", "Methodenlehre"],
    },
  ],
  hub: [
    {
      id: "hub-jura",
      name: "Rechtswissenschaft (Staatsexamen)",
      module: ["BGB Allgemeiner Teil", "Strafrecht I", "Staatsrecht", "Schuldrecht", "Verwaltungsrecht"],
    },
    {
      id: "hub-bio-bsc",
      name: "Biologie (B.Sc.)",
      module: ["Zellbiologie", "Genetik", "Ökologie", "Biochemie", "Mikrobiologie"],
    },
  ],
};

export function studiengaengeFuerUni(uniId: string): KatalogStudiengang[] {
  return KATALOG_STUDIENGAENGE[uniId] ?? [];
}

export function modulnamenFuerStudiengang(uniId: string, studiengangId: string): string[] {
  return studiengaengeFuerUni(uniId).find((s) => s.id === studiengangId)?.module ?? [];
}
