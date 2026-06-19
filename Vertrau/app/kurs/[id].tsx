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
import {
  ladeKursDetail,
  type UIKursDetail,
  type UIKursTeilnehmer,
} from "../../api/kurse";
import {
  ladeUserLerngruppenFuerKurs,
  type Lerngruppe,
} from "../../data/userLerngruppen";

// ─── Einzelne Teilnehmer-Zeile ────────────────────────────────────────────────

function TeilnehmerZeile({
  person,
  onPress,
}: {
  person: UIKursTeilnehmer;
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

function LerngruppenZeile({
  gruppe,
  onPress,
}: {
  gruppe: Lerngruppe;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.zeile}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
    >
      {gruppe.bilder[0] || gruppe.hintergrundbild ? (
        <Image
          source={{ uri: gruppe.bilder[0] ?? gruppe.hintergrundbild }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.gruppeIcon]}>
          <Ionicons name="people" size={22} color="#fff" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {gruppe.titel}
        </Text>
        <Text style={styles.gruppeMeta}>
          {gruppe.teilnehmer.length} Mitglieder
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />}
    </TouchableOpacity>
  );
}

export default function KursDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [kurs, setKurs] = useState<UIKursDetail | null>(null);
  const [laden, setLaden] = useState(true);
  const [lerngruppen, setLerngruppen] = useState<Lerngruppe[]>([]);

  const teilnehmer = kurs?.teilnehmer ?? [];

  useFocusEffect(
    useCallback(() => {
      let abgebrochen = false;
      if (!id) return () => {};
      setLaden(true);
      (async () => {
        try {
          // Lerngruppen sind noch Mock (kommen mit dem Treffen-Tab); für echte
          // Modul-ids liefert der Mock einfach eine leere Liste.
          const [detail, gruppen] = await Promise.all([
            ladeKursDetail(id),
            ladeUserLerngruppenFuerKurs(id),
          ]);
          if (!abgebrochen) {
            setKurs(detail);
            setLerngruppen(gruppen);
          }
        } catch {
          if (!abgebrochen) setKurs(null);
        } finally {
          if (!abgebrochen) setLaden(false);
        }
      })();
      return () => {
        abgebrochen = true;
      };
    }, [id])
  );

  function lerngruppeErstellen() {
    if (!kurs?.id) return;
    router.push({
      pathname: "/aktivitaet/neu",
      params: { kursId: kurs.id },
    });
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: kurs?.name ?? "Kurs" }} />

      {/* Kurs-Kopf */}
      <View style={styles.kopf}>
        <Text style={styles.kursName}>
          {kurs?.name ?? (laden ? "Lädt…" : "Modul nicht gefunden")}
        </Text>
        {kurs && (
          <Text style={styles.kursMeta}>
            {kurs.ects != null ? `${kurs.ects} ECTS · ` : ""}Nr. {kurs.nummer} ·{" "}
            {kurs.anzahlTeilnehmer} Teilnehmer
          </Text>
        )}
      </View>

      {/* Lerngruppen-Sektion */}
      <View style={styles.sektionKopf}>
        <Text style={[styles.sektionTitel, styles.sektionTitelInKopf]}>
          Lerngruppen ({lerngruppen.length})
        </Text>
        <TouchableOpacity
          style={styles.erstellenButton}
          onPress={lerngruppeErstellen}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color="#007AFF" />
          <Text style={styles.erstellenButtonText}>Lerngruppen erstellen</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.liste}>
        {lerngruppen.length === 0 ? (
          <View style={styles.leer}>
            <Text style={styles.leerText}>Noch keine Lerngruppen.</Text>
          </View>
        ) : (
          lerngruppen.map((gruppe, index) => (
            <View key={gruppe.id}>
              {index > 0 && <View style={styles.trenner} />}
              <LerngruppenZeile
                gruppe={gruppe}
                onPress={() =>
                  router.push({
                    pathname: "/aktivitaet/[id]",
                    params: { id: gruppe.id },
                  })
                }
              />
            </View>
          ))
        )}
      </View>

      {/* Liste der Teilnehmer */}
      <Text style={styles.sektionTitel}>
        Teilnehmer ({teilnehmer.length})
      </Text>
      <FlatList
        data={teilnehmer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeilnehmerZeile
            person={item}
            onPress={() => router.push(`/person/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.trenner} />}
        style={styles.liste}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.leer}>
            {laden ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.leerText}>Noch keine Teilnehmer.</Text>
            )}
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
  kursName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  kursMeta: {
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
  },
  sektionKopf: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 7,
    marginHorizontal: 20,
  },
  sektionTitelInKopf: {
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  erstellenButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  erstellenButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  gruppeIcon: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  gruppeMeta: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
});
