import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ladeLocations } from "../api/locations";
import { type Location } from "../data/locations";

// ─── Eine Listenzeile (komplett tapbar) ───────────────────────────────────────

function ListenZeile({
  name,
  coverbild,
  onPress,
}: {
  name: string;
  coverbild: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.zeile}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: coverbild }} style={styles.cover} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function TreffenVorschlagenScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [laden, setLaden] = useState(true);

  // Kuratierte Orte aus dem Backend (GET /locations). Gruppentreffen-Vorschläge
  // laufen über das Einladen (siehe Treffen erstellen/bearbeiten) und sind hier
  // bewusst nicht enthalten.
  useFocusEffect(
    useCallback(() => {
      let abgebrochen = false;
      (async () => {
        try {
          const liste = await ladeLocations();
          if (!abgebrochen) setLocations(liste);
        } catch {
          if (!abgebrochen) setLocations([]);
        } finally {
          if (!abgebrochen) setLaden(false);
        }
      })();
      return () => {
        abgebrochen = true;
      };
    }, [])
  );

  function oeffneLocation(locationId: string) {
    router.push({
      pathname: "/location/[id]",
      params: { id: locationId, ...(chatId ? { chatId } : {}) },
    });
  }

  function oeffneEigenenVorschlag() {
    router.push({
      pathname: "/vorschlag-erstellen",
      params: chatId ? { chatId } : {},
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: "Treffen vorschlagen" }} />

      <View style={styles.container}>
        {laden ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.zeile}
                onPress={oeffneEigenenVorschlag}
                activeOpacity={0.7}
              >
                <View style={styles.coverErstellen}>
                  <Ionicons name="add" size={28} color="#007AFF" />
                </View>
                <Text style={[styles.name, styles.nameErstellen]} numberOfLines={1}>
                  Eigenes Treffen vorschlagen
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <ListenZeile
                name={item.name}
                coverbild={item.coverbild}
                onPress={() => oeffneLocation(item.id)}
              />
            )}
            contentContainerStyle={styles.liste}
          />
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  umschalter: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabAktiv: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },
  tabTextAktiv: {
    color: "#007AFF",
  },
  liste: {
    paddingVertical: 8,
  },
  zeile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#e5e5ea",
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  nameErstellen: {
    color: "#007AFF",
  },
  coverErstellen: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#eaf3ff",
    justifyContent: "center",
    alignItems: "center",
  },
});
