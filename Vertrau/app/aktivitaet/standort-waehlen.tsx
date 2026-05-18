import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DEMO_LOCATIONS, type Location } from "../../data/locations";

// Vollbild-Auswahl für Gruppentreffen-Erstellung:
// oben "Eigenes Treffen erstellen", darunter alle Default-Orte.

function LocationZeile({
  name,
  coverbild,
  onPress,
}: {
  name: string;
  coverbild: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.zeile} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: coverbild }} style={styles.cover} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

export default function StandortWaehlenScreen() {
  const router = useRouter();

  function oeffneEigenes() {
    router.push("/aktivitaet/neu");
  }

  function oeffneMitLocation(location: Location) {
    router.push({
      pathname: "/aktivitaet/neu",
      params: { locationId: location.id },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: "Treffen erstellen" }} />

      <View style={styles.container}>
        <FlatList
          data={DEMO_LOCATIONS}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.zeile}
              onPress={oeffneEigenes}
              activeOpacity={0.7}
            >
              <View style={styles.coverErstellen}>
                <Ionicons name="add" size={28} color="#007AFF" />
              </View>
              <Text style={[styles.name, styles.nameErstellen]} numberOfLines={1}>
                Eigenes Treffen erstellen
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <LocationZeile
              name={item.name}
              coverbild={item.coverbild}
              onPress={() => oeffneMitLocation(item)}
            />
          )}
          contentContainerStyle={styles.liste}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  liste: {
    paddingVertical: 8,
  },
  zeile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#e5e5ea",
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  nameErstellen: {
    color: "#007AFF",
  },
  coverErstellen: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#eaf3ff",
    justifyContent: "center",
    alignItems: "center",
  },
});
