// Legt ein paar öffentliche Demo-Aktivitäten (Gruppentreffen/Lerngruppen) an,
// damit der Treffen-Tab echte Daten zum Anzeigen hat. Admin + Teilnehmer sind
// die Demo-Profile (siehe seed-demo-profile.ts); ein paar Treffen sind an ein
// Modul gekoppelt (= Lerngruppe).
//
// Voraussetzung: seed-demo-profile.ts wurde gelaufen (Demo-Profile existieren).
// Ausführen:  cd backend && npx tsx scripts/seed-demo-aktivitaeten.ts
// Idempotent: bereits angelegte Treffen (gleicher Titel + Admin) werden übersprungen.

import { PrismaClient } from "@prisma/client";
import { supabaseAdmin } from "../src/lib/supabase.js";

const prisma = new PrismaClient();

const TEST_USER_EMAIL = "tim.hiltl0606@gmail.com";
const DEMO_COUNT = 12; // so viele Demo-Profile berücksichtigen wir als Pool

type DemoTreffen = {
  titel: string;
  beschreibung: string;
  bilder: string[];
  adresseStrasse: string;
  adressePlzOrt: string;
  ortKurz: string;
  lat: number;
  lng: number;
  inTagen: number; // Start in N Tagen
  stunde: number;
  dauerMinuten: number;
  maxPlaetze: number;
  adminIdx: number; // Index in den Demo-Profilen
  teilnehmerIdx: number[]; // weitere Demo-Profile als Teilnehmer
  testUserDabei?: boolean; // Test-User als Teilnehmer hinzufügen
  modulName?: string; // optional: koppelt das Treffen an ein Modul (Lerngruppe)
};

const TREFFEN: DemoTreffen[] = [
  {
    titel: "Lerngruppe Algorithmen & Datenstrukturen",
    beschreibung:
      "Wir gehen gemeinsam die Übungsblätter durch und bereiten uns auf die Klausur vor. Bringt eure Fragen mit!",
    bilder: ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"],
    adresseStrasse: "Straße des 17. Juni 135",
    adressePlzOrt: "10623 Berlin",
    ortKurz: "TU Berlin, Mathegebäude",
    lat: 52.5125,
    lng: 13.3269,
    inTagen: 2,
    stunde: 16,
    dauerMinuten: 120,
    maxPlaetze: 8,
    adminIdx: 0,
    teilnehmerIdx: [1, 6],
    testUserDabei: true,
    modulName: "Algorithmen und Datenstrukturen",
  },
  {
    titel: "Beachvolleyball am Tempelhofer Feld",
    beschreibung:
      "Entspanntes Volleyball für alle Level. Wir teilen Teams vor Ort ein und spielen ein paar lockere Runden.",
    bilder: ["https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800"],
    adresseStrasse: "Tempelhofer Damm",
    adressePlzOrt: "12101 Berlin",
    ortKurz: "Tempelhofer Feld",
    lat: 52.473,
    lng: 13.405,
    inTagen: 4,
    stunde: 15,
    dauerMinuten: 150,
    maxPlaetze: 12,
    adminIdx: 1,
    teilnehmerIdx: [2, 3, 7],
  },
  {
    titel: "Mensa-Lunch & Kennenlernen",
    beschreibung:
      "Gemeinsam Mittagessen in der Mensa und neue Leute aus verschiedenen Studiengängen treffen. Einfach dazusetzen!",
    bilder: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"],
    adresseStrasse: "Hardenbergstraße 34",
    adressePlzOrt: "10623 Berlin",
    ortKurz: "Mensa TU Berlin",
    lat: 52.512,
    lng: 13.326,
    inTagen: 1,
    stunde: 12,
    dauerMinuten: 60,
    maxPlaetze: 10,
    adminIdx: 2,
    teilnehmerIdx: [0, 4, 5, 8],
    testUserDabei: true,
  },
  {
    titel: "Lerngruppe Analysis I für Ingenieure",
    beschreibung:
      "Studiengangs-übergreifende Lerngruppe für Analysis I. Wir rechnen alte Klausuren und erklären uns gegenseitig die kniffligen Teile.",
    bilder: ["https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800"],
    adresseStrasse: "Straße des 17. Juni 136",
    adressePlzOrt: "10623 Berlin",
    ortKurz: "TU Berlin, Bibliothek",
    lat: 52.5108,
    lng: 13.3245,
    inTagen: 3,
    stunde: 14,
    dauerMinuten: 90,
    maxPlaetze: 6,
    adminIdx: 5,
    teilnehmerIdx: [9, 10],
    modulName: "Analysis I und Lineare Algebra für Ingenieurwissenschaften",
  },
  {
    titel: "Kaffee & Coding im Café",
    beschreibung:
      "Lockeres Co-Working: jeder arbeitet an seinem Projekt, wir helfen uns gegenseitig und trinken guten Kaffee.",
    bilder: ["https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800"],
    adresseStrasse: "Oranienstraße 6",
    adressePlzOrt: "10997 Berlin",
    ortKurz: "Café in Kreuzberg",
    lat: 52.5028,
    lng: 13.4205,
    inTagen: 6,
    stunde: 10,
    dauerMinuten: 180,
    maxPlaetze: 8,
    adminIdx: 7,
    teilnehmerIdx: [3, 11],
  },
];

