import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    // Die GestureHandlerRootView muss das oberste Element sein, 
    // damit der GestureDetector in den Tabs funktioniert.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ title: "Profil" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        <Stack.Screen name="kurs/[id]" options={{ title: "Kurs Details" }} />
        <Stack.Screen name="modul/[id]" options={{ title: "Modul" }} />
        <Stack.Screen name="aktivitaet/[id]" options={{ title: "Aktivität" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}