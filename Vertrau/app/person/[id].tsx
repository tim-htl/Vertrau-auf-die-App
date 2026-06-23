import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ProfilAusfuehrlich } from "../../components/ProfilAusfuehrlich";
import { ladePerson } from "../../api/personen";
import type { Person } from "../../data/personen";

// Ausführliche Profilansicht (AP) fremder Profile. Erreichbar durch
// Antippen der kurzen Profilansicht (Karte im Personen-Tab etc.).
// Lädt das Profil live aus dem Backend (GET /personen/:id).

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [status, setStatus] = useState<"laedt" | "ok" | "fehler">("laedt");

  useEffect(() => {
    if (!id) return;
    ladePerson(id)
      .then((p) => {
        setPerson(p);
        setStatus("ok");
      })
      .catch(() => setStatus("fehler"));
  }, [id]);

  if (status === "laedt") {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Profil" }} />
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      </View>
    );
  }

  if (status === "fehler" || !person) {
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
      <ProfilAusfuehrlich
        profil={person}
        moduleItems={person.moduleItems}
        onModulPress={(modulId) => router.push(`/kurs/${modulId}`)}
      />
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
