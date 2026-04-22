import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEMO_AKTIVITAETEN } from "../data/aktivitaeten";
import { DEMO_LOCATIONS } from "../data/locations";

type Modus = "zuZweit" | "gruppe";

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
  const [modus, setModus] = useState<Modus>("zuZweit");

  function oeffneLocation(locationId: string) {
    router.push({
      pathname: "/location/[id]",
      params: { id: locationId, ...(chatId ? { chatId } : {}) },
    });
  }

  function oeffneAktivitaet(_aktivitaetId: string) {
    // Detailansicht für Gruppen-Aktivitäten wird später implementiert.
  }

  return (
    <>
      <Stack.Screen options={{ title: "Treffen vorschlagen" }} />

      <View style={styles.container}>
        {/* Umschalter: Zu zweit / Gruppentreffen */}
        <View style={styles.umschalter}>
          <TouchableOpacity
            style={[styles.tab, modus === "zuZweit" && styles.tabAktiv]}
            onPress={() => setModus("zuZweit")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                modus === "zuZweit" && styles.tabTextAktiv,
              ]}
            >
              Zu zweit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, modus === "gruppe" && styles.tabAktiv]}
            onPress={() => setModus("gruppe")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                modus === "gruppe" && styles.tabTextAktiv,
              ]}
            >
              Gruppentreffen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste je nach Modus */}
        {modus === "zuZweit" ? (
          <FlatList
            data={DEMO_LOCATIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListenZeile
                name={item.name}
                coverbild={item.coverbild}
                onPress={() => oeffneLocation(item.id)}
              />
            )}
            contentContainerStyle={styles.liste}
          />
        ) : (
          <FlatList
            data={DEMO_AKTIVITAETEN}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListenZeile
                name={item.titel}
                coverbild={item.hintergrundbild}
                onPress={() => oeffneAktivitaet(item.id)}
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
});
