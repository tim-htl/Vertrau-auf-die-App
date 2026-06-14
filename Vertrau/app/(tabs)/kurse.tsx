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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_STUDIENGANG } from "../../data/kurse";

const BG = "#E9EEF5";

// ─────────────────────────────────────────────────────────────
// Neumorphism Shadows
// ─────────────────────────────────────────────────────────────

const shadowLight = {
  shadowColor: "#FFFFFF",
  shadowOffset: { width: -6, height: -6 },
  shadowOpacity: 0.9,
  shadowRadius: 8,
};

const shadowDark = {
  elevation: 6,
  shadowColor: "#AAB4C3",
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
};

// ─────────────────────────────────────────────────────────────
// Uni Logo
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Neumorphic List Row
// ─────────────────────────────────────────────────────────────

function ListenZeile({
  titel,
  untertitel,
  onPress,
}: {
  titel: string;
  untertitel?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.zeile}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.zeileText}>
        <Text style={styles.zeileTitel}>{titel}</Text>
        {untertitel && (
          <Text style={styles.zeileUntertitel}>{untertitel}</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9AA6B8" />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function KurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studiengang = DEMO_STUDIENGANG;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.inhalt,
        {
          paddingTop: insets.top + 24,
          paddingBottom: 120,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
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
        {studiengang.meineKurse.map((kurs) => (
          <ListenZeile
            key={kurs.id}
            titel={kurs.name}
            untertitel={
              kurs.ects
                ? `${kurs.ects} ECTS${
                    kurs.teilnehmer
                      ? ` · ${kurs.teilnehmer.length} Teilnehmer`
                      : ""
                  }`
                : undefined
            }
            onPress={() => router.push(`/kurs/${kurs.id}`)}
          />
        ))}
      </View>

      {/* Moduldatenbank */}
      <Text style={styles.sektionTitel}>Moduldatenbank</Text>

      <View style={styles.sektion}>
        {studiengang.moduldatenbank.map((bereich) => (
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
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: BG,
  },

  inhalt: {
    paddingHorizontal: 20,
  },

  kopf: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderRadius: 30,
    backgroundColor: BG,
    marginBottom: 28,

    ...shadowLight,
    ...shadowDark,
  },

  uniLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BG,

    ...shadowLight,
    ...shadowDark,
  },

  uniLogoPlatzhalter: {
    justifyContent: "center",
    alignItems: "center",
  },

  uniLogoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3062AC",
  },

  kopfText: {
    flex: 1,
  },

  studiengangName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#243247",
    letterSpacing: -0.4,
  },

  uniName: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#7D8794",
  },

  sektionTitel: {
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 8,

    fontSize: 12,
    fontWeight: "700",
    color: "#7D8794",

    textTransform: "uppercase",
    letterSpacing: 1,
  },

  sektion: {
    borderRadius: 28,
    //backgroundColor: BG,
    paddingVertical: 8,
    marginBottom: 28,

    ...shadowLight,
    ...shadowDark,
  },

  zeile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  zeileText: {
    flex: 1,
  },

  zeileTitel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#243247",
  },

  zeileUntertitel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: "#8792A2",
  },
});