import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_STUDIENGANG } from "../../data/kurse";

function UniLogo({ uri, text }: { uri: string | null; text: string }) {
  if (uri) return <Image source={{ uri }} style={styles.uniLogo} />;
  const initialen = text.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.uniLogo, styles.uniLogoPlatzhalter]}>
      <Text style={styles.uniLogoText}>{initialen}</Text>
    </View>
  );
}

function ListenZeile({ titel, untertitel, onPress, letzte }: any) {
  return (
    <TouchableOpacity style={[styles.zeile, !letzte && styles.zeileTrenner]} onPress={onPress} activeOpacity={0.5}>
      <View style={styles.zeileText}>
        <Text style={styles.zeileTitel}>{titel}</Text>
        {untertitel && <Text style={styles.zeileUntertitel}>{untertitel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

export default function KurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 44 + insets.top;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32, paddingTop: HEADER_HEIGHT }}>
      <View style={styles.kopf}>
        <UniLogo uri={DEMO_STUDIENGANG.uniLogo} text={DEMO_STUDIENGANG.uni} />
        <View style={styles.kopfText}>
          <Text style={styles.studiengangName} numberOfLines={2}>{DEMO_STUDIENGANG.name}</Text>
          <Text style={styles.uniName}>{DEMO_STUDIENGANG.uni}</Text>
        </View>
      </View>
      <Text style={styles.sektionTitel}>Meine Kurse</Text>
      <View style={styles.sektion}>
        {DEMO_STUDIENGANG.meineKurse.map((kurs, i) => (
          <ListenZeile key={kurs.id} titel={kurs.name} untertitel={`${kurs.ects} ECTS`} onPress={() => router.push(`/kurs/${kurs.id}`)} letzte={i === DEMO_STUDIENGANG.meineKurse.length - 1} />
        ))}
      </View>
      <Text style={styles.sektionTitel}>Moduldatenbank</Text>
      <View style={styles.sektion}>
        {DEMO_STUDIENGANG.moduldatenbank.map((bereich, i) => (
          <ListenZeile key={bereich.id} titel={bereich.name} onPress={() => router.push(`/bereich/${bereich.id}`)} letzte={i === DEMO_STUDIENGANG.moduldatenbank.length - 1} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  kopf: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22, gap: 14, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#d1d1d6" },
  uniLogo: { width: 52, height: 52, borderRadius: 26 },
  uniLogoPlatzhalter: { backgroundColor: "#3062ac", justifyContent: "center", alignItems: "center" },
  uniLogoText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  kopfText: { flex: 1 },
  studiengangName: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  uniName: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
  sektionTitel: { fontSize: 13, fontWeight: "500", color: "#6D6D72", textTransform: "uppercase", marginTop: 26, marginBottom: 7, marginHorizontal: 20 },
  sektion: { backgroundColor: "#fff", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#d1d1d6" },
  zeile: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 },
  zeileTrenner: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#d1d1d6", marginLeft: 16 },
  zeileText: { flex: 1 },
  zeileTitel: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
  zeileUntertitel: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
});