import type { Profile } from "@prisma/client";

// Frontend kennt nur "alter" als Eingabe und Anzeige; intern speichern wir
// geburtsdatum als Date, damit das Alter über die Jahre automatisch
// fortschreitet, ohne dass User es neu setzen müssen.

// Wandelt das vom Frontend gesendete Alter in ein synthetisches Geburtsdatum
// um: heute minus N Jahre. Beim nächsten Jahrestag erhöht sich das berechnete
// Alter automatisch um 1.
export function alterToGeburtsdatum(alter: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - alter, now.getMonth(), now.getDate());
}

// Berechnet das aktuelle Alter aus dem gespeicherten Geburtsdatum.
// Gibt null zurück, wenn kein Geburtsdatum gesetzt ist.
export function alterFromGeburtsdatum(geburtsdatum: Date | null): number | null {
  if (!geburtsdatum) return null;
  const now = new Date();
  let age = now.getFullYear() - geburtsdatum.getFullYear();
  const monthDiff = now.getMonth() - geburtsdatum.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < geburtsdatum.getDate())) {
    age--;
  }
  return age;
}

// Profil-Form, wie sie an den Client geht: geburtsdatum bleibt im internen
// Modell, aber die API exponiert nur alter.
export type ProfileForClient = Omit<Profile, "geburtsdatum"> & {
  alter: number | null;
};

export function formatProfileForClient(profile: Profile): ProfileForClient {
  const { geburtsdatum, ...rest } = profile;
  return { ...rest, alter: alterFromGeburtsdatum(geburtsdatum) };
}
