import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ProfilAusfuehrlich } from "../../components/ProfilAusfuehrlich";
import { DEMO_PERSONEN } from "../../data/personen";

// Ausführliche Profilansicht (AP) fremder Profile. Erreichbar durch
// Antippen der kurzen Profilansicht (Karte im Personen-Tab etc.).

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const person = DEMO_PERSONEN.find((p) => p.id === id);

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
      <ProfilAusfuehrlich profil={person} />
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
