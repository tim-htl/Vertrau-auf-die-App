import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendeVorschlag } from "../api/chats";
import { uploadBild } from "../api/storage";
import { ApiError } from "../lib/api";

// Maske für "Eigenes Treffen vorschlagen" in einem 1:1-Chat.
// Layout angelehnt an aktivitaet/neu, aber OHNE Beschreibung, Dauer,
// maxPlaetze, Teilnehmer einladen — diese Felder ergeben für ein
// 2-Personen-Treffen keinen Sinn.

type Koordinaten = { latitude: number; longitude: number };
type Adresse = {
  strasse: string;
  plzOrt: string;
  koordinaten: Koordinaten;
};

function BilderBereich({
  bilder,
  onAdd,
  onRemove,
}: {
  bilder: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const hoehe = 280;
  const [index, setIndex] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const neu = Math.round(e.nativeEvent.contentOffset.x / width);
    if (neu !== index) setIndex(neu);
  }

  if (bilder.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.bilderLeer, { height: hoehe }]}
        onPress={onAdd}
        activeOpacity={0.7}
      >
        <Ionicons name="image-outline" size={44} color="#b0b0b8" />
        <Text style={styles.bilderLeerText}>Bilder hinzufügen</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ height: hoehe }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {bilder.map((url, i) => (
          <View key={i} style={{ width, height: hoehe }}>
            <Image source={{ uri: url }} style={{ width, height: hoehe }} resizeMode="cover" />
            <TouchableOpacity
              style={styles.bildEntfernen}
              onPress={() => onRemove(i)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.bildPlusUnten} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={styles.dotsReihe}>
        {bilder.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotAktiv]} />
        ))}
      </View>
    </View>
  );
}

