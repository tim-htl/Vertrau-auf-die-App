import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEMO_STUDIENGANG } from "../../data/kurse";

// ─── Uni-Logo (Bild oder Initialen-Platzhalter) ──────────────────────────────

function UniLogo({ uri, text }: { uri: string | null; text: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.uniLogo} />;
  }
  const initialen = text
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.uniLogo, styles.uniLogoPlatzhalter]}>
      <Text style={styles.uniLogoText}>{initialen}</Text>
    </View>
  );
}

// ─── Einzelne Listen-Zeile (iOS-Stil) ────────────────────────────────────────

function ListenZeile({
  titel,
  untertitel,
  onPress,
  letzte,
}: {
  titel: string;
  untertitel?: string;
  onPress: () => void;
  letzte?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.zeile, !letzte && styles.zeileTrenner]}
      onPress={onPress}
      activeOpacity={0.5}
    >
      <View style={styles.zeileText}>
        <Text style={styles.zeileTitel}>{titel}</Text>
        {untertitel && <Text style={styles.zeileUntertitel}>{untertitel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function KurseScreen() {
  const router = useRouter();
  const studiengang = DEMO_STUDIENGANG;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inhalt}>
      {/* Kopfbereich: Logo + Studiengangs-Name */}
      <View style={styles.kopf}>
        <UniLogo uri={studiengang.uniLogo} text={studiengang.uni} />
        <View style={styles.kopfText}>
          <Text style={styles.studiengangName} numberOfLines={2}>
            {studiengang.name}
          </Text>
          <Text style={styles.uniName}>{studiengang.uni}</Text>
        </View>
      </View>

      {/* Meine Kurse */}
      <Text style={styles.sektionTitel}>Meine Kurse</Text>
      <View style={styles.sektion}>
        {studiengang.meineKurse.map((kurs, i) => (
          <ListenZeile
            key={kurs.id}
            titel={kurs.name}
            untertitel={
              kurs.ects
                ? `${kurs.ects} ECTS${kurs.teilnehmer ? ` · ${kurs.teilnehmer.length} Teilnehmer` : ""}`
                : undefined
            }
            onPress={() => router.push(`/kurs/${kurs.id}`)}
            letzte={i === studiengang.meineKurse.length - 1}
          />
        ))}
      </View>

      {/* Moduldatenbank */}
      <Text style={styles.sektionTitel}>Moduldatenbank</Text>
      <View style={styles.sektion}>
        {studiengang.moduldatenbank.map((bereich, i) => (
          <ListenZeile
            key={bereich.id}
            titel={bereich.name}
            untertitel={
              bereich.bereiche
                ? `${bereich.bereiche.length} Bereiche`
                : bereich.module
                ? `${bereich.module.length} Module`
                : undefined
            }
            onPress={() => router.push(`/bereich/${bereich.id}`)}
            letzte={i === studiengang.moduldatenbank.length - 1}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  inhalt: {
    paddingBottom: 32,
  },

  // Kopfbereich
  kopf: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  uniLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  uniLogoPlatzhalter: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  uniLogoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  kopfText: {
    flex: 1,
  },
  studiengangName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  uniName: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
    fontWeight: "500",
  },

  // Sektion (iOS grouped list)
  sektionTitel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6D6D72",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 26,
    marginBottom: 7,
    marginHorizontal: 20,
  },
  sektion: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
  },

  // Listen-Zeile
  zeile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  zeileTrenner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
    marginLeft: 16,
    paddingLeft: 0,
  },
  zeileText: {
    flex: 1,
  },
  zeileTitel: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  zeileUntertitel: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
});
