import { Link } from "expo-router";
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
import { signInWithPassword } from "../../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const eingabenOk = email.trim().length > 0 && passwort.length > 0;

  async function anmelden() {
    if (!eingabenOk || laedt) return;
    setFehler(null);
    setLaedt(true);
    try {
      await signInWithPassword(email.trim(), passwort);
      // Session ist da → AuthGate wechselt automatisch zu den Tabs.
      // authSync legt das Profil an, falls es noch fehlt (idempotent).
      try {
        await authSync();
      } catch {
        // Backend nicht erreichbar — Login bleibt gültig, Profil wird beim
        // nächsten erfolgreichen Request gesynct.
        Alert.alert(
          "Hinweis",
          "Anmeldung erfolgreich, aber der Server ist gerade nicht erreichbar."
        );
      }
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
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
        <Text style={stile.titel}>Vertrau</Text>
        <Text style={stile.untertitel}>Melde dich mit deinem Konto an</Text>

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
            placeholder="Passwort"
            placeholderTextColor="#aaa"
            secureTextEntry
            textContentType="password"
            onSubmitEditing={anmelden}
          />

          {fehler && <Text style={stile.fehlerText}>{fehler}</Text>}

          <TouchableOpacity
            style={[stile.knopf, (!eingabenOk || laedt) && stile.knopfInaktiv]}
            onPress={anmelden}
            disabled={!eingabenOk || laedt}
          >
            {laedt ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={stile.knopfText}>Anmelden</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={stile.wechselZeile}>
          <Text style={stile.wechselText}>Noch kein Konto?</Text>
          <Link href="/onboarding" style={stile.wechselLink}>
            Konto erstellen
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
