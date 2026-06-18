// Legt ~20 künstliche Demo-Profile an, damit Personen-Tab/Swipe/Match/Chat
// echte Daten haben. Jedes Profil braucht einen echten Supabase-Auth-User
// (profiles.id → auth.users), daher die Admin-API.
//
// Ausführen:  cd backend && npx tsx scripts/seed-demo-profile.ts
// Idempotent: erneuter Lauf aktualisiert bestehende Demo-Profile.
//
// Die ersten RUECK_LIKER_ANZAHL Profile liken den TEST_USER (per E-Mail) —
// swipest du sie nach rechts, entsteht sofort ein Match + 1:1-Chat.

import { Abschluss, PrismaClient } from "@prisma/client";
import { supabaseAdmin } from "../src/lib/supabase.js";

const prisma = new PrismaClient();

// Demo-Profile sind über fünf TU-Berlin-Studiengänge gestreut, die sich
// Grundlagen-Module teilen (v. a. "Analysis I und Lineare Algebra für
// Ingenieurwissenschaften"). Dadurch sitzen Studierende verschiedener
// Studiengänge im selben Modul — genau das Verhalten, das die neue
// studiengang_module-M:N-Tabelle ermöglicht ("wer belegt diesen Kurs auch").
const PROGRAMME = {
  INF: { name: "Informatik", abschluss: Abschluss.BACHELOR },
  ET: { name: "Elektrotechnik", abschluss: Abschluss.BACHELOR },
  MB: { name: "Maschinenbau", abschluss: Abschluss.BACHELOR },
  BAU: { name: "Bauingenieurwesen", abschluss: Abschluss.BACHELOR },
  WING: { name: "Wirtschaftsingenieurwesen", abschluss: Abschluss.BACHELOR },
} as const;

const DEMO_PASSWORT = "demo-vertrau-2026";
const TEST_USER_EMAIL = "tim.hiltl0606@gmail.com";
const RUECK_LIKER_ANZAHL = 4;

type DemoProfil = {
  name: string;
  alter: number;
  bio: string;
  img: number; // pravatar.cc-Bildnummer (1–70)
  sg: keyof typeof PROGRAMME; // Studiengang-Kürzel (siehe PROGRAMME)
  hobbies: string[]; // Katalog-Namen
  fragen: { text: string; antwort: string }[]; // Katalog-Fragetexte
  module: string[]; // echte Moses-Modulnamen (müssen im Studiengang vorkommen)
};

// Geteilte Grundlagen-Module (Magnete), die mehrere Studiengänge anbieten:
const ANALYSIS1 = "Analysis I und Lineare Algebra für Ingenieurwissenschaften"; // INF/ET/MB/BAU/WING
const ANALYSIS2 = "Analysis II für Ingenieurwissenschaften"; // INF/ET/MB/BAU/WING

