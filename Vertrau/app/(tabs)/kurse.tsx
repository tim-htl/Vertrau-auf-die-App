import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image"; // 🔥 Optimierung: expo-image statt react-native
import { useRouter } from "expo-router";
import {
  SectionList, // 🔥 Optimierung: SectionList für stark verbesserte Performance
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEMO_STUDIENGANG } from "../../data/kurse";

// ─── Uni-Logo (Bild oder Initialen-Platzhalter) ──────────────────────────────

function UniLogo({ uri, text }: { uri: string | null; text: string }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.uniLogo}
        transition={200} // Weicher Fade-In Effekt
        cachePolicy="memory-disk" // Caching für bessere Performance
      />
    );
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
      activeOpacity={0.6} // Leicht angepasstes Touch-Feedback
      accessibilityRole="button" // 🔥 Optimierung: Barrierefreiheit
      accessibilityHint={`Öffnet Details für ${titel}`}
    >
      <View style={styles.zeileText}>
        <Text style={styles.zeileTitel} numberOfLines={1}>{titel}</Text>
        {untertitel && <Text style={styles.zeileUntertitel} numberOfLines={1}>{untertitel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function KurseScreen() {
  const router = useRouter();
  const studiengang = DEMO_STUDIENGANG;

  // 🔥 Optimierung: Daten für die SectionList aufbereiten
  const sections = [
    {
      title: "Meine Kurse",
      data: studiengang.meineKurse.map((kurs) => ({
        ...kurs,
        untertitel: kurs.ects
          ? `${kurs.ects} ECTS${kurs.teilnehmer ? ` · ${kurs.teilnehmer.length} Teilnehmer` : ""}`
          : undefined,
        route: `/kurs/${kurs.id}` as any,
      })),
    },
    {
      title: "Moduldatenbank",
      data: studiengang.moduldatenbank.map((bereich) => ({
        ...bereich,
        untertitel: bereich.bereiche
          ? `${bereich.bereiche.length} Bereiche`
          : bereich.module
          ? `${bereich.module.length} Module`
          : undefined,
        route: `/bereich/${bereich.id}` as any,
      })),
    },
  ];

  const ListHeader = () => (
    <View style={styles.kopf}>
      <UniLogo uri={studiengang.uniLogo} text={studiengang.uni} />
      <View style={styles.kopfText}>
        <Text style={styles.studiengangName} numberOfLines={2}>
          {studiengang.name}
        </Text>
        <Text style={styles.uniName}>{studiengang.uni}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.inhalt}
        stickySectionHeadersEnabled={false} // Verhindert, dass iOS-Header oben kleben bleiben (passt besser zum Apple-Settings-Look)
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sektionTitel}>{title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const isLetzte = index === section.data.length - 1;
          return (
            <View style={[styles.sektionWrapper, index === 0 && styles.ersteZeile, isLetzte && styles.letzteZeile]}>
               <ListenZeile
                titel={item.name}
                untertitel={item.untertitel}
                onPress={() => router.push(item.route)}
                letzte={isLetzte}
              />
            </View>
          );
        }}
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
  inhalt: {
    paddingBottom: 40, // Etwas mehr Platz für die Bottom Tab Bar
  },
  kopf: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC", // Etwas weicherer Rand
  },
  uniLogo: {
    width: 56, // Leicht vergrößert für bessere Sichtbarkeit
    height: 56,
    borderRadius: 28,
  },
  uniLogoPlatzhalter: {
    backgroundColor: "#007AFF", // System-Blau wirkt nativer
    justifyContent: "center",
    alignItems: "center",
  },
  uniLogoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  kopfText: {
    flex: 1,
    justifyContent: "center",
  },
  studiengangName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000", // Starker Kontrast
    letterSpacing: -0.4,
  },
  uniName: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  sektionTitel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D6D72",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sektionWrapper: {
    backgroundColor: "#fff",
  },
  ersteZeile: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C7C7CC",
  },
  letzteZeile: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC",
  },
  zeile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20, // Mehr Abstand zum Rand
  },
  zeileTrenner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC",
    marginLeft: 20,
    paddingLeft: 0,
  },
  zeileText: {
    flex: 1,
    paddingRight: 16,
  },
  zeileTitel: {
    fontSize: 17, // Native iOS Schriftgröße für Listen
    color: "#000",
    fontWeight: "400",
  },
  zeileUntertitel: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 3,
  },
});