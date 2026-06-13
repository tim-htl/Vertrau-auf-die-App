import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { OnboardingProvider, useOnboarding } from "../lib/onboarding-context";

// AuthGate + OnboardingGate: expo-router rendert nur die Screens, deren
// Stack.Protected-Guard true ist. Drei sich gegenseitig ausschließende
// Zustände:
//   - keine Session                      → (auth) Login/Register
//   - Session, Onboarding offen          → onboarding-Wizard
//   - Session, Onboarding abgeschlossen  → (tabs) + Detail-Screens
// Beim Wechsel eines Guards (Login, Onboarding-Abschluss) leitet
// expo-router automatisch auf die erste verfügbare Route um.
function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { onboardingDone, loading: onboardingLoading } = useOnboarding();

  // Solange Session ODER Onboarding-Flag noch laden → Spinner statt
  // kurzem Aufblitzen des falschen Bereichs.
  if (authLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !onboardingDone}>
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!session && onboardingDone}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerBackTitle: "Chats" }} />
        <Stack.Screen name="kurs/[id]" options={{ headerBackTitle: "Kurse" }} />
        <Stack.Screen name="bereich/[...path]" options={{ headerBackTitle: "Zurück" }} />
        <Stack.Screen name="person/[id]" options={{ headerBackTitle: "Zurück" }} />
        <Stack.Screen name="aktivitaet/[id]" options={{ headerBackTitle: "Zurück" }} />
        <Stack.Screen name="aktivitaet/neu" options={{ headerBackTitle: "Zurück", presentation: "modal" }} />
        <Stack.Screen name="modul/[id]" options={{ headerBackTitle: "Zurück" }} />
        <Stack.Screen name="treffen-vorschlagen" options={{ headerBackTitle: "Zurück" }} />
        <Stack.Screen name="location/[id]" options={{ headerBackTitle: "Zurück" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}
