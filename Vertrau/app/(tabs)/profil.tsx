import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const STORAGE_KEY = "user_profile";

type Profile = {
  bild: string;
  name: string;
  studiengang: string;
  universitaet: string;
  alter: string;
  benutzername: string;
  email: string;
  bio: string;
};

const defaultProfile: Profile = {
  bild: "",
  name: "",
  studiengang: "",
  universitaet: "",
  alter: "",
  benutzername: "",
  email: "",
  bio: "",
};

export default function ProfilScreen() {
  const [profil, setProfil] = useState<Profile>(defaultProfile);
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setProfil(JSON.parse(data));
    });
  }, []);

  async function speichern() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profil));
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
  }

  async function bildAuswaehlen() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Berechtigung benötigt", "Bitte erlaube den Zugriff auf deine Fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfil((p) => ({ ...p, bild: result.assets[0].uri }));
    }
  }

  function feld(
    label: string,
    key: keyof Profile,
    options?: { multiline?: boolean; maxLength?: number; keyboardType?: "default" | "email-address" | "numeric" }
  ) {
    return (
      <View style={styles.feldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, options?.multiline && styles.inputMultiline]}
          value={profil[key]}
          onChangeText={(text) => setProfil((p) => ({ ...p, [key]: text }))}
          multiline={options?.multiline}
          maxLength={options?.maxLength}
          keyboardType={options?.keyboardType ?? "default"}
          autoCapitalize={key === "email" ? "none" : "sentences"}
          placeholder={label}
          placeholderTextColor="#aaa"
        />
        {options?.maxLength && (
          <Text style={styles.zaehler}>
            {profil[key].length}/{options.maxLength}
          </Text>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titel}>Mein Profil</Text>

        {/* Profilbild */}
        <TouchableOpacity style={styles.bildContainer} onPress={bildAuswaehlen}>
          {profil.bild ? (
            <Image source={{ uri: profil.bild }} style={styles.bild} />
          ) : (
            <View style={styles.bildPlatzhalter}>
              <Text style={styles.bildPlatzhalterText}>Foto{"\n"}hinzufügen</Text>
            </View>
          )}
        </TouchableOpacity>

        {feld("Name", "name")}
        {feld("Benutzername", "benutzername")}
        {feld("E-Mail-Adresse", "email", { keyboardType: "email-address" })}
        {feld("Alter", "alter", { keyboardType: "numeric" })}
        {feld("Studiengang", "studiengang")}
        {feld("Universität", "universitaet")}
        {feld("Bio", "bio", { multiline: true, maxLength: 200 })}

        <TouchableOpacity style={styles.button} onPress={speichern}>
          <Text style={styles.buttonText}>
            {gespeichert ? "Gespeichert ✓" : "Speichern"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  titel: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  bildContainer: {
    alignSelf: "center",
    marginBottom: 28,
  },
  bild: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bildPlatzhalter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  bildPlatzhalterText: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  feldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },
  zaehler: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
