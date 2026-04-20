import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
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
  useWindowDimensions,
  View,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

// ─── Typen & Standardwerte ────────────────────────────────────────────────────

type ProfilData = {
  // Profil-Seite (Direkt interaktiv)
  name: string;
  bilder: (string | null)[];
  bio: string;
  hobbies: string[];
  module: string[];
  // Settings
  alter: string;
  studiengang: string;
  uni: string;
  email: string;
  verifiziert: boolean;
};

const DEFAULT_PROFIL: ProfilData = {
  name: "",
  alter: "22",
  studiengang: "Studiengang",
  uni: "Universität",
  email: "",
  verifiziert: false,
  bilder: [null, null, null, null, null],
  bio: "",
  hobbies: [],
  module: [],
};

const STORAGE_KEY = "profil_v5";

// ─── Hilfsfunktion: Bild auswählen ───────────────────────────────────────────

async function bildAuswaehlen(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Berechtigung benötigt", "Bitte erlaube den Zugriff auf deine Fotos.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
  });
  if (!result.canceled) return result.assets[0].uri;
  return null;
}

// ─── Einstellungen Ansicht ───────────────────────────────────────────────────

function EinstellungenAnsicht({
  profil,
  onChange,
  headerHeight,
}: {
  profil: ProfilData;
  onChange: (p: ProfilData) => void;
  headerHeight: number;
}) {
  return (
    <ScrollView style={[stile.settingsContainer, { paddingTop: headerHeight + 16 }]}>
      <Text style={stile.sektionTitel}>Account & Studium</Text>
      <View style={stile.sektionBox}>
        <View style={[stile.settingZeile, stile.settingTrenner]}>
          <Text style={stile.settingLabel}>Alter</Text>
          <TextInput
            style={stile.settingInput}
            value={profil.alter}
            onChangeText={(t) => onChange({ ...profil, alter: t })}
            keyboardType="number-pad"
            placeholder="z.B. 22"
          />
        </View>
        <View style={[stile.settingZeile, stile.settingTrenner]}>
          <Text style={stile.settingLabel}>Universität</Text>
          <TextInput
            style={stile.settingInput}
            value={profil.uni}
            onChangeText={(t) => onChange({ ...profil, uni: t })}
            placeholder="Deine Uni"
          />
        </View>
        <View style={stile.settingZeile}>
          <Text style={stile.settingLabel}>Studiengang</Text>
          <TextInput
            style={stile.settingInput}
            value={profil.studiengang}
            onChangeText={(t) => onChange({ ...profil, studiengang: t })}
            placeholder="Dein Studiengang"
          />
        </View>
      </View>

      <Text style={stile.sektionTitel}>Sicherheit & Verifizierung</Text>
      <View style={stile.sektionBox}>
        <View style={[stile.settingZeile, stile.settingTrenner]}>
          <Text style={stile.settingLabel}>Uni-Email</Text>
          <TextInput
            style={stile.settingInput}
            value={profil.email}
            onChangeText={(t) => onChange({ ...profil, email: t })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@uni.edu"
          />
        </View>
        <View style={stile.settingZeile}>
          <View>
            <Text style={stile.settingLabel}>Verifizierter Student</Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
              Bestätige deine Uni-Email
            </Text>
          </View>
          <Switch
            value={profil.verifiziert}
            onValueChange={(v) => onChange({ ...profil, verifiziert: v })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Haupt-Screen (Interaktives Profil) ───────────────────────────────────────

export default function ProfilScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const [profil, setProfil] = useState<ProfilData>(DEFAULT_PROFIL);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsModus, setSettingsModus] = useState(false);

  const TAB_BAR = 49;
  const HEADER_HEIGHT = 44 + insets.top; 
  const verfuegbar = height - HEADER_HEIGHT - TAB_BAR - insets.bottom;

  // Profil laden
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setProfil(JSON.parse(data));
      setIsLoaded(true);
    });
  }, []);

  // Profil automatisch speichern
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profil));
    }
  }, [profil, isLoaded]);

  // Frosted Glass Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerBackground: () => (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      ),
      headerRight: () => (
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={settingsModus ? "Einstellungen schließen" : "Einstellungen öffnen"}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          onPress={() => setSettingsModus((v) => !v)}
          style={{ marginRight: 16 }}
        >
          <Ionicons
            name={settingsModus ? "close" : "settings-outline"}
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>
      ),
      title: settingsModus ? "Einstellungen" : "Mein Profil",
    });
  }, [settingsModus, navigation]);

  async function bildWaehlen(index: number) {
    const uri = await bildAuswaehlen();
    if (uri) {
      const neueBilder = [...profil.bilder];
      neueBilder[index] = uri;
      setProfil({ ...profil, bilder: neueBilder });
    }
  }

  function bildEntfernen(index: number) {
    if (!profil.bilder[index]) return;
    Alert.alert("Bild entfernen", "Möchtest du dieses Bild löschen?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", style: "destructive", onPress: () => {
          const neueBilder = [...profil.bilder];
          neueBilder[index] = null;
          setProfil({ ...profil, bilder: neueBilder });
        } 
      }
    ]);
  }

  const seitenPadding = 16;
  const spaltenGap = 16; // Weiterer Abstand
  const innenBreite = width - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.33;
  const infoSpalteBreite = innenBreite - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const bildAbstand = 8;
  const bildKanteNachHoehe = (verfuegbar - 32 - bildAbstand * (anzahlBilder - 1)) / anzahlBilder;
  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);

  if (settingsModus) {
    return <EinstellungenAnsicht profil={profil} onChange={setProfil} headerHeight={HEADER_HEIGHT} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Content rutscht sauber unter den transparenten Header */}
      <ScrollView contentContainerStyle={{ minHeight: verfuegbar, paddingTop: HEADER_HEIGHT + 16 }}>
        <View style={[stile.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>
          
          {/* Linke Spalte: Fotostreifen Optik (Genau wie in Personen) */}
          <View style={{ 
            width: bildSpalteBreite, 
            gap: bildAbstand, 
            alignItems: "center",
            backgroundColor: "#F2F2F7",
            paddingVertical: 10,
            borderRightWidth: 2,
            borderRightColor: "#D1D1D6"
          }}>
            {profil.bilder.slice(0, anzahlBilder).map((bild, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => bildWaehlen(i)}
                onLongPress={() => bildEntfernen(i)}
              >
                {bild ? (
                  <Image source={{ uri: bild }} style={{ width: bildKante, height: bildKante }} />
                ) : (
                  <View style={{ width: bildKante, height: bildKante, overflow: "hidden", backgroundColor: "#E5E5EA", justifyContent: "center", alignItems: "center" }}>
                     <Ionicons name="add" size={bildKante * 0.4} color="#8E8E93" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 9, color: "#8E8E93", textAlign: "center", marginTop: 4, paddingHorizontal: 2 }}>
              Tippen zum Ändern
            </Text>
          </View>

          {/* Rechte Spalte: Interaktiver Info-Bereich mit allen Feldern */}
          <View style={[stile.infoSpalte, { width: infoSpalteBreite }]}>
            
            <TextInput
              style={stile.nameInput}
              value={profil.name}
              onChangeText={(t) => setProfil({ ...profil, name: t })}
              placeholder="Dein Name"
              placeholderTextColor="#C7C7CC"
              maxLength={20}
            />
            
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Text style={stile.alterText}>{profil.alter} Jahre</Text>
              {profil.verifiziert && (
                <Ionicons name="checkmark-circle" size={14} color="#34C759" style={{ marginLeft: 6 }} />
              )}
            </View>

            <View style={stile.trenner} />

            <View style={stile.infoZeile}>
              <Text style={stile.infoLabel}>Bio</Text>
              <TextInput
                style={stile.bioInput}
                value={profil.bio}
                onChangeText={(t) => setProfil({ ...profil, bio: t })}
                placeholder="Schreib etwas über dich..."
                placeholderTextColor="#C7C7CC"
                multiline
                maxLength={200}
              />
            </View>

            <View style={stile.infoZeile}>
              <Text style={stile.infoLabel}>Uni</Text>
              <Text style={stile.infoWert}>{profil.uni || "—"}</Text>
            </View>
            <View style={stile.infoZeile}>
              <Text style={stile.infoLabel}>Studiengang</Text>
              <Text style={stile.infoWert}>{profil.studiengang || "—"}</Text>
            </View>

            <InteraktiveTagReihe
              label="Module"
              items={profil.module}
              onAdd={(text) => setProfil({ ...profil, module: [...profil.module, text] })}
              onRemove={(i) => setProfil({ ...profil, module: profil.module.filter((_, idx) => idx !== i) })}
            />

            <InteraktiveTagReihe
              label="Hobbies"
              items={profil.hobbies}
              onAdd={(text) => setProfil({ ...profil, hobbies: [...profil.hobbies, text] })}
              onRemove={(i) => setProfil({ ...profil, hobbies: profil.hobbies.filter((_, idx) => idx !== i) })}
            />

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Hilfskomponente für Hobbies & Module
function InteraktiveTagReihe({ label, items, onAdd, onRemove }: { label: string; items: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const [text, setText] = useState("");
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>
      <View style={stile.tagReihe}>
        {items.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => onRemove(i)} style={stile.tagEdit} activeOpacity={0.6}>
            <Text style={stile.tagText}>{item}</Text>
            <Ionicons name="close" size={12} color="#666" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}
        <TextInput
          style={stile.tagInputInline}
          value={text}
          onChangeText={setText}
          placeholder="+ Hinzufügen"
          placeholderTextColor="#007AFF"
          onSubmitEditing={() => {
            if (text.trim()) {
              onAdd(text.trim());
              setText("");
            }
          }}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stile = StyleSheet.create({
  zeile: {
    flexDirection: "row",
    flex: 1,
    paddingBottom: 40,
  },
  infoSpalte: {
    flex: 1,
    paddingTop: 4,
    paddingLeft: 6, // Zusätzlicher Abstand zum Fotostreifen
  },
  nameInput: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    padding: 0,
  },
  bioInput: {
    fontSize: 14,
    color: "#1a1a1a",
    lineHeight: 19,
    minHeight: 40,
    padding: 0,
    textAlignVertical: "top",
  },
  alterText: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5ea",
    marginVertical: 12,
  },
  infoZeile: {
    marginBottom: 28,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoWert: {
    fontSize: 14,
    color: "#1a1a1a",
    lineHeight: 19,
  },
  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagEdit: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  tagInputInline: {
    fontSize: 12,
    color: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 5,
    minWidth: 90,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  sektionTitel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6D6D72",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 7,
    marginHorizontal: 16,
  },
  sektionBox: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#C7C7CC",
    paddingLeft: 16,
  },
  settingZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 44,
  },
  settingTrenner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC",
  },
  settingLabel: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  settingInput: {
    flex: 1,
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "right",
    marginLeft: 20,
  },
});