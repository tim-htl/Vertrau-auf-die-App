import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authSync } from "../../api/me";
import { signUpWithPassword } from "../../lib/supabase";

export default function RegistrierenScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [passwortWdh, setPasswortWdh] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const eingabenOk =
    email.trim().length > 0 && passwort.length > 0 && passwortWdh.length > 0;

  async function registrieren() {
    if (!eingabenOk || laedt) return;
    setFehler(null);

    if (passwort !== passwortWdh) {
      setFehler("Die Passwörter stimmen nicht überein.");
      return;
    }
    if (passwort.length < 6) {
      setFehler("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setLaedt(true);
    try {
      const session = await signUpWithPassword(email.trim(), passwort);

      if (!session) {
        // "Confirm email" ist im Supabase-Dashboard aktiviert (Production):
        // es gibt noch keine Session, der User muss erst seine Mail bestätigen.
        Alert.alert(
          "Fast geschafft",
          "Wir haben dir eine Bestätigungs-E-Mail geschickt. Danach kannst du dich anmelden."
        );
        router.replace("/(auth)/login");
        return;
      }

      // Dev-Setup (Confirm-Email aus): Session ist direkt da, AuthGate wechselt
      // zu den Tabs. authSync legt die Profil-Zeile im Backend an.
      try {
        await authSync();
      } catch {
        Alert.alert(
          "Hinweis",
          "Registrierung erfolgreich, aber der Server ist gerade nicht erreichbar."
        );
      }
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Registrierung fehlgeschlagen.");
      setLaedt(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={stile.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={stile.titel}>Konto erstellen</Text>
        <Text style={stile.untertitel}>
          Mit E-Mail und Passwort registrieren
        </Text>

        <View style={stile.formular}>
          <TextInput
            style={stile.eingabe}
            value={email}
            onChangeText={setEmail}
            placeholder="E-Mail"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            style={stile.eingabe}
            value={passwort}
            onChangeText={setPasswort}
            placeholder="Passwort (mind. 6 Zeichen)"
            placeholderTextColor="#aaa"
            secureTextEntry
            textContentType="newPassword"
          />
          <TextInput
            style={stile.eingabe}
            value={passwortWdh}
            onChangeText={setPasswortWdh}
            placeholder="Passwort wiederholen"
            placeholderTextColor="#aaa"
            secureTextEntry
            textContentType="newPassword"
            onSubmitEditing={registrieren}
          />

          {fehler && <Text style={stile.fehlerText}>{fehler}</Text>}

          <TouchableOpacity
            style={[stile.knopf, (!eingabenOk || laedt) && stile.knopfInaktiv]}
            onPress={registrieren}
            disabled={!eingabenOk || laedt}
          >
            {laedt ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={stile.knopfText}>Registrieren</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={stile.wechselZeile}>
          <Text style={stile.wechselText}>Schon ein Konto?</Text>
          <Link href="/(auth)/login" style={stile.wechselLink}>
            Anmelden
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stile = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  titel: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#1c1c1e",
  },
  untertitel: {
    fontSize: 15,
    textAlign: "center",
    color: "#8E8E93",
    marginTop: 6,
    marginBottom: 32,
  },
  formular: {
    gap: 12,
  },
  eingabe: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#1c1c1e",
  },
  fehlerText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  knopf: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  knopfInaktiv: {
    opacity: 0.4,
  },
  knopfText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  wechselZeile: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  wechselText: {
    color: "#8E8E93",
    fontSize: 15,
  },
  wechselLink: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
