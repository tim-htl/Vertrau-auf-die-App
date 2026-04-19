import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEMO_STUDIENGANG, findeModul, type Teilnehmer } from "../../data/kurse";

// ─── Teilnehmer-Zeile ─────────────────────────────────────────────────────────

function TeilnehmerZeile({
  person,
  onPress,
}: {
  person: Teilnehmer;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.zeile}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
    >
      {person.bild ? (
        <Image source={{ uri: person.bild }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlatzhalter]}>
          <Ionicons name="person" size={24} color="#fff" style={{ marginTop: 4 }} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {person.name}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />}
    </TouchableOpacity>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ModulDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const modul = findeModul(DEMO_STUDIENGANG.moduldatenbank, id);
  const teilnehmer = modul?.teilnehmer ?? [];

  if (!modul) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Modul" }} />
        <Text style={styles.leerText}>Modul nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: modul.name }} />

      {/* Modul-Kopf */}
      <View style={styles.kopf}>
        <Text style={styles.modulName}>{modul.name}</Text>
        {modul.ects !== undefined && (
          <Text style={styles.modulMeta}>{modul.ects} ECTS</Text>
        )}
      </View>

      {/* Teilnehmer */}
      <Text style={styles.sektionTitel}>
        Teilnehmer ({teilnehmer.length})
      </Text>
      <FlatList
        data={teilnehmer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeilnehmerZeile
            person={item}
            onPress={
              item.personId
                ? () => router.push(`/person/${item.personId}`)
                : undefined
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.trenner} />}
        style={styles.liste}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.leer}>
            <Text style={styles.leerText}>Noch keine Teilnehmer.</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  kopf: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  modulName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  modulMeta: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },

  sektionTitel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6D6D72",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 7,
    marginHorizontal: 20,
  },
  liste: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
  },

  zeile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlatzhalter: {
    backgroundColor: "#b0b0b8",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#d1d1d6",
    marginLeft: 70,
  },

  leer: {
    padding: 40,
    alignItems: "center",
  },
  leerText: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
