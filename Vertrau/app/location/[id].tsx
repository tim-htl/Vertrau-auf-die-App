import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Message } from "../../data/chats";
import { DEMO_LOCATIONS } from "../../data/locations";

const STORAGE_PREFIX = "messages_v3_";

// ─── Bilder-Slideshow ─────────────────────────────────────────────────────────

function BilderSlideshow({ bilder }: { bilder: string[] }) {
  const { width } = useWindowDimensions();
  const bildHoehe = 280;
  const [index, setIndex] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const neuerIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (neuerIndex !== index) setIndex(neuerIndex);
  }

  return (
    <View style={{ height: bildHoehe }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {bilder.map((url, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            style={{ width, height: bildHoehe }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <View style={styles.dotsReihe}>
        {bilder.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotAktiv]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Formatierer ──────────────────────────────────────────────────────────────

function formatDatum(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatUhrzeit(d: Date): string {
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Maps-Öffner mit Fallback ─────────────────────────────────────────────────

async function oeffneInKarten(
  latitude: number,
  longitude: number,
  name: string
) {
  const label = encodeURIComponent(name);
  const googleWeb = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // Kandidaten in Reihenfolge der Präferenz
  const kandidaten: string[] =
    Platform.OS === "ios"
      ? [
          `maps://?ll=${latitude},${longitude}&q=${label}`,
          `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`,
          googleWeb,
        ]
      : Platform.OS === "android"
      ? [
          `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
          googleWeb,
        ]
      : [googleWeb];

  for (const url of kandidaten) {
    try {
      const geht = await Linking.canOpenURL(url);
      if (geht) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // weiter mit nächstem Kandidaten
    }
  }
  // Letzter Notnagel: Google-Web trotzdem versuchen
  try {
    await Linking.openURL(googleWeb);
  } catch {
    // ignorieren – es gibt keine sinnvolle Fallback-UI
  }
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function LocationDetailScreen() {
  const { id, chatId } = useLocalSearchParams<{ id: string; chatId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const location = DEMO_LOCATIONS.find((l) => l.id === id);

  const [datum, setDatum] = useState<Date | null>(null);
  const [uhrzeit, setUhrzeit] = useState<Date | null>(null);

  // Pro Feld: ob das Picker-Rad gerade sichtbar ist
  const [datumOffen, setDatumOffen] = useState(false);
  const [uhrzeitOffen, setUhrzeitOffen] = useState(false);

  if (!location) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Location" }} />
        <Text style={styles.leerText}>Location nicht gefunden.</Text>
      </View>
    );
  }

  const darfVorschlagen = datum !== null && uhrzeit !== null && !!chatId;

  // Inline-Picker: beim Öffnen direkt einen Startwert setzen, damit der Spinner
  // nicht "leer" wirkt und der Nutzer direkt drehen kann.
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

  // ── Vorschlag senden ──
  async function vorschlagen() {
    if (!darfVorschlagen || !location || !chatId || !datum || !uhrzeit) return;

    const jetzt = new Date();
    const zeit = `${jetzt.getHours().toString().padStart(2, "0")}:${jetzt
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const neu: Message = {
      id: `msg_${Date.now()}`,
      fromMe: true,
      time: zeit,
      proposal: {
        coverbild: location.coverbild,
        locationId: location.id,
        aktivitaet: location.name,
        datum: formatDatum(datum),
        uhrzeit: formatUhrzeit(uhrzeit),
        status: "pending",
      },
    };

    const key = STORAGE_PREFIX + chatId;
    const gespeichert = await AsyncStorage.getItem(key);
    const bestehend: Message[] = gespeichert ? JSON.parse(gespeichert) : [];
    const aktualisiert = [...bestehend, neu];
    await AsyncStorage.setItem(key, JSON.stringify(aktualisiert));

    // Zurück zum Chat: zwei Ebenen poppen (location → treffen-vorschlagen → chat).
    // Fallback auf einzelnes back(), falls dismiss() in diesem Stack nicht greift.
    try {
      router.dismiss(2);
    } catch {
      router.back();
      setTimeout(() => router.back(), 0);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: location.name }} />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Bilder-Slideshow */}
        <BilderSlideshow bilder={location.bilder} />

        {/* Name + Beschreibung */}
        <View style={styles.textBlock}>
          <Text style={styles.name}>{location.name}</Text>
          <Text style={styles.beschreibung}>{location.beschreibung}</Text>
        </View>

        {/* Adresse */}
        <View style={styles.adresseBlock}>
          <View style={styles.adresseKopf}>
            <Ionicons name="location" size={18} color="#e74c3c" />
            <Text style={styles.adresseTitel}>Adresse</Text>
          </View>
          <Text style={styles.adresseZeile}>{location.adresse.strasse}</Text>
          <Text style={styles.adresseZeile}>{location.adresse.plzOrt}</Text>
        </View>

        {/* Karten-Vorschau (Tap öffnet Apple/Google Maps) */}
        <TouchableOpacity
          style={styles.karteWrapper}
          onPress={() =>
            oeffneInKarten(
              location.koordinaten.latitude,
              location.koordinaten.longitude,
              location.name
            )
          }
          activeOpacity={0.85}
        >
          <MapView
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            initialRegion={{
              latitude: location.koordinaten.latitude,
              longitude: location.koordinaten.longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            }}
          >
            <Marker coordinate={location.koordinaten} title={location.name} />
          </MapView>
          <View style={styles.karteBadge}>
            <Ionicons name="open-outline" size={14} color="#1a1a1a" />
            <Text style={styles.karteBadgeText}>In Karten öffnen</Text>
          </View>
        </TouchableOpacity>

        {/* Datum */}
        <TouchableOpacity
          style={styles.feldBlock}
          onPress={toggleDatum}
          activeOpacity={0.7}
        >
          <Text style={styles.feldLabel}>Datum</Text>
          <View style={styles.feldWert}>
            <Text
              style={[
                styles.feldWertText,
                !datum && styles.feldWertTextPlaceholder,
                datumOffen && styles.feldWertTextAktiv,
              ]}
            >
              {datum ? formatDatum(datum) : "Datum auswählen"}
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
        <TouchableOpacity
          style={styles.feldBlock}
          onPress={toggleUhrzeit}
          activeOpacity={0.7}
        >
          <Text style={styles.feldLabel}>Uhrzeit</Text>
          <View style={styles.feldWert}>
            <Text
              style={[
                styles.feldWertText,
                !uhrzeit && styles.feldWertTextPlaceholder,
                uhrzeitOffen && styles.feldWertTextAktiv,
              ]}
            >
              {uhrzeit ? formatUhrzeit(uhrzeit) : "Uhrzeit auswählen"}
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

        {/* Vorschlagen */}
        <View style={styles.vorschlagenWrapper}>
          <TouchableOpacity
            style={[
              styles.vorschlagenButton,
              !darfVorschlagen && styles.vorschlagenButtonDisabled,
            ]}
            onPress={vorschlagen}
            disabled={!darfVorschlagen}
            activeOpacity={0.85}
          >
            <Text style={styles.vorschlagenText}>Vorschlagen</Text>
          </TouchableOpacity>
          {!chatId && (
            <Text style={styles.hinweisText}>
              Öffne diesen Screen aus einem Chat, um einen Vorschlag zu senden.
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  leerText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
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
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotAktiv: {
    backgroundColor: "#fff",
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  textBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  beschreibung: {
    fontSize: 15,
    color: "#444",
    lineHeight: 21,
  },
  adresseBlock: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  adresseKopf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  adresseTitel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  adresseZeile: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  karteWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e5ea",
  },
  karteBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  karteBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  feldBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
  },
  feldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b6b70",
    marginBottom: 4,
  },
  feldWert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feldWertText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  feldWertTextPlaceholder: {
    color: "#aaa",
  },
  feldWertTextAktiv: {
    color: "#007AFF",
    fontWeight: "600",
  },
  pickerInline: {
    backgroundColor: "#f7f7f9",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
    alignItems: "center",
    paddingVertical: 4,
  },
  vorschlagenWrapper: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },
  vorschlagenButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 22,
  },
  vorschlagenButtonDisabled: {
    backgroundColor: "#c0d8f7",
  },
  vorschlagenText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hinweisText: {
    marginTop: 10,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
