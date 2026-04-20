import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_AKTIVITAETEN } from "../../data/aktivitaeten";

export function AktivitaetKarte({ item, verfuegbareHoehe, headerHoehe }: any) {
  const { width } = useWindowDimensions();
  const bildHoehe = verfuegbareHoehe * 0.75;
  const infoHoehe = verfuegbareHoehe * 0.25;
  const profilGroesse = 60;

  return (
    <View style={{ height: verfuegbareHoehe }}>
      <View style={{ height: bildHoehe }}>
        <Image source={{ uri: item.hintergrundbild }} style={StyleSheet.absoluteFillObject} />
        <View style={{ flexDirection: "row", justifyContent: "center", paddingTop: headerHoehe + 12, gap: 10 }}>
          {item.teilnehmer.slice(0, 4).map((t: any) => (
            <View key={t.id} style={styles.profilRahmen}>
              {t.bild ? <Image source={{ uri: t.bild }} style={{ width: profilGroesse, height: profilGroesse, borderRadius: 30 }} /> : <View style={[styles.profilGrau, { width: profilGroesse, height: profilGroesse, borderRadius: 30 }]}><Ionicons name="person" size={30} color="#fff" /></View>}
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.infoBereich, { height: infoHoehe }]}>
        <Text style={styles.titel}>{item.titel}</Text>
        <Text style={styles.ort}>{item.ort}</Text>
        <Text style={styles.beschreibung}>{item.beschreibung}</Text>
      </View>
    </View>
  );
}

export default function TreffenScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 44 + insets.top;
  const verfuegbareHoehe = height - 49 - insets.bottom;

  return (
    <FlatList
      data={DEMO_AKTIVITAETEN}
      keyExtractor={i => i.id}
      pagingEnabled
      snapToInterval={verfuegbareHoehe}
      decelerationRate="fast"
      renderItem={({ item }) => <AktivitaetKarte item={item} verfuegbareHoehe={verfuegbareHoehe} headerHoehe={HEADER_HEIGHT} />}
    />
  );
}

const styles = StyleSheet.create({
  profilRahmen: { borderWidth: 2, borderColor: "#fff", borderRadius: 35, overflow: 'hidden' },
  profilGrau: { backgroundColor: "#b0b0b8", justifyContent: "center", alignItems: "center" },
  infoBereich: { backgroundColor: "#fff", padding: 20 },
  titel: { fontSize: 22, fontWeight: "700" },
  ort: { fontSize: 13, color: "#888" },
  beschreibung: { fontSize: 14, color: "#444", marginTop: 4 },
});