import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth-context";

// AuthGate: expo-router rendert nur die Screens, deren Stack.Protected-Guard
// true ist. Ohne Session existieren die Tab-Routen gar nicht (Navigation
// dorthin unmöglich), mit Session verschwinden die Auth-Screens — expo-router
// leitet beim Guard-Wechsel automatisch auf die erste verfügbare Route um.
function RootNavigator() {
  const { session, loading } = useAuth();

  // Session wird noch aus dem SecureStore geladen → Spinner statt kurzem
  // Aufblitzen des Login-Screens.
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
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
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
      <RootNavigator />
    </AuthProvider>
  );
}
