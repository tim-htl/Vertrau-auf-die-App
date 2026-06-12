// Idempotent seed script. Run with `npx prisma db seed`.
//
// Inserts a small reference catalog so the backend has realistic data
// during development. The Wirtschaftsingenieurwesen tree at TU Berlin
// mirrors the demo data in `Vertrau/data/kurse.ts`. Real catalog data
// gets entered via the admin UI in Phase 7.

import { Abschluss, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BereichSeed = {
  slug: string;
  name: string;
  module?: { name: string; ects?: number; code?: string }[];
  kinder?: BereichSeed[];
};

async function seedStudiengangTree(
  studiengangId: string,
  bereiche: BereichSeed[],
  parentId: string | null = null,
  parentPath = ""
): Promise<void> {
  for (const node of bereiche) {
    const path = parentPath ? `${parentPath}/${node.slug}` : node.slug;

    const bereich = await prisma.bereich.upsert({
      where: { studiengangId_path: { studiengangId, path } },
      update: { name: node.name, parentId },
      create: { name: node.name, path, studiengangId, parentId },
    });

    if (node.module) {
      for (const m of node.module) {
        await prisma.modul.upsert({
          where: { bereichId_name: { bereichId: bereich.id, name: m.name } },
          update: { ects: m.ects, code: m.code },
          create: { name: m.name, ects: m.ects, code: m.code, bereichId: bereich.id },
        });
      }
    }

    if (node.kinder?.length) {
      await seedStudiengangTree(studiengangId, node.kinder, bereich.id, path);
    }
  }
}

async function main() {
  // ── Universitäten ─────────────────────────────────────────────────────────
  const tuBerlin = await prisma.universitaet.upsert({
    where: { kuerzel: "TUB" },
    update: { name: "Technische Universität Berlin", emailDomains: ["tu-berlin.de", "campus.tu-berlin.de"] },
    create: {
      name: "Technische Universität Berlin",
      kuerzel: "TUB",
      emailDomains: ["tu-berlin.de", "campus.tu-berlin.de"],
    },
  });

  const lmu = await prisma.universitaet.upsert({
    where: { kuerzel: "LMU" },
    update: { name: "Ludwig-Maximilians-Universität München", emailDomains: ["lmu.de", "campus.lmu.de"] },
    create: {
      name: "Ludwig-Maximilians-Universität München",
      kuerzel: "LMU",
      emailDomains: ["lmu.de", "campus.lmu.de"],
    },
  });

  // ── Studiengang: Wirtschaftsingenieurwesen B.Sc. @ TU Berlin ──────────────
  const wingBsc = await prisma.studiengang.upsert({
    where: {
      uniId_name_abschluss: {
        uniId: tuBerlin.id,
        name: "Wirtschaftsingenieurwesen",
        abschluss: Abschluss.BACHELOR,
      },
    },
    update: {},
    create: {
      uniId: tuBerlin.id,
      name: "Wirtschaftsingenieurwesen",
      abschluss: Abschluss.BACHELOR,
    },
  });

  await seedStudiengangTree(wingBsc.id, [
    {
      slug: "integrationsbereich",
      name: "Integrationsbereich",
      module: [
        { name: "Technisches Projekt", ects: 9 },
        { name: "Wirtschaftswissenschaftliches Projekt", ects: 9 },
        { name: "Integrationsseminar", ects: 6 },
      ],
    },
    {
      slug: "wiwi",
      name: "Wirtschaftswissenschaften",
      kinder: [
        {
          slug: "bwl",
          name: "BWL",
          module: [
            { name: "Marketing", ects: 6 },
            { name: "Unternehmensführung", ects: 6 },
            { name: "Controlling", ects: 6 },
            { name: "Investition & Finanzierung", ects: 6 },
          ],
        },
        {
          slug: "vwl",
          name: "VWL",
          module: [
            { name: "Makroökonomie", ects: 6 },
            { name: "Mikroökonomie II", ects: 6 },
            { name: "Wirtschaftspolitik", ects: 6 },
          ],
        },
        {
          slug: "recht",
          name: "Recht",
          module: [
            { name: "Bürgerliches Recht", ects: 6 },
            { name: "Handelsrecht", ects: 6 },
            { name: "Arbeitsrecht", ects: 6 },
          ],
        },
      ],
    },
    {
      slug: "vertiefung",
      name: "Vertiefungsrichtung",
      kinder: [
        {
          slug: "logistik",
          name: "Logistik",
          module: [
            { name: "Supply Chain Management", ects: 6 },
            { name: "Transportsysteme", ects: 6 },
            { name: "Lagerhaltung", ects: 6 },
          ],
        },
        {
          slug: "produktion",
          name: "Produktionstechnik",
          module: [
            { name: "Fabrikbetrieb", ects: 6 },
            { name: "Fertigungstechnik", ects: 6 },
            { name: "Industrie 4.0", ects: 6 },
          ],
        },
        {
          slug: "energie",
          name: "Energie- und Ressourcenmanagement",
          module: [
            { name: "Nachhaltige Energiesysteme", ects: 6 },
            { name: "Ressourceneffizienz", ects: 6 },
          ],
        },
      ],
    },
  ]);

  // ── Studiengang: Wirtschaftsingenieurwesen M.Sc. @ TU Berlin (Stub) ───────
  // Separater Eintrag laut Entscheidung in Sub-Phase 1b — Bereiche/Module
  // folgen, sobald echte Daten vorliegen.
  await prisma.studiengang.upsert({
    where: {
      uniId_name_abschluss: {
        uniId: tuBerlin.id,
        name: "Wirtschaftsingenieurwesen",
        abschluss: Abschluss.MASTER,
      },
    },
    update: {},
    create: {
      uniId: tuBerlin.id,
      name: "Wirtschaftsingenieurwesen",
      abschluss: Abschluss.MASTER,
    },
  });

  // ── Profil-Fragen-Katalog ──────────────────────────────────────────────────
  // Finale Liste vom 2026-06-12. sortierung in 10er-Schritten, damit später
  // Fragen dazwischengeschoben werden können, ohne alles umzunummerieren.
  const profilFragen = [
    "2 Lügen, eine Wahrheit",
    "Was ist dein Lieblingslied?",
    "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?",
    "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?",
    "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?",
    "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?",
    "Welche Superkraft hättest du gern?",
    "Wenn du eine Zeitreisemaschine hättest, zu welchem Punkt würdest du reisen?",
    "Was ist dein nutzlosestes Talent?",
    "Was ist deine unpopulärste Meinung?",
    "Was ist dein liebster unnützer Fakt?",
    "Was ist das Spontanste, das du je gemacht hast?",
    "Was steht ganz oben auf deiner Bucket List?",
    "Was war dein Kindheits-Berufswunsch?",
    "Wofür könntest du spontan einen einstündigen Vortrag halten — ohne jede Vorbereitung?",
    "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?",
  ];

  for (const [i, text] of profilFragen.entries()) {
    const sortierung = (i + 1) * 10;
    await prisma.profilFrage.upsert({
      where: { text },
      update: { sortierung },
      create: { text, sortierung },
    });
  }

  console.log(`Seed done.`);
  console.log(`  Universitäten: 2 (${tuBerlin.kuerzel}, ${lmu.kuerzel})`);
  console.log(`  Studiengänge:  2 (Wirtschaftsing. B.Sc. + M.Sc. @ TUB)`);
  console.log(`  Profil-Fragen: ${profilFragen.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