async function main() {
  console.log(`Lege ${TREFFEN.length} Demo-Treffen an…`);

  // Auth-User → ids (für Demo-Profile + Test-User).
  const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const idByEmail = new Map(liste.users.map((u) => [u.email ?? "", u.id]));

  const demoIds: string[] = [];
  for (let i = 1; i <= DEMO_COUNT; i++) {
    const id = idByEmail.get(`demo${i}@vertrau.test`);
    if (id) demoIds.push(id);
  }
  if (demoIds.length === 0) {
    console.error("  ✗ Keine Demo-Profile gefunden. Erst seed-demo-profile.ts laufen lassen.");
    return;
  }
  const testUserId = idByEmail.get(TEST_USER_EMAIL) ?? null;

  // Nur existierende Profile zulassen (FK-Sicherheit).
  const vorhandene = new Set(
    (
      await prisma.profile.findMany({
        where: { id: { in: [...demoIds, ...(testUserId ? [testUserId] : [])] } },
        select: { id: true },
      })
    ).map((p) => p.id)
  );

  let angelegt = 0;
  let uebersprungen = 0;

  for (const t of TREFFEN) {
    const adminId = demoIds[t.adminIdx];
    if (!adminId || !vorhandene.has(adminId)) {
      console.error(`  ✗ "${t.titel}": Admin-Profil fehlt — übersprungen.`);
      continue;
    }

    // Idempotenz: gleiches Treffen (Titel + Admin) schon da?
    const existiert = await prisma.aktivitaet.findFirst({
      where: { titel: t.titel, adminId },
      select: { id: true },
    });
    if (existiert) {
      uebersprungen++;
      console.log(`  ↷ "${t.titel}" existiert bereits.`);
      continue;
    }

    let modulId: string | null = null;
    if (t.modulName) {
      const modul = await prisma.modul.findFirst({
        where: { name: t.modulName },
        select: { id: true },
      });
      modulId = modul?.id ?? null;
    }

    // Teilnehmer-Set (Admin immer dabei) — nur existierende Profile.
    const teilnehmerIds = new Set<string>([adminId]);
    for (const idx of t.teilnehmerIdx) {
      const id = demoIds[idx];
      if (id && vorhandene.has(id)) teilnehmerIds.add(id);
    }
    if (t.testUserDabei && testUserId && vorhandene.has(testUserId)) {
      teilnehmerIds.add(testUserId);
    }

    const start = new Date();
    start.setDate(start.getDate() + t.inTagen);
    start.setHours(t.stunde, 0, 0, 0);

    await prisma.$transaction(async (tx) => {
      const aktivitaet = await tx.aktivitaet.create({
        data: {
          titel: t.titel,
          beschreibung: t.beschreibung,
          bilder: t.bilder,
          adresseStrasse: t.adresseStrasse,
          adressePlzOrt: t.adressePlzOrt,
          ortKurz: t.ortKurz,
          koordinatenLat: t.lat,
          koordinatenLng: t.lng,
          startAt: start,
          dauerMinuten: t.dauerMinuten,
          maxPlaetze: t.maxPlaetze,
          sichtbarkeit: "PUBLIC",
          official: false,
          modulId,
          adminId,
        },
      });

      const chat = await tx.chat.create({
        data: { typ: "GROUP", aktivitaetId: aktivitaet.id },
      });

      await tx.aktivitaetTeilnehmer.createMany({
        data: [...teilnehmerIds].map((profileId) => ({
          aktivitaetId: aktivitaet.id,
          profileId,
        })),
      });

      await tx.chatTeilnehmer.createMany({
        data: [...teilnehmerIds].map((profileId) => ({
          chatId: chat.id,
          profileId,
        })),
      });
    });

    angelegt++;
    console.log(
      `  ✓ "${t.titel}" (${teilnehmerIds.size} Teilnehmer${modulId ? ", Lerngruppe" : ""})`
    );
  }

  console.log(`Fertig: ${angelegt} angelegt, ${uebersprungen} übersprungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
