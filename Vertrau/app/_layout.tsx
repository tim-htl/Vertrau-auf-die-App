import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerBackTitle: "Chats" }} />
      <Stack.Screen name="kurs/[id]" options={{ headerBackTitle: "Kurse" }} />
      <Stack.Screen name="bereich/[...path]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="person/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="aktivitaet/[id]" options={{ headerBackTitle: "Zurück" }} />
    </Stack>
  );
}
