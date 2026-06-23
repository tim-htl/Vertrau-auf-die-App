import { apiFetch } from "../lib/api";
import type {
  GetProfilFragenResponse,
  ProfilFrageKatalogEintrag,
  PutFragenResponse,
} from "../types/api";

// Profil-Fragen-Katalog + die Antworten des eingeloggten Users.

export async function getProfilFragen(): Promise<ProfilFrageKatalogEintrag[]> {
  const res = await apiFetch<GetProfilFragenResponse>("/profil-fragen", { auth: false });
  return res.fragen;
}

// Ersetzt die kompletten Frage-Antworten (PUT-Semantik). Reihenfolge im
// Array = Anzeige-Reihenfolge. Backend erzwingt max. 5 + max. 200 Zeichen.
export async function putMeineFragen(
  antworten: { frageId: string; antwort: string }[]
): Promise<PutFragenResponse["antworten"]> {
  const res = await apiFetch<PutFragenResponse>("/me/fragen", {
    method: "PUT",
    body: { antworten },
  });
  return res.antworten;
}
