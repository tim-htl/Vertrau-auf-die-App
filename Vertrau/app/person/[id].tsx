import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonenKarte } from "../(tabs)/personen";
import { DEMO_PERSONEN } from "../../data/personen";

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const person = DEMO_PERSONEN.find((p) => p.id === id);

  const karteHoehe = height - insets.top - insets.bottom - 44; // 44 ≈ Header

  if (!person) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Profil" }} />
        <Text style={styles.leerText}>Profil nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
