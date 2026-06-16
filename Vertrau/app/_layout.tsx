import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth-context";

// AuthGate: expo-router rendert nur die Screens, deren Stack.Protected-Guard
// true ist. Da der Account erst am Ende des Onboardings erstellt wird, gilt:
//   - keine Session → Login ODER Onboarding (neuer Nutzer baut Profil auf,
//     der Account entsteht im letzten Onboarding-Schritt)
//   - Session vorhanden → (tabs) + Detail-Screens
// "Session vorhanden" ist damit gleichbedeutend mit "Onboarding fertig" —
// ein separates Flag ist nicht nötig. Beim Account-Erstellen (signUp)
// entsteht die Session und expo-router wechselt automatisch zu den Tabs.
function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
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
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerBackTitle: "Zurück" }} />
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
      <RootNavigator />
    </AuthProvider>
  );
}