function formatDatum(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatUhrzeit(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function VorschlagErstellenScreen() {
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bilder, setBilder] = useState<string[]>([]);
  const [titel, setTitel] = useState("");
  const [strasse, setStrasse] = useState("");
  const [hausnummer, setHausnummer] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [adresseValidiert, setAdresseValidiert] = useState<Adresse | null>(null);
  const [adressePruefung, setAdressePruefung] = useState(false);
  const [adresseFehler, setAdresseFehler] = useState<string | null>(null);

  const [datum, setDatum] = useState<Date | null>(null);
  const [uhrzeit, setUhrzeit] = useState<Date | null>(null);
  const [datumOffen, setDatumOffen] = useState(false);
  const [uhrzeitOffen, setUhrzeitOffen] = useState(false);

  const [sendend, setSendend] = useState(false);

  async function bilderWaehlen() {
    const erlaubnis = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!erlaubnis.granted) {
      Alert.alert(
        "Zugriff erforderlich",
        "Bitte erlaube den Zugriff auf deine Fotos, um Bilder hinzuzufügen."
      );
      return;
    }
    const ergebnis = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (ergebnis.canceled) return;
    setBilder((b) => [...b, ...ergebnis.assets.map((a) => a.uri)]);
  }

  function bildEntfernen(index: number) {
    setBilder((b) => b.filter((_, i) => i !== index));
  }

  const adresseVollstaendig =
    !!strasse.trim() && !!hausnummer.trim() && !!plz.trim() && !!ort.trim();

  async function adressePruefen() {
    if (!adresseVollstaendig) {
      setAdresseFehler("Bitte fülle alle Adressfelder aus.");
      setAdresseValidiert(null);
      return;
    }
    const query = `${strasse.trim()} ${hausnummer.trim()}, ${plz.trim()} ${ort.trim()}`;
    setAdressePruefung(true);
    setAdresseFehler(null);
    try {
      const treffer = await Location.geocodeAsync(query);
      if (!treffer || treffer.length === 0) {
        setAdresseFehler("Keine gültige Adresse gefunden.");
        setAdresseValidiert(null);
        return;
      }
      const erste = treffer[0];
      setAdresseValidiert({
        strasse: `${strasse.trim()} ${hausnummer.trim()}`,
        plzOrt: `${plz.trim()} ${ort.trim()}`,
        koordinaten: { latitude: erste.latitude, longitude: erste.longitude },
      });
    } catch {
      setAdresseFehler("Adresse konnte nicht geprüft werden.");
      setAdresseValidiert(null);
    } finally {
      setAdressePruefung(false);
    }
  }

  function resetAdresseValidierung() {
    if (adresseValidiert) setAdresseValidiert(null);
  }

  function toggleDatum() {
    if (uhrzeitOffen) setUhrzeitOffen(false);
    if (!datumOffen && datum === null) setDatum(new Date());
    setDatumOffen((v) => !v);
  }

  function toggleUhrzeit() {
    if (datumOffen) setDatumOffen(false);
    if (!uhrzeitOffen && uhrzeit === null) setUhrzeit(new Date());
    setUhrzeitOffen((v) => !v);
  }

  function onDatumChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setDatumOffen(false);
      if (selected) setDatum(selected);
      return;
    }
    if (selected) setDatum(selected);
  }

  function onUhrzeitChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setUhrzeitOffen(false);
      if (selected) setUhrzeit(selected);
      return;
    }
    if (selected) setUhrzeit(selected);
  }

  const darfSenden =
    !!chatId &&
    !!titel.trim() &&
    bilder.length > 0 &&
    !!adresseValidiert &&
    !!datum &&
    !!uhrzeit &&
    !sendend;

  async function vorschlagen() {
    if (!darfSenden || !chatId || !adresseValidiert || !datum || !uhrzeit) return;
    setSendend(true);
    try {
      // Datum + Uhrzeit zu einem Startzeitpunkt kombinieren.
      const start = new Date(datum);
      start.setHours(uhrzeit.getHours(), uhrzeit.getMinutes(), 0, 0);

      // Eigene Fotos in den privaten chat-media-Bucket hochladen → Pfade.
      // Das Backend signiert sie beim Lesen (GET /chats/:id/messages).
      const pfade = await Promise.all(
        bilder.map((b) =>
          b.startsWith("http")
            ? Promise.resolve(b)
            : uploadBild(b, "chat-media", { chatId })
        )
      );

      await sendeVorschlag(chatId, {
        titel: titel.trim(),
        startAt: start.toISOString(),
        customAdresseStrasse: adresseValidiert.strasse,
        customAdressePlzOrt: adresseValidiert.plzOrt,
        customKoordinatenLat: adresseValidiert.koordinaten.latitude,
        customKoordinatenLng: adresseValidiert.koordinaten.longitude,
        bilder: pfade,
      });
      // Gezielt zurück zum konkreten Chat — egal über wie viele Zwischenscreens
      // und egal, woher der Chat geöffnet wurde (Chat-Tab oder Personen-Profil).
      router.dismissTo({ pathname: "/chat/[id]", params: { id: chatId } });
    } catch (e) {
      console.warn("[vorschlag-erstellen] fehlgeschlagen:", e);
      Alert.alert(
        "Vorschlagen fehlgeschlagen",
        e instanceof ApiError ? e.message : "Bitte später erneut versuchen."
      );
    } finally {
      setSendend(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Eigenes Treffen vorschlagen" }} />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <BilderBereich
            bilder={bilder}
            onAdd={bilderWaehlen}
            onRemove={bildEntfernen}
          />

          <View style={styles.textBlock}>
            <TextInput
              style={styles.titelEingabe}
              placeholder="Titel hinzufügen"
              placeholderTextColor="#b0b0b8"
              value={titel}
              onChangeText={setTitel}
              maxLength={60}
            />
          </View>

          {/* Adresse */}
          <View style={styles.feldBlock}>
            <Text style={styles.feldLabel}>Adresse</Text>
            <View style={styles.adresseReihe}>
              <TextInput
                style={[styles.adresseEingabe, styles.adresseStrasse]}
                value={strasse}
                onChangeText={(t) => {
                  setStrasse(t);
                  resetAdresseValidierung();
                }}
                placeholder="Straße"
                placeholderTextColor="#b0b0b8"
                returnKeyType="next"
              />
              <TextInput
                style={[styles.adresseEingabe, styles.adresseHausnummer]}
                value={hausnummer}
                onChangeText={(t) => {
                  setHausnummer(t);
                  resetAdresseValidierung();
                }}
                placeholder="Nr."
                placeholderTextColor="#b0b0b8"
                returnKeyType="next"
              />
            </View>
            <View style={styles.adresseReihe}>
              <TextInput
                style={[styles.adresseEingabe, styles.adressePlz]}
                value={plz}
                onChangeText={(t) => {
                  setPlz(t.replace(/[^0-9]/g, ""));
                  resetAdresseValidierung();
                }}
                placeholder="PLZ"
                placeholderTextColor="#b0b0b8"
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.adresseEingabe, styles.adresseOrt]}
                value={ort}
                onChangeText={(t) => {
                  setOrt(t);
                  resetAdresseValidierung();
                }}
                placeholder="Ort"
                placeholderTextColor="#b0b0b8"
                returnKeyType="done"
                onSubmitEditing={adressePruefen}
              />
            </View>
            <TouchableOpacity
              style={styles.adressePruefenButton}
              onPress={adressePruefen}
              disabled={adressePruefung || !adresseVollstaendig}
              activeOpacity={0.7}
            >
              {adressePruefung ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.adressePruefenText}>
                  {adresseValidiert ? "Erneut prüfen" : "Adresse prüfen"}
                </Text>
              )}
            </TouchableOpacity>
            {adresseFehler && (
              <Text style={styles.adresseFehlerText}>{adresseFehler}</Text>
            )}
            {adresseValidiert && (
              <View style={styles.adresseOkBlock}>
                <Ionicons name="checkmark-circle" size={16} color="#1f8f4f" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.adresseOkZeile}>{adresseValidiert.strasse}</Text>
                  {!!adresseValidiert.plzOrt && (
                    <Text style={styles.adresseOkZeile}>{adresseValidiert.plzOrt}</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Karte */}
          {adresseValidiert && (
            <View style={styles.karteWrapper}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                initialRegion={{
                  latitude: adresseValidiert.koordinaten.latitude,
                  longitude: adresseValidiert.koordinaten.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                }}
                region={{
                  latitude: adresseValidiert.koordinaten.latitude,
                  longitude: adresseValidiert.koordinaten.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                }}
              >
                <Marker coordinate={adresseValidiert.koordinaten} />
              </MapView>
            </View>
          )}

          {/* Datum */}
          <TouchableOpacity style={styles.feldBlock} onPress={toggleDatum} activeOpacity={0.7}>
            <Text style={styles.feldLabel}>Datum</Text>
            <View style={styles.feldWert}>
              <Text
                style={[
                  styles.feldWertText,
                  !datum && styles.feldWertTextPlaceholder,
                  datumOffen && styles.feldWertTextAktiv,
                ]}
              >
                {datum ? formatDatum(datum) : "Datum hinzufügen"}
              </Text>
              <Ionicons
                name={datumOffen ? "chevron-down" : "chevron-forward"}
                size={18}
                color={datumOffen ? "#007AFF" : "#b0b0b8"}
              />
            </View>
          </TouchableOpacity>
          {datumOffen && (
            <View style={styles.pickerInline}>
              <DateTimePicker
                value={datum ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                locale="de-DE"
                onChange={onDatumChange}
                themeVariant="light"
              />
            </View>
          )}

          {/* Uhrzeit */}
          <TouchableOpacity style={styles.feldBlock} onPress={toggleUhrzeit} activeOpacity={0.7}>
            <Text style={styles.feldLabel}>Uhrzeit</Text>
            <View style={styles.feldWert}>
              <Text
                style={[
                  styles.feldWertText,
                  !uhrzeit && styles.feldWertTextPlaceholder,
                  uhrzeitOffen && styles.feldWertTextAktiv,
                ]}
              >
                {uhrzeit ? formatUhrzeit(uhrzeit) : "Uhrzeit hinzufügen"}
              </Text>
              <Ionicons
                name={uhrzeitOffen ? "chevron-down" : "chevron-forward"}
                size={18}
                color={uhrzeitOffen ? "#007AFF" : "#b0b0b8"}
              />
            </View>
          </TouchableOpacity>
          {uhrzeitOffen && (
            <View style={styles.pickerInline}>
              <DateTimePicker
                value={uhrzeit ?? new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                locale="de-DE"
                is24Hour
                onChange={onUhrzeitChange}
                themeVariant="light"
              />
            </View>
          )}

          <View style={styles.aktionWrapper}>
            <TouchableOpacity
              style={[
                styles.erstellenButton,
                !darfSenden && styles.erstellenButtonDisabled,
              ]}
              onPress={vorschlagen}
              disabled={!darfSenden}
              activeOpacity={0.85}
            >
              {sendend ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.erstellenText}>Vorschlagen</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Styles (1:1 aus aktivitaet/neu, minus den nicht genutzten Klassen) ───────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  bilderLeer: {
    backgroundColor: "#f2f2f7",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bilderLeerText: { fontSize: 15, color: "#888", fontWeight: "500" },
  bildEntfernen: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  bildPlusUnten: {
    position: "absolute",
    bottom: 30,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  dotsReihe: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.55)" },
  dotAktiv: { backgroundColor: "#fff", width: 9, height: 9, borderRadius: 5 },
  textBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  titelEingabe: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingVertical: 4,
  },
  feldBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
  },
  feldLabel: { fontSize: 13, fontWeight: "600", color: "#6b6b70", marginBottom: 6 },
  feldWert: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feldWertText: { fontSize: 16, color: "#1a1a1a" },
  feldWertTextPlaceholder: { color: "#b0b0b8" },
  feldWertTextAktiv: { color: "#007AFF", fontWeight: "600" },
  adresseReihe: { flexDirection: "row", gap: 10, marginTop: 4 },
  adresseEingabe: {
    fontSize: 16,
    color: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d0d0d5",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  adresseStrasse: { flex: 3 },
  adresseHausnummer: { flex: 1 },
  adressePlz: { flex: 1 },
  adresseOrt: { flex: 3 },
  adressePruefenButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eaf3ff",
    borderRadius: 14,
  },
  adressePruefenText: { fontSize: 13, fontWeight: "600", color: "#007AFF" },
  adresseFehlerText: { marginTop: 6, fontSize: 13, color: "#c0392b" },
  adresseOkBlock: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: 8 },
  adresseOkZeile: { fontSize: 14, color: "#1a1a1a" },
  karteWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e5ea",
  },
  pickerInline: {
    backgroundColor: "#f7f7f9",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
    alignItems: "center",
    paddingVertical: 4,
  },
  aktionWrapper: { paddingHorizontal: 20, paddingTop: 24, alignItems: "center" },
  erstellenButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 22,
    minWidth: 180,
    alignItems: "center",
  },
  erstellenButtonDisabled: { backgroundColor: "#c0d8f7" },
  erstellenText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