const DEMO: DemoProfil[] = [
  { name: "Sophie Wagner", alter: 22, img: 1, sg: "INF", bio: "Kaffee-Enthusiastin & Nachteule. Lerne am liebsten in Gruppen.", hobbies: ["Lesen", "Yoga", "Kaffee", "Filme"], fragen: [{ text: "Was ist dein Lieblingslied?", antwort: "Bohemian Rhapsody — und ja, ich singe alle Stimmen mit." }, { text: "Welche Superkraft hättest du gern?", antwort: "Teleportation. Nie wieder U-Bahn zur Uni." }], module: [ANALYSIS1, "Einführung in die Programmierung", "Diskrete Strukturen"] },
  { name: "Luca Bauer", alter: 24, img: 12, sg: "MB", bio: "Sportbegeistert und immer hungrig – auf Wissen und Pizza.", hobbies: ["Fußball", "Fitness", "Videospiele", "Kochen"], fragen: [{ text: "Was ist dein nutzlosestes Talent?", antwort: "Ich erkenne fast jedes Lied an den ersten 2 Sekunden." }], module: [ANALYSIS1, "Konstruktionslehre 1", "Statik und elementare Festigkeitslehre"] },
  { name: "Mia Hoffmann", alter: 21, img: 5, sg: "BAU", bio: "Kreativkopf mit zu vielen Ideen und zu wenig Zeit.", hobbies: ["Kunst", "Fotografie", "Kaffee", "Mode"], fragen: [{ text: "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?", antwort: "Studio Ghibli, ganz klar." }, { text: "Was ist das Spontanste, das du je gemacht hast?", antwort: "Wochenend-Trip nach Lissabon, gebucht um 23 Uhr." }], module: [ANALYSIS1, "Building Information Modeling: Grundlagen und ausgewählte Beispiele", "Grundlagen der Bauinformatik"] },
  { name: "Jonas Kern", alter: 23, img: 13, sg: "BAU", bio: "Zahlenmensch tagsüber, Hobbyastronom nachts.", hobbies: ["Schach", "Radsport", "Musik hören"], fragen: [{ text: "Was ist dein liebster unnützer Fakt?", antwort: "Ein Tag auf der Venus dauert länger als ihr Jahr." }, { text: "Was ist deine unpopulärste Meinung?", antwort: "Kaffee schmeckt schwarz am besten." }], module: [ANALYSIS2, "Baustatik II", "Statik und elementare Festigkeitslehre"] },
  { name: "Lena Fischer", alter: 22, img: 9, sg: "WING", bio: "Weltverbessererin in Ausbildung. Nachhaltigkeit & Menschen.", hobbies: ["Reisen", "Wandern", "Live-Musik"], fragen: [{ text: "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?", antwort: "Patagonien. Weite, Berge, Kopf-Auslüften." }, { text: "Was war dein Kindheits-Berufswunsch?", antwort: "Tierärztin. Dann kam die erste Spritze." }], module: [ANALYSIS1, "Operations Research - Grundlagen (OR-GDL)", "Statistik I für Wirtschaftswissenschaften"] },
  { name: "Paul Schmidt", alter: 25, img: 14, sg: "WING", bio: "WiIng im Endspurt. Suche Lernpartner für Operations Research.", hobbies: ["Klettern", "Brettspiele", "Kochen"], fragen: [{ text: "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?", antwort: "Ich optimiere mein Notion-Setup. Zum dritten Mal." }], module: ["Operations Research - Grundlagen (OR-GDL)", "Statistik II für Wirtschaftswissenschaften", "Differentialgleichungen für Ingenieure"] },
  { name: "Emma Richter", alter: 20, img: 16, sg: "INF", bio: "Ersti-Energie. Immer für einen Kaffee in der Mensa zu haben.", hobbies: ["Tanzen", "Fotografie", "Reisen", "Filme"], fragen: [{ text: "Welche Superkraft hättest du gern?", antwort: "Schlaf auf Knopfdruck nachholen." }, { text: "Was ist dein Lieblingslied?", antwort: "Wechselt wöchentlich, aktuell was von Fred again.." }], module: [ANALYSIS1, "Informatik Propädeutikum", "Algorithmen und Datenstrukturen"] },
  { name: "Ben Müller", alter: 23, img: 18, sg: "ET", bio: "Bastler & Tüftler. Wenn's klemmt, baue ich's selbst.", hobbies: ["Videospiele", "Radsport", "Schwimmen"], fragen: [{ text: "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?", antwort: "Richard Feynman — der hätte sicher gute Lern-Hacks." }], module: [ANALYSIS1, "Halbleiterbauelemente", "Entwurf eingebetteter Systeme"] },
  { name: "Clara Lang", alter: 21, img: 20, sg: "WING", bio: "Buchclub-Gründerin & Pflanzenmama. Statistik ist meine Nemesis.", hobbies: ["Lesen", "Gärtnern", "Kaffee", "Yoga"], fragen: [{ text: "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?", antwort: "Apfel mit Erdnussbutter UND Käse." }], module: ["Statistik I für Wirtschaftswissenschaften", ANALYSIS2, "Operations Research - Grundlagen (OR-GDL)"] },
  { name: "David Wolf", alter: 26, img: 33, sg: "BAU", bio: "Werkstudent im Ingenieurbüro. Effizienz ist meine Liebessprache.", hobbies: ["Fitness", "Kochen", "Schach"], fragen: [{ text: "Was ist dein nutzlosestes Talent?", antwort: "Ich kann den Inhalt jeder Tupperdose blind erraten." }, { text: "Was steht ganz oben auf deiner Bucket List?", antwort: "Einmal die Nordlichter sehen." }], module: [ANALYSIS2, "Baustatik II", "Grundlagen der Baustoffprüfung"] },
  { name: "Hannah Krüger", alter: 22, img: 24, sg: "INF", bio: "Festival-Liebhaberin & Spontan-Reisende.", hobbies: ["Live-Musik", "Reisen", "Tanzen", "Nachtleben"], fragen: [{ text: "Was ist das Spontanste, das du je gemacht hast?", antwort: "Interrail-Ticket gekauft und 3 Wochen verschwunden." }], module: [ANALYSIS1, "Formal-mathematische Grundlagen", "Einführung in die Programmierung"] },
  { name: "Felix Braun", alter: 24, img: 51, sg: "ET", bio: "Brettspiel-Nerd mit Faible für Wahrscheinlichkeiten.", hobbies: ["Brettspiele", "Videospiele", "Klettern"], fragen: [{ text: "Was ist dein liebster unnützer Fakt?", antwort: "Honig verdirbt nie. 3000 Jahre alter ist noch essbar." }, { text: "Was ist deine unpopulärste Meinung?", antwort: "Mensa-Essen ist unterschätzt." }], module: [ANALYSIS2, "Entwurf eingebetteter Systeme", "Kommunikationsnetze"] },
  { name: "Marie Schulz", alter: 21, img: 26, sg: "MB", bio: "Skizzenbuch immer dabei. Suche Cafés mit gutem Licht.", hobbies: ["Kunst", "Kaffee", "Fotografie", "Filme"], fragen: [{ text: "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?", antwort: "Das von Wes Anderson — alles symmetrisch und pastellfarben." }], module: [ANALYSIS1, "Darstellung technischer Systeme", "Konstruktionslehre 1"] },
  { name: "Tom Becker", alter: 25, img: 53, sg: "WING", bio: "Logistik-Vertiefung. Plane Wege schneller als Google Maps.", hobbies: ["Radsport", "Wandern", "Kochen"], fragen: [{ text: "Was war dein Kindheits-Berufswunsch?", antwort: "Lokführer. Bin jetzt bei Supply Chains gelandet, fast." }], module: ["Operations Research - Grundlagen (OR-GDL)", "Kinematik und Dynamik", "Statistik I für Wirtschaftswissenschaften"] },
  { name: "Laura Hofmann", alter: 23, img: 44, sg: "BAU", bio: "Yoga am Morgen, Tabellen am Nachmittag.", hobbies: ["Yoga", "Lesen", "Schwimmen", "Reisen"], fragen: [{ text: "Welche Superkraft hättest du gern?", antwort: "Pflanzen zum Wachsen bringen — meine sterben sonst alle." }, { text: "Was ist dein Lieblingslied?", antwort: "Alles von Bon Iver bei Regen." }], module: [ANALYSIS1, "Grundlagen der Bauinformatik", "Baustatik II"] },
  { name: "Niklas Vogel", alter: 24, img: 59, sg: "ET", bio: "Energie- & Ressourcen-Fan. Diskutiere gern über Nachhaltigkeit.", hobbies: ["Klettern", "Radsport", "Live-Musik"], fragen: [{ text: "Was ist deine unpopulärste Meinung?", antwort: "Tabs sind besser als Spaces. Kämpft mich." }], module: [ANALYSIS1, "Physik für Elektrotechnik", "Halbleiterbauelemente"] },
  { name: "Anna Peters", alter: 20, img: 45, sg: "INF", bio: "Erstsemester mit großen Plänen und vielen Karteikarten.", hobbies: ["Lesen", "Tanzen", "Kaffee"], fragen: [{ text: "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?", antwort: "Ich räume die ganze WG auf. Mitbewohner lieben Klausuren." }], module: [ANALYSIS1, "Informatik und Gesellschaft", "Diskrete Strukturen"] },
  { name: "Jan Albrecht", alter: 27, img: 60, sg: "ET", bio: "Quereinsteiger, zweites Studium. Frage viel, lerne schnell.", hobbies: ["Fotografie", "Wandern", "Schach", "Kaffee"], fragen: [{ text: "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?", antwort: "Japan im Herbst, wegen des Ahorns und des Ramen." }], module: [ANALYSIS1, "Analysis III für Ingenieure", "Kommunikationsnetze"] },
  { name: "Pia Neumann", alter: 22, img: 47, sg: "MB", bio: "Chaotisch-organisiert. Bringe immer Snacks zur Lerngruppe.", hobbies: ["Kochen", "Filme", "Yoga", "Reisen"], fragen: [{ text: "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?", antwort: "Pommes ins Vanilleeis. Probier's, dann urteile." }, { text: "Was ist dein nutzlosestes Talent?", antwort: "Ich kann mit den Ohren wackeln. Beidseitig." }], module: [ANALYSIS1, "Werkstoffkunde (WK)", "Konstruktionslehre 2"] },
  { name: "Simon Frank", alter: 23, img: 65, sg: "MB", bio: "Produktionstechnik & Kaffee. Optimiere alles, auch meinen Schlaf.", hobbies: ["Fitness", "Videospiele", "Brettspiele"], fragen: [{ text: "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?", antwort: "Elon vor 2015. Für die Mars-Pläne, nicht für Twitter." }], module: ["Kinematik und Dynamik", "Einführung in das Maschinenwesen", "Werkstoffkunde (WK)"] },
];

