import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { DEMO_STUDIENGANG, findeBereich, type Modul } from "../../data/kurse";

function ListenZeile({ titel, untertitel, chevron = true, onPress, letzte }: any) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.zeile, !letzte && styles.zeileTrenner]} onPress={onPress} activeOpacity={0.5}>
      <View style={styles.zeileText}>
        <Text style={styles.zeileTitel}>{titel}</Text>
        {untertitel && <Text style={styles.zeileUntertitel}>{untertitel}</Text>}
      </View>
      {chevron && <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />}
    </Wrapper>
  );
}

function ModulZeile({ modul, letzte }: { modul: Modul; letzte?: boolean }) {
  const router = useRouter();
  const untertitel = [modul.ects ? `${modul.ects} ECTS` : null, modul.teilnehmer?.length ? `${modul.teilnehmer.length} Teilnehmer` : null].filter(Boolean).join(" · ") || undefined;
  return <ListenZeile titel={modul.name} untertitel={untertitel} onPress={() => router.push(`/modul/${modul.id}`)} letzte={letzte} />;
}

export default function BereichScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ path: string | string[] }>();
  const headerHeight = useHeaderHeight();

  const pfadArr = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const { bereich, pfadNamen } = findeBereich(DEMO_STUDIENGANG.moduldatenbank, pfadArr);

  if (!bereich) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Bereich" }} />
        <Text style={styles.leerText}>Bereich nicht gefunden.</Text>
      </View>
    );
  }

  const hatUnterbereiche = bereich.bereiche && bereich.bereiche.length > 0;
  const hatModule = bereich.module && bereich.module.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32, paddingTop: headerHeight }}>
      <Stack.Screen options={{ title: bereich.name }} />

      <View style={styles.kopf}>
        <Text style={styles.kopfTitel}>{bereich.name}</Text>
        {pfadNamen.length > 1 && <Text style={styles.kopfPfad}>{pfadNamen.slice(0, -1).join(" › ")}</Text>}
      </View>

      {hatUnterbereiche && (
        <>
          <Text style={styles.sektionTitel}>Unterbereiche</Text>
          <View style={styles.sektion}>
            {bereich.bereiche!.map((b, i) => (
              <ListenZeile key={b.id} titel={b.name} untertitel={b.bereiche ? `${b.bereiche.length} Unterbereiche` : b.module ? `${b.module.length} Module` : undefined} onPress={() => router.push(`/bereich/${[...pfadArr, b.id].join("/")}`)} letzte={i === bereich.bereiche!.length - 1} />
            ))}
          </View>
        </>
      )}

      {hatModule && (
        <>
          <Text style={styles.sektionTitel}>Module</Text>
          <View style={styles.sektion}>
            {bereich.module!.map((m, i) => (
              <ModulZeile key={m.id} modul={m} letzte={i === bereich.module!.length - 1} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  kopf: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#d1d1d6" },
  kopfTitel: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.3 },
  kopfPfad: { fontSize: 13, color: "#8E8E93", marginTop: 4, fontWeight: "500" },
  sektionTitel: { fontSize: 13, fontWeight: "500", color: "#6D6D72", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 24, marginBottom: 7, marginHorizontal: 20 },
  sektion: { backgroundColor: "#fff", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#d1d1d6" },
  zeile: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, backgroundColor: "#fff" },
  zeileTrenner: { 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "#d1d1d6", 
    marginLeft: 16, 
    paddingLeft: 0 // FIX: Ausrichtung des Textes
  },
  zeileText: { flex: 1 },
  zeileTitel: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
  zeileUntertitel: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
  leerText: { color: "#8E8E93", textAlign: "center", marginTop: 40, fontSize: 14 },
});