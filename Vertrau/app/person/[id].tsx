import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements"; // FIX: Header Höhe importiert
import { PersonenKarte } from "../(tabs)/personen";
import { DEMO_PERSONEN } from "../../data/personen";

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight(); // FIX: Dynamische Header Höhe nutzen

  const person = DEMO_PERSONEN.find((p) => p.id === id);

  const karteHoehe = height - headerHeight - insets.bottom;

  if (!person) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Profil" }} />
        <Text style={styles.leerText}>Profil nicht gefunden.</Text>
      </View>
    );
  }

  return (
    // FIX: paddingTop hinzugefügt, damit das Profil unter dem Header startet
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <Stack.Screen options={{ title: person.name }} />
      <PersonenKarte person={person} breite={width} hoehe={karteHoehe} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  leerText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});