// Legt ~20 künstliche Demo-Profile an, damit Personen-Tab/Swipe/Match/Chat
// echte Daten haben. Jedes Profil braucht einen echten Supabase-Auth-User
// (profiles.id → auth.users), daher die Admin-API.
//
// Ausführen:  cd backend && npx tsx scripts/seed-demo-profile.ts
// Idempotent: erneuter Lauf aktualisiert bestehende Demo-Profile.
//
// Die ersten RUECK_LIKER_ANZAHL Profile liken den TEST_USER (per E-Mail) —
// swipest du sie nach rechts, entsteht sofort ein Match + 1:1-Chat.

import { PrismaClient } from "@prisma/client";
import { supabaseAdmin } from "../src/lib/supabase.js";

const prisma = new PrismaClient();

// TU Berlin – Wirtschaftsingenieurwesen B.Sc. (einziger Studiengang mit
// Modulen im Seed; mehr Studiengänge folgen in Priorität 3).
const STUDIENGANG_ID = "624afab0-ecd2-4f24-9fdc-2ae247237305";
const DEMO_PASSWORT = "demo-vertrau-2026";
const TEST_USER_EMAIL = "tim.hiltl0606@gmail.com";
const RUECK_LIKER_ANZAHL = 4;

type DemoProfil = {
  name: string;
  alter: number;
  bio: string;
  img: number; // pravatar.cc-Bildnummer (1–70)
  hobbies: string[]; // Katalog-Namen
  fragen: { text: string; antwort: string }[]; // Katalog-Fragetexte
  module: string[]; // Modul-Namen
};

