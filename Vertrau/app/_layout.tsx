import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Onboarding-Wizard zum Gestalten (Mock, ohne Auth). Erreichbar über
          den Button oben links im Profil-Tab. */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerBackTitle: "Chats" }} />
      <Stack.Screen name="kurs/[id]" options={{ headerBackTitle: "Kurse" }} />
      <Stack.Screen name="bereich/[...path]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="person/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="aktivitaet/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="aktivitaet/neu" options={{ headerBackTitle: "Zurück", presentation: "modal" }} />
      <Stack.Screen name="modul/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="treffen-vorschlagen" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="location/[id]" options={{ headerBackTitle: "Zurück" }} />
    </Stack>
  );
}
