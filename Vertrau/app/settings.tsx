import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signOut } from "../lib/supabase";
import { resetSwipes } from "../data/swipes";

export default function SettingsScreen() {
  const ausloggen = () => {
    Alert.alert("Ausloggen", "Möchtest du dich wirklich ausloggen?", [
      {
        text: "Abbrechen",
        style: "cancel",
      },
      {
        text: "Ausloggen",
        style: "destructive",
        onPress: async () => {
          try {
            // Lokale Mock-Reste + Swipe-Likes räumen, dann die ECHTE
            // Supabase-Session aus dem SecureStore löschen → der AuthGate
            // im RootLayout wechselt automatisch zum Login (kein router.replace
            // nötig; /onboarding wäre mit Session ohnehin nicht erreichbar).
            await AsyncStorage.multiRemove(["profil_v2", "onboarding_completed"]);
            await resetSwipes();
            await signOut();
          } catch (e) {
            Alert.alert(
              "Fehler",
              e instanceof Error ? e.message : "Ausloggen fehlgeschlagen."
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={stile.screen}>
      <Text style={stile.titel}>Settings</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        style={stile.logoutButton}
        onPress={ausloggen}
      >
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={stile.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const stile = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    padding: 20,
  },
  titel: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
});