const DEMO: DemoProfil[] = [
  { name: "Sophie Wagner", alter: 22, img: 1, bio: "Kaffee-Enthusiastin & Nachteule. Lerne am liebsten in Gruppen.", hobbies: ["Lesen", "Yoga", "Kaffee", "Filme"], fragen: [{ text: "Was ist dein Lieblingslied?", antwort: "Bohemian Rhapsody — und ja, ich singe alle Stimmen mit." }, { text: "Welche Superkraft hättest du gern?", antwort: "Teleportation. Nie wieder U-Bahn zur Uni." }], module: ["Finanzwirtschaft", "Statistik I", "Marketing"] },
  { name: "Luca Bauer", alter: 24, img: 12, bio: "Sportbegeistert und immer hungrig – auf Wissen und Pizza.", hobbies: ["Fußball", "Fitness", "Videospiele", "Kochen"], fragen: [{ text: "Was ist dein nutzlosestes Talent?", antwort: "Ich erkenne fast jedes Lied an den ersten 2 Sekunden." }], module: ["Operations Research", "Technische Mechanik II", "Mikroökonomie"] },
  { name: "Mia Hoffmann", alter: 21, img: 5, bio: "Kreativkopf mit zu vielen Ideen und zu wenig Zeit.", hobbies: ["Kunst", "Fotografie", "Kaffee", "Mode"], fragen: [{ text: "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?", antwort: "Studio Ghibli, ganz klar." }, { text: "Was ist das Spontanste, das du je gemacht hast?", antwort: "Wochenend-Trip nach Lissabon, gebucht um 23 Uhr." }], module: ["Marketing", "Controlling"] },
  { name: "Jonas Kern", alter: 23, img: 13, bio: "Zahlenmensch tagsüber, Hobbyastronom nachts.", hobbies: ["Schach", "Radsport", "Musik hören"], fragen: [{ text: "Was ist dein liebster unnützer Fakt?", antwort: "Ein Tag auf der Venus dauert länger als ihr Jahr." }, { text: "Was ist deine unpopulärste Meinung?", antwort: "Kaffee schmeckt schwarz am besten." }], module: ["Investition & Finanzierung", "Makroökonomie", "Statistik I"] },
  { name: "Lena Fischer", alter: 22, img: 9, bio: "Weltverbessererin in Ausbildung. Nachhaltigkeit & Menschen.", hobbies: ["Reisen", "Wandern", "Live-Musik"], fragen: [{ text: "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?", antwort: "Patagonien. Weite, Berge, Kopf-Auslüften." }, { text: "Was war dein Kindheits-Berufswunsch?", antwort: "Tierärztin. Dann kam die erste Spritze." }], module: ["Wirtschaftspolitik", "Bürgerliches Recht"] },
  { name: "Paul Schmidt", alter: 25, img: 14, bio: "WiIng im Endspurt. Suche Lernpartner für Operations Research.", hobbies: ["Klettern", "Brettspiele", "Kochen"], fragen: [{ text: "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?", antwort: "Ich optimiere mein Notion-Setup. Zum dritten Mal." }], module: ["Operations Research", "Supply Chain Management", "Industrie 4.0"] },
  { name: "Emma Richter", alter: 20, img: 16, bio: "Ersti-Energie. Immer für einen Kaffee in der Mensa zu haben.", hobbies: ["Tanzen", "Fotografie", "Reisen", "Filme"], fragen: [{ text: "Welche Superkraft hättest du gern?", antwort: "Schlaf auf Knopfdruck nachholen." }, { text: "Was ist dein Lieblingslied?", antwort: "Wechselt wöchentlich, aktuell was von Fred again.." }], module: ["Finanzwirtschaft", "Mikroökonomie"] },
  { name: "Ben Müller", alter: 23, img: 18, bio: "Bastler & Tüftler. Wenn's klemmt, baue ich's selbst.", hobbies: ["Videospiele", "Radsport", "Schwimmen"], fragen: [{ text: "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?", antwort: "Richard Feynman — der hätte sicher gute Lern-Hacks." }], module: ["Technische Mechanik II", "Fertigungstechnik", "Fabrikbetrieb"] },
  { name: "Clara Lang", alter: 21, img: 20, bio: "Buchclub-Gründerin & Pflanzenmama. Statistik ist meine Nemesis.", hobbies: ["Lesen", "Gärtnern", "Kaffee", "Yoga"], fragen: [{ text: "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?", antwort: "Apfel mit Erdnussbutter UND Käse." }], module: ["Statistik I", "Controlling"] },
  { name: "David Wolf", alter: 26, img: 33, bio: "Master-Stud & Werkstudent. Effizienz ist meine Liebessprache.", hobbies: ["Fitness", "Kochen", "Schach"], fragen: [{ text: "Was ist dein nutzlosestes Talent?", antwort: "Ich kann den Inhalt jeder Tupperdose blind erraten." }, { text: "Was steht ganz oben auf deiner Bucket List?", antwort: "Einmal die Nordlichter sehen." }], module: ["Investition & Finanzierung", "Operations Research", "Makroökonomie"] },
  { name: "Hannah Krüger", alter: 22, img: 24, bio: "Festival-Liebhaberin & Spontan-Reisende.", hobbies: ["Live-Musik", "Reisen", "Tanzen", "Nachtleben"], fragen: [{ text: "Was ist das Spontanste, das du je gemacht hast?", antwort: "Interrail-Ticket gekauft und 3 Wochen verschwunden." }], module: ["Marketing", "Wirtschaftspolitik"] },
  { name: "Felix Braun", alter: 24, img: 51, bio: "Brettspiel-Nerd mit Faible für Wahrscheinlichkeiten.", hobbies: ["Brettspiele", "Videospiele", "Klettern"], fragen: [{ text: "Was ist dein liebster unnützer Fakt?", antwort: "Honig verdirbt nie. 3000 Jahre alter ist noch essbar." }, { text: "Was ist deine unpopulärste Meinung?", antwort: "Mensa-Essen ist unterschätzt." }], module: ["Statistik I", "Operations Research", "Mikroökonomie"] },
  { name: "Marie Schulz", alter: 21, img: 26, bio: "Skizzenbuch immer dabei. Suche Cafés mit gutem Licht.", hobbies: ["Kunst", "Kaffee", "Fotografie", "Filme"], fragen: [{ text: "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?", antwort: "Das von Wes Anderson — alles symmetrisch und pastellfarben." }], module: ["Marketing", "Bürgerliches Recht"] },
  { name: "Tom Becker", alter: 25, img: 53, bio: "Logistik-Vertiefung. Plane Wege schneller als Google Maps.", hobbies: ["Radsport", "Wandern", "Kochen"], fragen: [{ text: "Was war dein Kindheits-Berufswunsch?", antwort: "Lokführer. Bin jetzt bei Supply Chains gelandet, fast." }], module: ["Supply Chain Management", "Transportsysteme", "Lagerhaltung"] },
  { name: "Laura Hofmann", alter: 23, img: 44, bio: "Yoga am Morgen, Tabellen am Nachmittag.", hobbies: ["Yoga", "Lesen", "Schwimmen", "Reisen"], fragen: [{ text: "Welche Superkraft hättest du gern?", antwort: "Pflanzen zum Wachsen bringen — meine sterben sonst alle." }, { text: "Was ist dein Lieblingslied?", antwort: "Alles von Bon Iver bei Regen." }], module: ["Controlling", "Finanzwirtschaft"] },
  { name: "Niklas Vogel", alter: 24, img: 59, bio: "Energie- & Ressourcen-Fan. Diskutiere gern über Nachhaltigkeit.", hobbies: ["Klettern", "Radsport", "Live-Musik"], fragen: [{ text: "Was ist deine unpopulärste Meinung?", antwort: "Tabs sind besser als Spaces. Kämpft mich." }], module: ["Industrie 4.0", "Fabrikbetrieb"] },
  { name: "Anna Peters", alter: 20, img: 45, bio: "Erstsemester mit großen Plänen und vielen Karteikarten.", hobbies: ["Lesen", "Tanzen", "Kaffee"], fragen: [{ text: "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?", antwort: "Ich räume die ganze WG auf. Mitbewohner lieben Klausuren." }], module: ["Mikroökonomie", "Statistik I"] },
  { name: "Jan Albrecht", alter: 27, img: 60, bio: "Quereinsteiger, zweites Studium. Frage viel, lerne schnell.", hobbies: ["Fotografie", "Wandern", "Schach", "Kaffee"], fragen: [{ text: "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?", antwort: "Japan im Herbst, wegen des Ahorns und des Ramen." }], module: ["Makroökonomie", "Investition & Finanzierung", "Wirtschaftspolitik"] },
  { name: "Pia Neumann", alter: 22, img: 47, bio: "Chaotisch-organisiert. Bringe immer Snacks zur Lerngruppe.", hobbies: ["Kochen", "Filme", "Yoga", "Reisen"], fragen: [{ text: "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?", antwort: "Pommes ins Vanilleeis. Probier's, dann urteile." }, { text: "Was ist dein nutzlosestes Talent?", antwort: "Ich kann mit den Ohren wackeln. Beidseitig." }], module: ["Marketing", "Controlling", "Finanzwirtschaft"] },
  { name: "Simon Frank", alter: 23, img: 65, bio: "Produktionstechnik & Kaffee. Optimiere alles, auch meinen Schlaf.", hobbies: ["Fitness", "Videospiele", "Brettspiele"], fragen: [{ text: "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?", antwort: "Elon vor 2015. Für die Mars-Pläne, nicht für Twitter." }], module: ["Fertigungstechnik", "Fabrikbetrieb", "Industrie 4.0"] },
];

