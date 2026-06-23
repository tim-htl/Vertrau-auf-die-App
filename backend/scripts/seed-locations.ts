// Legt die kuratierten Orte für den 1:1-„Treffen vorschlagen"-Flow (zu zweit)
// als echte Location-Rows an. Quelle der Daten: die früheren Frontend-Mock-
// Locations (Vertrau/data/locations.ts), jetzt mit Kategorie versehen.
//
// Ausführen:  cd backend && npx tsx scripts/seed-locations.ts
// Idempotent: bereits angelegte Locations (gleicher Name) werden übersprungen.

import { PrismaClient, type LocationKategorie } from "@prisma/client";

const prisma = new PrismaClient();

type SeedLocation = {
  name: string;
  kategorie: LocationKategorie;
  beschreibung: string;
  bilder: string[];
  adresseStrasse: string;
  adressePlzOrt: string;
  lat: number;
  lng: number;
};

const LOCATIONS: SeedLocation[] = [
  {
    name: "Gamestate",
    kategorie: "ENTERTAINMENT",
    beschreibung:
      "Moderne Spielhalle mit Billard, Bowling, Arcade und Bar – perfekt für einen entspannten Abend zu zweit.",
    bilder: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000",
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1000",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000",
    ],
    adresseStrasse: "Auguststraße 24",
    adressePlzOrt: "10117 Berlin",
    lat: 52.5265,
    lng: 13.3952,
  },
  {
    name: "Mensa",
    kategorie: "UNI",
    beschreibung:
      "Die Uni-Mensa – günstig, zentral und immer ein guter Ort, um sich zwischen den Vorlesungen zu sehen.",
    bilder: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1000",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1000",
    ],
    adresseStrasse: "Hardenbergstraße 34",
    adressePlzOrt: "10623 Berlin",
    lat: 52.5087,
    lng: 13.3278,
  },
  {
    name: "Mauerpark",
    kategorie: "PARK",
    beschreibung:
      "Großer Park im Prenzlauer Berg mit Flohmarkt, Karaoke am Sonntag und viel Platz zum Abhängen.",
    bilder: [
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=1000",
      "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=1000",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1000",
    ],
    adresseStrasse: "Gleimstraße 55",
    adressePlzOrt: "10437 Berlin",
    lat: 52.5417,
    lng: 13.4025,
  },
  {
    name: "Boulderhalle",
    kategorie: "SPORT",
    beschreibung:
      "Kletterhalle mit Routen für Einsteiger bis Fortgeschrittene. Schuhe kann man vor Ort leihen.",
    bilder: [
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1000",
      "https://images.unsplash.com/photo-1516592066400-e77c4eaa4d90?w=1000",
      "https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=1000",
    ],
    adresseStrasse: "Revaler Straße 99",
    adressePlzOrt: "10245 Berlin",
    lat: 52.5079,
    lng: 13.4548,
  },
  {
    name: "Tempelhofer Feld",
    kategorie: "PARK",
    beschreibung:
      "Ehemaliger Flughafen, heute riesige Freifläche – ideal zum Skaten, Picknicken oder einfach Laufen.",
    bilder: [
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=1000",
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1000",
      "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=1000",
    ],
    adresseStrasse: "Tempelhofer Damm",
    adressePlzOrt: "12101 Berlin",
    lat: 52.4756,
    lng: 13.4036,
  },
  {
    name: "Eiscafé am Kanal",
    kategorie: "CAFE",
    beschreibung:
      "Kleines Eiscafé direkt am Landwehrkanal mit wechselnden Sorten und Plätzen am Wasser.",
    bilder: [
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1000",
      "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1000",
      "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1000",
    ],
    adresseStrasse: "Paul-Lincke-Ufer 39",
    adressePlzOrt: "10999 Berlin",
    lat: 52.4961,
    lng: 13.4276,
  },
];

async function main() {
  let angelegt = 0;
  let uebersprungen = 0;

  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
      select: { id: true },
    });
    if (existing) {
      uebersprungen += 1;
      continue;
    }
    await prisma.location.create({
      data: {
        name: loc.name,
        beschreibung: loc.beschreibung,
        kategorie: loc.kategorie,
        bilder: loc.bilder,
        adresseStrasse: loc.adresseStrasse,
        adressePlzOrt: loc.adressePlzOrt,
        koordinatenLat: loc.lat,
        koordinatenLng: loc.lng,
      },
    });
    angelegt += 1;
  }

  console.log(
    `Locations-Seed fertig: ${angelegt} angelegt, ${uebersprungen} übersprungen (gesamt ${LOCATIONS.length}).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
