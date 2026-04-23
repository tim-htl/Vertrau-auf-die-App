import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "joined_activities_v1";

// Seed: Aktivität "1" gilt als bereits beigetreten, "2" nicht – so lässt sich
// der Teilnehmen-Flow an Aktivität 2 demonstrieren.
const SEED: string[] = ["1"];

export async function ladeJoinedAktivitaeten(): Promise<string[]> {
  const gespeichert = await AsyncStorage.getItem(KEY);
  if (gespeichert) return JSON.parse(gespeichert);
  await AsyncStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
}

export async function istBeigetreten(aktivitaetId: string): Promise<boolean> {
  const liste = await ladeJoinedAktivitaeten();
  return liste.includes(aktivitaetId);
}

export async function joinAktivitaet(aktivitaetId: string): Promise<void> {
  const liste = await ladeJoinedAktivitaeten();
  if (liste.includes(aktivitaetId)) return;
  const neu = [...liste, aktivitaetId];
  await AsyncStorage.setItem(KEY, JSON.stringify(neu));
}
