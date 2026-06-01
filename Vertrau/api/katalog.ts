import { apiFetch } from "../lib/api";
import type {
  GetUnisResponse,
  GetStudiengaengeResponse,
  GetModuldatenbankResponse,
  GetModulResponse,
  Universitaet,
  Studiengang,
  ModulDetail,
} from "../types/api";

// Katalog-Endpoints sind öffentlich — auch ohne Session abrufbar. Wir
// schicken trotzdem den Bearer-Token mit (Default-Verhalten), das macht
// dem Backend nichts aus.

export async function getUnis(): Promise<Universitaet[]> {
  const res = await apiFetch<GetUnisResponse>("/unis", { auth: false });
  return res.universitaeten;
}

export async function getStudiengaenge(uniId: string): Promise<Studiengang[]> {
  const res = await apiFetch<GetStudiengaengeResponse>(
    `/unis/${uniId}/studiengaenge`,
    { auth: false }
  );
  return res.studiengaenge;
}

export async function getModuldatenbank(studiengangId: string) {
  return apiFetch<GetModuldatenbankResponse>(
    `/studiengang/${studiengangId}/moduldatenbank`,
    { auth: false }
  );
}

export async function getModul(modulId: string): Promise<ModulDetail> {
  const res = await apiFetch<GetModulResponse>(`/modul/${modulId}`, { auth: false });
  return res.modul;
}
