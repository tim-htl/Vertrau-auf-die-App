import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        // Globaler Frosted-Glass Effekt für alle Unterseiten-Header
        headerTransparent: true,
        headerBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerBackTitle: "Chats" }} />
      <Stack.Screen name="kurs/[id]" options={{ headerBackTitle: "Kurse" }} />
      <Stack.Screen name="bereich/[...path]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="person/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="aktivitaet/[id]" options={{ headerBackTitle: "Zurück" }} />
      <Stack.Screen name="modul/[id]" options={{ headerBackTitle: "Zurück" }} />
    </Stack>
  );
}