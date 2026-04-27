import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image"; // 🔥 Optimierung: expo-image für Caching und Performance

// ─── Typen & Standardwerte ────────────────────────────────────────────────────

type ProfilData = {
  // Nicht bearbeitbar
  name: string;
  alter: string;
  studiengang: string;
  uni: string;
  // Bearbeitbar
  bilder: (string | null)[];
  bio: string;
  hobbies: string[];
  module: string[];
};

const DEFAULT_PROFIL: ProfilData = {
  name: "Dein Name",
  alter: "22",
  studiengang: "Studiengang",
  uni: "Universität",
  bilder: [null, null, null, null, null],
  bio: "",
  hobbies: [],
  module: [],
};

const STORAGE_KEY = "profil_v2";

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

// ─── Ansicht: Profil-Karte (wie PersonenKarte) ────────────────────────────────

function ProfilAnsicht({ profil }: { profil: ProfilData }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const TAB_BAR = 49;
  const HEADER = 44;
  const verfuegbar = height - insets.top - HEADER - TAB_BAR - insets.bottom;

  const seitenPadding = 16;
  const spaltenGap = 14;
  const innenBreite = width - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.33;
  const infoSpalteBreite = innenBreite - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const bildAbstand = 8;
  const bildKanteNachHoehe =
    (verfuegbar - 32 - bildAbstand * (anzahlBilder - 1)) / anzahlBilder;
  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);

  return (
    <View style={[stile.karte, { width, height: verfuegbar }]}>
      <View style={[stile.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>

        {/* Linke Spalte: Fotostreifen */}
        <View style={{ width: bildSpalteBreite, gap: bildAbstand, alignItems: "center" }}>
          {profil.bilder.slice(0, anzahlBilder).map((bild, i) =>
            bild ? (
              <Image
                key={i}
                source={{ uri: bild }}
                style={{ width: bildKante, height: bildKante, borderRadius: 14 }}
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View
                key={i}
                style={{ width: bildKante, height: bildKante, borderRadius: 14, overflow: "hidden" }}
              >
                <View style={[stile.bildPlatzhalter, { width: bildKante, height: bildKante }]}>
                  <Ionicons name="person" size={bildKante * 0.5} color="#fff" style={{ marginTop: bildKante * 0.08 }} />
                </View>
              </View>
            )
          )}
        </View>

        {/* Rechte Spalte: Infos */}
        <View style={[stile.infoSpalte, { width: infoSpalteBreite }]}>
          <Text style={stile.nameText} numberOfLines={1}>{profil.name}</Text>
          <Text style={stile.alterText}>{profil.alter} Jahre</Text>
          <View style={stile.trenner} />
          <InfoZeile label="Bio" wert={profil.bio || "—"} />
          <InfoZeile label="Uni" wert={profil.uni} />
          <InfoZeile label="Studiengang" wert={profil.studiengang} />
          <TagZeile label="Module" items={profil.module} />
          <TagZeile label="Hobbies" items={profil.hobbies} />
        </View>
      </View>
    </View>
  );
}

function InfoZeile({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>
      <Text style={stile.infoWert}>{wert || "—"}</Text>
    </View>
  );
}

function TagZeile({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>
      {items.length > 0 ? (
        <View style={stile.tagReihe}>
          {items.map((item, i) => (
            <View key={i} style={stile.tag}>
              <Text style={stile.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={stile.infoWert}>—</Text>
      )}
    </View>
  );
}

// ─── Bearbeitungs-Modus ───────────────────────────────────────────────────────

function ProfilBearbeiten({
  profil,
  onChange,
}: {
  profil: ProfilData;
  onChange: (p: ProfilData) => void;
}) {
  const [neuesHobby, setNeuesHobby] = useState("");
  const [neuesModul, setNeuesModul] = useState("");

  async function bildWaehlen(index: number) {
    const uri = await bildAuswaehlen();
    if (uri) {
      const neueBilder = [...profil.bilder];
      neueBilder[index] = uri;
      onChange({ ...profil, bilder: neueBilder });
    }
  }

  function bildEntfernen(index: number) {
    const neueBilder = [...profil.bilder];
    neueBilder[index] = null;
    onChange({ ...profil, bilder: neueBilder });
  }

  function hobbyHinzufuegen() {
    const text = neuesHobby.trim();
    if (!text) return;
    onChange({ ...profil, hobbies: [...profil.hobbies, text] });
    setNeuesHobby("");
  }

  function hobbyEntfernen(i: number) {
    onChange({ ...profil, hobbies: profil.hobbies.filter((_, idx) => idx !== i) });
  }

  function modulHinzufuegen() {
    const text = neuesModul.trim();
    if (!text) return;
    onChange({ ...profil, module: [...profil.module, text] });
    setNeuesModul("");
  }

  function modulEntfernen(i: number) {
    onChange({ ...profil, module: profil.module.filter((_, idx) => idx !== i) });
  }

  return (
    // 🔥 Optimierung: Tastatur schließt sich, wenn man außerhalb tippt
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={stile.editContainer} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* Bilder */}
          <Text style={stile.editSektionTitel}>Bilder</Text>
          <View style={stile.bildReihe}>
            {profil.bilder.map((bild, i) => (
              <TouchableOpacity
                key={i}
                style={stile.bildSlot}
                onPress={() => bildWaehlen(i)}
                onLongPress={() => bild && bildEntfernen(i)}
                activeOpacity={0.7}
              >
                {bild ? (
                  <>
                    <Image source={{ uri: bild }} style={stile.bildSlotBild} cachePolicy="memory-disk" />
                    <View style={stile.bildLoeschenBadge}>
                      <Ionicons name="close" size={10} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={stile.bildSlotLeer}>
                    <Ionicons name="add" size={24} color="#8E8E93" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={stile.editHinweis}>Tippen zum Ändern · Gedrückt halten zum Entfernen</Text>

          {/* Bio */}
          <Text style={stile.editSektionTitel}>Bio</Text>
          <View style={stile.editSektion}>
            <TextInput
              style={stile.bioInput}
              value={profil.bio}
              onChangeText={(t) => onChange({ ...profil, bio: t })}
              placeholder="Schreib etwas über dich…"
              placeholderTextColor="#aaa"
              multiline
              maxLength={200}
            />
            <Text style={stile.zeichenZaehler}>{profil.bio.length}/200</Text>
          </View>

          {/* Hobbies */}
          <Text style={stile.editSektionTitel}>Hobbies</Text>
          <View style={stile.editSektion}>
            <View style={stile.tagReiheEdit}>
              {profil.hobbies.map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={stile.tagEdit}
                  onPress={() => hobbyEntfernen(i)}
                >
                  <Text style={stile.tagEditText}>{h}</Text>
                  <Ionicons name="close" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={stile.hinzufuegenZeile}>
              <TextInput
                style={stile.tagInput}
                value={neuesHobby}
                onChangeText={setNeuesHobby}
                placeholder="Hobby hinzufügen…"
                placeholderTextColor="#aaa"
                onSubmitEditing={hobbyHinzufuegen}
                returnKeyType="done"
              />
              <TouchableOpacity style={stile.hinzufuegenButton} onPress={hobbyHinzufuegen}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Module */}
          <Text style={stile.editSektionTitel}>Module</Text>
          <View style={stile.editSektion}>
            <View style={stile.tagReiheEdit}>
              {profil.module.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={stile.tagEdit}
                  onPress={() => modulEntfernen(i)}
                >
                  <Text style={stile.tagEditText}>{m}</Text>
                  <Ionicons name="close" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={stile.hinzufuegenZeile}>
              <TextInput
                style={stile.tagInput}
                value={neuesModul}
                onChangeText={setNeuesModul}
                placeholder="Modul hinzufügen…"
                placeholderTextColor="#aaa"
                onSubmitEditing={modulHinzufuegen}
                returnKeyType="done"
              />
              <TouchableOpacity style={stile.hinzufuegenButton} onPress={modulHinzufuegen}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nicht bearbeitbare Felder (Info) */}
          <Text style={stile.editSektionTitel}>Nicht änderbar</Text>
          <View style={stile.editSektion}>
            {[
              { label: "Name", wert: profil.name },
              { label: "Alter", wert: `${profil.alter} Jahre` },
              { label: "Uni", wert: profil.uni },
              { label: "Studiengang", wert: profil.studiengang },
            ].map(({ label, wert }, i, arr) => (
              <View
                key={label}
                style={[stile.readonlyZeile, i < arr.length - 1 && stile.readonlyTrenner]}
              >
                <Text style={stile.readonlyLabel}>{label}</Text>
                <Text style={stile.readonlyWert}>{wert}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const navigation = useNavigation();
  const [profil, setProfil] = useState<ProfilData>(DEFAULT_PROFIL);
  const [editModus, setEditModus] = useState(false);
  const editProfilRef = useRef<ProfilData>(profil);

  // Profil laden
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        const geladen = JSON.parse(data);
        setProfil(geladen);
        editProfilRef.current = geladen;
      }
    });
  }, []);

  // Header-Button dynamisch setzen
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            if (editModus) {
              // Speichern
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(editProfilRef.current));
              setProfil({ ...editProfilRef.current });
            }
            setEditModus((v) => !v);
          }}
          style={{ marginRight: 16 }} // Etwas mehr Touch-Bereich für den Header-Button
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={editModus ? "checkmark" : "pencil"}
            size={editModus ? 26 : 22} // Icons etwas größer für bessere Bedienbarkeit
            color="#007AFF"
          />
        </TouchableOpacity>
      ),
    });
  }, [editModus, navigation]);

  function onProfilAenderung(neuesDaten: ProfilData) {
    editProfilRef.current = neuesDaten;
  }

  if (editModus) {
    return (
      <ProfilBearbeiten
        profil={editProfilRef.current}
        onChange={onProfilAenderung}
      />
    );
  }

  return <ProfilAnsicht profil={profil} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stile = StyleSheet.create({
  // Profil-Ansicht
  karte: {
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  zeile: {
    flexDirection: "row",
    flex: 1,
    paddingBottom: 16,
  },
  bildPlatzhalter: {
    backgroundColor: "#C7C7CC",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  infoSpalte: {
    flex: 1,
    paddingTop: 4,
  },
  nameText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  alterText: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 2,
    fontWeight: "500",
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5ea",
    marginVertical: 10,
  },
  infoZeile: {
    marginBottom: 20, // Besserer Abstand zwischen den Infos
  },
  infoLabel: {
    fontSize: 12, // Etwas lesbarer
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoWert: {
    fontSize: 15,
    color: "#1a1a1a",
    lineHeight: 20,
  },
  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  // Bearbeitungs-Modus
  editContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  editSektionTitel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6D6D72",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 7,
    marginHorizontal: 20,
  },
  editSektion: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Bilder
  bildReihe: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  bildSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E5EA", // Base background color
  },
  bildSlotBild: {
    width: "100%",
    height: "100%",
  },
  bildSlotLeer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bildLoeschenBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  editHinweis: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  // Bio
  bioInput: {
    fontSize: 16, // Größere Schrift für Formulare auf iOS
    color: "#1a1a1a",
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  zeichenZaehler: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 4,
  },

  // Tag-Bearbeitung
  tagReiheEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagEdit: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E5EA", // Etwas dunkleres Grau für den Editier-Modus
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagEditText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  hinzufuegenZeile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    paddingVertical: 6,
  },
  hinzufuegenButton: {
    padding: 4,
  },

  // Nicht bearbeitbare Felder
  readonlyZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  readonlyTrenner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  readonlyLabel: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  readonlyWert: {
    fontSize: 16,
    color: "#8E8E93",
    maxWidth: "60%",
    textAlign: "right",
  },
});