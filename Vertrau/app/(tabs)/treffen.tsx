import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_AKTIVITAETEN, type Aktivitaet } from "../../data/aktivitaeten";

function ProfilPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[styles.profilRahmen, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.profilGrau, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="person" size={size * 0.55} color="#fff" style={{ marginTop: size * 0.1 }} />
      </View>
    </View>
  );
}

export function AktivitaetKarte({ item, verfuegbareHoehe, headerHoehe }: any) {
  const { width } = useWindowDimensions();
  const bildHoehe = verfuegbareHoehe * 0.75;
  const infoHoehe = verfuegbareHoehe * 0.25;

  const maxTeilnehmer = Math.min(item.teilnehmer.length, 4);
  const seitenAbstand = 24;
  const luecke = 14;
  const profilGroesse = Math.min((width - seitenAbstand * 2 - luecke * (maxTeilnehmer - 1)) / maxTeilnehmer, 72);

  return (
    <View style={{ height: verfuegbareHoehe }}>
      <View style={{ height: bildHoehe, overflow: "hidden" }}>
        <Image source={{ uri: item.hintergrundbild }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

        <View style={[styles.teilnehmerReihe, { gap: luecke, paddingHorizontal: seitenAbstand, paddingTop: headerHoehe + 12 }]}>
          {item.teilnehmer.slice(0, 4).map((t: any) =>
            t.bild ? (
              <View key={t.id} style={[styles.profilRahmen, { width: profilGroesse, height: profilGroesse, borderRadius: profilGroesse / 2 }]}>
                <Image source={{ uri: t.bild }} style={{ width: profilGroesse, height: profilGroesse, borderRadius: profilGroesse / 2 }} />
              </View>
            ) : (
              <ProfilPlatzhalter key={t.id} size={profilGroesse} />
            )
          )}
        </View>
      </View>

      <View style={[styles.infoBereich, { height: infoHoehe }]}>
        <Text style={styles.titel} numberOfLines={1}>{item.titel}</Text>
        <View style={styles.ortReihe}>
          <Ionicons name="location" size={14} color="#e74c3c" />
          <Text style={styles.ort} numberOfLines={1}>{item.ort}</Text>
        </View>
        <Text style={styles.beschreibung}>{item.beschreibung}</Text>
      </View>
    </View>
  );
}

export default function TreffenScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const TAB_BAR_HOEHE = 49;
  const HEADER_HEIGHT = 44 + insets.top; // <-- FIX: Blur Header Höhe berechnen
  const verfuegbareHoehe = height - TAB_BAR_HOEHE - insets.bottom;

  return (
    <FlatList
      data={DEMO_AKTIVITAETEN}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AktivitaetKarte item={item} verfuegbareHoehe={verfuegbareHoehe} headerHoehe={HEADER_HEIGHT} />
      )}
      pagingEnabled
      snapToInterval={verfuegbareHoehe}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({ length: verfuegbareHoehe, offset: verfuegbareHoehe * index, index })}
    />
  );
}

const styles = StyleSheet.create({
  teilnehmerReihe: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  profilRahmen: { borderWidth: 2.5, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4, elevation: 5, overflow: "hidden" },
  profilGrau: { backgroundColor: "#b0b0b8", justifyContent: "flex-end", alignItems: "center", overflow: "hidden" },
  infoBereich: { backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd" },
  titel: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  ortReihe: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ort: { fontSize: 13, color: "#888", flexShrink: 1 },
  beschreibung: { fontSize: 14, color: "#444", lineHeight: 20, flexShrink: 1 },
});