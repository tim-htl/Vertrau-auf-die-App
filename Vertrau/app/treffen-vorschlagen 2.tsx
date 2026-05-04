import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
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

// ─── Eine Listenzeile ─────────────────────────────────────────────────────────

function ListenZeile({
  name,
  coverbild,
  onInfo,
}: {
  name: string;
  coverbild: string;
  onInfo: () => void;
}) {
  return (
    <View style={styles.zeile}>
      <Image source={{ uri: coverbild }} style={styles.cover} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <TouchableOpacity
        style={styles.infoButton}
        onPress={onInfo}
        activeOpacity={0.7}
      >
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.infoButtonText}>Info</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function TreffenVorschlagenScreen() {
  const [modus, setModus] = useState<Modus>("zuZweit");

  function zeigeInfo() {
    // TODO: Detailansicht öffnen
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
                onInfo={zeigeInfo}
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
                onInfo={zeigeInfo}
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
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#eaf3ff",
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
});
