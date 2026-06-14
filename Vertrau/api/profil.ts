import { PROFIL_FRAGEN } from "../data/fragen";
import { getHobbies, putMeineHobbies } from "./hobbies";
import { getProfilFragen, putMeineFragen } from "./fragen";
import { getMe, patchMe } from "./me";
import { uploadBild } from "./storage";

// Datenschicht für den Profil-Tab. Kapselt die komplette Übersetzung
// zwischen dem UI-Shape (ProfilData, namens-/textbasiert) und dem Backend
// (id-basiert). Dadurch bleibt profil.tsx fast unverändert.
//
// Das Mapping läuft über Namen (Hobbies) bzw. Texte (Fragen), die in Mock
// (data/*) und DB-Seed identisch sind. So muss die UI keine UUIDs kennen.

const MAX_BILDER = 10;

// UI-Shape, wie es der Profil-Tab nutzt. Hobbies/Module als Namen,
// frageAntworten mit der lokalen data/fragen.ts-id.
export type ProfilData = {
  name: string;
  alter: string;
  studiengang: string; // read-only (aus dem Onboarding)
  uni: string; // read-only
  bilder: (string | null)[];
  bio: string;
  hobbies: string[]; // Namen
  module: string[]; // Namen, read-only (Bearbeitung im Kurse-Tab)
  frageAntworten: { frageId: string; antwort: string }[];
};

// GET /me → ProfilData. Mappt id-basierte Backend-Daten auf Namen/lokale ids.
export async function ladeMeinProfil(): Promise<ProfilData> {
  const me = await getMe();

  const bilder: (string | null)[] = [...me.bilder];
  while (bilder.length < MAX_BILDER) bilder.push(null);

  return {
    name: me.name,
    alter: me.alter != null ? String(me.alter) : "",
    studiengang: me.studiengang?.name ?? "",
    uni: me.uni?.name ?? "",
    bilder,
    bio: me.kurzbeschreibung ?? "",
    hobbies: me.hobbies.map((h) => h.name),
    module: me.module.map((m) => m.name),
    frageAntworten: me.frageAntworten.map((fa) => ({
      // DB-Text → lokale data/fragen.ts-id (für die Auswahl-UI); Fallback
      // auf die DB-id, falls eine Frage nicht im Mock-Katalog steht.
      frageId: PROFIL_FRAGEN.find((f) => f.text === fa.text)?.id ?? fa.frageId,
      antwort: fa.antwort,
    })),
  };
}

// ProfilData → Backend. Lädt zuerst lokale Bilder hoch, speichert dann
// Basis-Profil + Hobbies + Fragen. Module bleiben unberührt (read-only).
export async function speichereMeinProfil(data: ProfilData): Promise<void> {
  // 1. Bilder: file://-URIs hochladen, bereits hochgeladene (http) behalten.
  const hochgeladen = await Promise.all(
    data.bilder.map((b) => {
      if (!b) return Promise.resolve(null);
      if (b.startsWith("http")) return Promise.resolve(b);
      return uploadBild(b, "avatars");
    })
  );
  const bilder = hochgeladen.filter((b): b is string => !!b);

  // 2. Basis-Profil (name/alter/studiengang sind read-only → nicht senden).
  await patchMe({ kurzbeschreibung: data.bio.trim() || null, bilder });

  // 3. Hobbies: Namen → DB-ids.
  const hobbyKatalog = await getHobbies();
  const nameToId = new Map(hobbyKatalog.map((h) => [h.name, h.id]));
  const hobbyIds = data.hobbies
    .map((n) => nameToId.get(n))
    .filter((id): id is string => !!id);
  await putMeineHobbies(hobbyIds);

  // 4. Fragen: lokale id → Text → DB-id; leere Antworten raus.
  const frageKatalog = await getProfilFragen();
  const textToId = new Map(frageKatalog.map((f) => [f.text, f.id]));
  const antworten = data.frageAntworten
    .map((fa) => {
      const text = PROFIL_FRAGEN.find((f) => f.id === fa.frageId)?.text;
      const dbId = text ? textToId.get(text) : undefined;
      return dbId && fa.antwort.trim().length > 0
        ? { frageId: dbId, antwort: fa.antwort.trim() }
        : null;
    })
    .filter((a): a is { frageId: string; antwort: string } => !!a);
  await putMeineFragen(antworten);
}
