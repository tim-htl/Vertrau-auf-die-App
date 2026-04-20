import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { AktivitaetKarte } from "../(tabs)/treffen";
import { DEMO_AKTIVITAETEN } from "../../data/aktivitaeten";

export default function AktivitaetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const aktivitaet = DEMO_AKTIVITAETEN.find((a) => a.id === id);
  const HEADER_HEIGHT = 44 + insets.top;
  const verfuegbareHoehe = height - insets.bottom;

  if (!aktivitaet) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen options={{ title: aktivitaet.titel }} />
      <AktivitaetKarte item={aktivitaet} verfuegbareHoehe={verfuegbareHoehe} headerHoehe={HEADER_HEIGHT} />
    </View>
  );
}