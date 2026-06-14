import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

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
          await AsyncStorage.multiRemove([
            "user",
            "token",
            "profil_v2",
            "onboarding_completed",
          ]);

          router.replace("/onboarding");
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