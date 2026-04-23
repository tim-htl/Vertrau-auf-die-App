import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Teilnehmer } from "./aktivitaeten";

const PROFIL_KEY = "profil_v2";
const CREATOR_ID = "creator_me";

type GespeichertesProfil = {
  name?: string;
  bilder?: (string | null)[];
};

export async function ladeErstellerAlsTeilnehmer(): Promise<Teilnehmer> {
  const roh = await AsyncStorage.getItem(PROFIL_KEY);
  const profil: GespeichertesProfil = roh ? JSON.parse(roh) : {};
  const ersteBild = profil.bilder?.find((b) => typeof b === "string") ?? null;
  return {
    id: CREATOR_ID,
    name: profil.name?.trim() ? profil.name.trim() : "Du",
    bild: ersteBild,
  };
}