async function main() {
  console.log(`Lege ${DEMO.length} Demo-Profile an…`);

  // Kataloge laden (Namen/Texte → ids)
  const hobbies = await prisma.hobby.findMany({ select: { id: true, name: true } });
  const hobbyByName = new Map(hobbies.map((h) => [h.name, h.id]));
  const fragen = await prisma.profilFrage.findMany({ select: { id: true, text: true } });
  const frageByText = new Map(fragen.map((f) => [f.text, f.id]));
  const studiengaenge = await prisma.studiengang.findMany({
    select: { id: true, name: true, abschluss: true },
  });
  const studiengangIdByKey = new Map(
    studiengaenge.map((s) => [`${s.name}|${s.abschluss}`, s.id])
  );
  // Module global laden (Namen sind über die Moses-Modulnummer eindeutig).
  const module = await prisma.modul.findMany({ select: { id: true, name: true } });
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

    // 2. Profil-Record (Studiengang je Profil)
    const prog = PROGRAMME[d.sg];
    const studiengangId = studiengangIdByKey.get(`${prog.name}|${prog.abschluss}`);
    if (!studiengangId) {
      console.error(`  ✗ ${d.name}: Studiengang ${prog.name} nicht gefunden — lief 'prisma db seed'?`);
      continue;
    }
    const now = new Date();
    const geburtsdatum = new Date(now.getFullYear() - d.alter, now.getMonth(), now.getDate());
    const bilder = [`https://i.pravatar.cc/400?img=${d.img}`];
    await prisma.profile.upsert({
      where: { id: userId },
      update: { name: d.name, geburtsdatum, kurzbeschreibung: d.bio, bilder, studiengangId },
      create: { id: userId, name: d.name, geburtsdatum, kurzbeschreibung: d.bio, bilder, studiengangId },
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
    console.log(`  ✓ ${d.name} (${email}) · ${prog.name} · ${modulIds.length} Module`);
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
