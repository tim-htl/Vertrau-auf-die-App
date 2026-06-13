import AsyncStorage from "@react-native-async-storage/async-storage";

// Onboarding-Status. Mock-first: liegt lokal in AsyncStorage. Später leitet
// das Backend dies aus dem Profil ab (z. B. name + studiengang gesetzt) —
// dann nur diese drei Funktionen auf die api/-Schicht umstellen, der Rest
// der App bleibt unverändert.

const KEY = "onboarding_done_v1";

export async function istOnboardingAbgeschlossen(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "true";
}

export async function markiereOnboardingAbgeschlossen(): Promise<void> {
  await AsyncStorage.setItem(KEY, "true");
}

// Nur für Tests/Demo: Onboarding erneut durchlaufen lassen.
export async function setzeOnboardingZurueck(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