async function main() {
  console.log(`Lege ${DEMO.length} Demo-Profile an…`);

  // Kataloge laden (Namen/Texte → ids)
  const hobbies = await prisma.hobby.findMany({ select: { id: true, name: true } });
  const hobbyByName = new Map(hobbies.map((h) => [h.name, h.id]));
  const fragen = await prisma.profilFrage.findMany({ select: { id: true, text: true } });
  const frageByText = new Map(fragen.map((f) => [f.text, f.id]));
  const module = await prisma.modul.findMany({
    where: { bereich: { studiengangId: STUDIENGANG_ID } },
    select: { id: true, name: true },
  });
  const modulByName = new Map(module.map((m) => [m.name, m.id]));

  // bestehende Auth-User einmal laden (für Idempotenz)
  const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const authByEmail = new Map(liste.users.map((u) => [u.email ?? "", u.id]));

  const demoIds: string[] = [];

  for (const [i, d] of DEMO.entries()) {
    const email = `demo${i + 1}@vertrau.test`;

    // 1. Auth-User (anlegen oder bestehende id holen)
    let userId = authByEmail.get(email);
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORT,
        email_confirm: true,
      });
      if (error || !data.user) {
        console.error(`  ✗ ${email}: ${error?.message ?? "kein User"}`);
        continue;
      }
      userId = data.user.id;
    }

    // 2. Profil-Record
    const now = new Date();
    const geburtsdatum = new Date(now.getFullYear() - d.alter, now.getMonth(), now.getDate());
    const bilder = [`https://i.pravatar.cc/400?img=${d.img}`];
    await prisma.profile.upsert({
      where: { id: userId },
      update: { name: d.name, geburtsdatum, kurzbeschreibung: d.bio, bilder, studiengangId: STUDIENGANG_ID },
      create: { id: userId, name: d.name, geburtsdatum, kurzbeschreibung: d.bio, bilder, studiengangId: STUDIENGANG_ID },
    });

    // 3. Hobbies / Fragen / Module (komplett ersetzen)
    const hobbyIds = d.hobbies.map((n) => hobbyByName.get(n)).filter((x): x is string => !!x);
    const modulIds = d.module.map((n) => modulByName.get(n)).filter((x): x is string => !!x);
    const antwortRows = d.fragen
      .map((f, pos) => {
        const frageId = frageByText.get(f.text);
        return frageId ? { profileId: userId!, frageId, antwort: f.antwort, position: pos } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    await prisma.$transaction([
      prisma.userHobby.deleteMany({ where: { profileId: userId } }),
      prisma.userHobby.createMany({ data: hobbyIds.map((hobbyId) => ({ profileId: userId!, hobbyId })) }),
      prisma.profilFrageAntwort.deleteMany({ where: { profileId: userId } }),
      prisma.profilFrageAntwort.createMany({ data: antwortRows }),
      prisma.userModul.deleteMany({ where: { profileId: userId } }),
      prisma.userModul.createMany({ data: modulIds.map((modulId) => ({ profileId: userId!, modulId })) }),
    ]);

    demoIds.push(userId);
    console.log(`  ✓ ${d.name} (${email})`);
  }

  // 4. Rück-Likes: erste N Demo-Profile liken den Test-User
  const testUserId = authByEmail.get(TEST_USER_EMAIL);
  if (testUserId) {
    const liker = demoIds.slice(0, RUECK_LIKER_ANZAHL);
    for (const likerId of liker) {
      await prisma.like.upsert({
        where: { likerId_likedId: { likerId, likedId: testUserId } },
        update: { kind: "LIKED" },
        create: { likerId, likedId: testUserId, kind: "LIKED" },
      });
    }
    console.log(`  ♥ ${liker.length} Demo-Profile liken ${TEST_USER_EMAIL} (→ Match beim Zurückswipen)`);
  } else {
    console.log(`  ⚠ Test-User ${TEST_USER_EMAIL} nicht gefunden — keine Rück-Likes gesetzt.`);
  }

  console.log(`Fertig: ${demoIds.length} Demo-Profile.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
