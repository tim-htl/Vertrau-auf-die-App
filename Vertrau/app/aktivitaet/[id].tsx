import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AktivitaetKarte } from "../(tabs)/treffen";
import { DEMO_AKTIVITAETEN } from "../../data/aktivitaeten";

export default function AktivitaetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const aktivitaet = DEMO_AKTIVITAETEN.find((a) => a.id === id);

  // Verfügbare Höhe: wie im Treffen-Tab, aber Header (≈44) berücksichtigen
  const verfuegbareHoehe = height - insets.top - insets.bottom - 44;

  if (!aktivitaet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Aktivität" }} />
        <Text style={styles.leerText}>Aktivität nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: aktivitaet.titel }} />
      <AktivitaetKarte
        item={aktivitaet}
        verfuegbareHoehe={verfuegbareHoehe}
        topInset={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  leerText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});
