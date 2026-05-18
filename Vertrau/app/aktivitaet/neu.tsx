import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { type Aktivitaet, type Teilnehmer } from "../../data/aktivitaeten";
import { INITIAL_CHATS } from "../../data/chats";
import { DEMO_STUDIENGANG } from "../../data/kurse";
import { DEMO_LOCATIONS } from "../../data/locations";
import { ladeErstellerAlsTeilnehmer } from "../../data/meinProfil";
import {
  erstelleAktivitaet,
  ladeUserChats,
  sendeAktivitaetsVorschlag,
} from "../../data/userAktivitaeten";
import { erstelleLerngruppe } from "../../data/userLerngruppen";

type Koordinaten = { latitude: number; longitude: number };

type Adresse = {
  strasse: string;
  plzOrt: string;
  koordinaten: Koordinaten;
};

type EinladbarerKontakt = {
  id: string;
  name: string;
  bild: string | null;
  personId?: string;
};

// ─── Bilder-Slideshow mit "+" am Ende ─────────────────────────────────────────

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
            <Image
              source={{ uri: url }}
              style={{ width, height: hoehe }}
              resizeMode="cover"
            />
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

      <TouchableOpacity
        style={styles.bildPlusUnten}
        onPress={onAdd}
        activeOpacity={0.85}
      >
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

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

// Adresse aus DEMO_LOCATIONS in strasse/hausnummer/plz/ort aufsplitten.
function parseStrasseHausnummer(input: string): {
  strasse: string;
  hausnummer: string;
} {
  const match = input.match(/^(.+?)\s+(\d+\w*)$/);
  if (match) return { strasse: match[1].trim(), hausnummer: match[2] };
  return { strasse: input, hausnummer: "" };
}

function parsePlzOrt(input: string): { plz: string; ort: string } {
  const match = input.match(/^(\d{4,5})\s+(.+)$/);
  if (match) return { plz: match[1], ort: match[2] };
  return { plz: "", ort: input };
}

export default function AktivitaetNeuScreen() {
  const { kursId, locationId } = useLocalSearchParams<{
    kursId?: string;
    locationId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kurs = DEMO_STUDIENGANG.meineKurse.find((k) => k.id === kursId);
  const istLerngruppe = !!kurs;
  const vorgewaehlteLocation = locationId
    ? DEMO_LOCATIONS.find((l) => l.id === locationId)
    : undefined;

  const [bilder, setBilder] = useState<string[]>(
    vorgewaehlteLocation ? [vorgewaehlteLocation.coverbild, ...vorgewaehlteLocation.bilder] : []
  );
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const initStrasseHausnummer = vorgewaehlteLocation
    ? parseStrasseHausnummer(vorgewaehlteLocation.adresse.strasse)
    : { strasse: "", hausnummer: "" };
  const initPlzOrt = vorgewaehlteLocation
    ? parsePlzOrt(vorgewaehlteLocation.adresse.plzOrt)
    : { plz: "", ort: "" };
  const [strasse, setStrasse] = useState(initStrasseHausnummer.strasse);
  const [hausnummer, setHausnummer] = useState(initStrasseHausnummer.hausnummer);
  const [plz, setPlz] = useState(initPlzOrt.plz);
  const [ort, setOrt] = useState(initPlzOrt.ort);
  // Wenn Adresse aus Location kam, sofort als validiert markieren – Koordinaten
  // sind im Katalog bereits hinterlegt, kein Geocoding nötig.
  const [adresseValidiert, setAdresseValidiert] = useState<Adresse | null>(
    vorgewaehlteLocation
      ? {
          strasse: vorgewaehlteLocation.adresse.strasse,
          plzOrt: vorgewaehlteLocation.adresse.plzOrt,
          koordinaten: vorgewaehlteLocation.koordinaten,
        }
      : null
  );
  const [adressePruefung, setAdressePruefung] = useState(false);
  const [adresseFehler, setAdresseFehler] = useState<string | null>(null);

  const [datum, setDatum] = useState<Date | null>(null);
  const [uhrzeit, setUhrzeit] = useState<Date | null>(null);
  const [datumOffen, setDatumOffen] = useState(false);
  const [uhrzeitOffen, setUhrzeitOffen] = useState(false);

  const [maxPlaetze, setMaxPlaetze] = useState("8");
  const [einladungsOffen, setEinladungsOffen] = useState(false);
  const [eingeladen, setEingeladen] = useState<string[]>([]);

  const [sendend, setSendend] = useState(false);

  const [einladbareKontakte, setEinladbareKontakte] = useState<
    EinladbarerKontakt[]
  >([]);

  // Einladbare Kontakte = Personen-Chats. Bei Lerngruppen ergänzen wir
  // zusätzlich alle Teilnehmer des ausgewählten Kurses.
  useEffect(() => {
    let abgebrochen = false;
    (async () => {
      const userChats = await ladeUserChats();
      const alleChats = [...INITIAL_CHATS, ...userChats];
      const personenAusChats: EinladbarerKontakt[] = alleChats
        .filter((c) => c.linkType === "person")
        .map((c) => ({
          id: `chat:${c.id}`,
          name: c.name,
          bild: c.image,
          personId: c.linkId,
        }));

      const kontakteMap = new Map<string, EinladbarerKontakt>();
      for (const kontakt of personenAusChats) {
        const key = kontakt.personId
          ? `person:${kontakt.personId}`
          : `name:${kontakt.name.toLowerCase()}`;
        if (!kontakteMap.has(key)) kontakteMap.set(key, kontakt);
      }

      if (istLerngruppe) {
        const kursTeilnehmer =
          DEMO_STUDIENGANG.meineKurse.find((k) => k.id === kursId)?.teilnehmer ??
          [];
        for (const teilnehmer of kursTeilnehmer) {
          const key = teilnehmer.personId
            ? `person:${teilnehmer.personId}`
            : `name:${teilnehmer.name.toLowerCase()}`;
          if (!kontakteMap.has(key)) {
            kontakteMap.set(key, {
              id: `kurs:${kursId}:${teilnehmer.id}`,
              name: teilnehmer.name,
              bild: teilnehmer.bild,
              personId: teilnehmer.personId,
            });
          }
        }
      }

      const sortiert = [...kontakteMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "de-DE")
      );
      if (!abgebrochen) setEinladbareKontakte(sortiert);
    })();
    return () => {
      abgebrochen = true;
    };
  }, [istLerngruppe, kursId]);

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
    const neueUris = ergebnis.assets.map((a) => a.uri);
    setBilder((b) => [...b, ...neueUris]);
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
        koordinaten: {
          latitude: erste.latitude,
          longitude: erste.longitude,
        },
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

  function toggleEingeladen(personenChatId: string) {
    setEingeladen((arr) =>
      arr.includes(personenChatId)
        ? arr.filter((x) => x !== personenChatId)
        : [...arr, personenChatId]
    );
  }

  const maxPlaetzeZahl = useMemo(() => {
    const z = parseInt(maxPlaetze, 10);
    return Number.isFinite(z) && z > 0 ? z : 0;
  }, [maxPlaetze]);

  const darfErstellen =
    !!titel.trim() &&
    !!beschreibung.trim() &&
    bilder.length > 0 &&
    !!adresseValidiert &&
    !!datum &&
    !!uhrzeit &&
    maxPlaetzeZahl > 0 &&
    !sendend;

  async function erstellen() {
    if (!darfErstellen || !adresseValidiert || !datum || !uhrzeit) return;
    setSendend(true);
    try {
      const ersteller = await ladeErstellerAlsTeilnehmer();
      const eingeladeneTeilnehmer: Teilnehmer[] = eingeladen
        .map((kontaktId) => {
          const kontakt = einladbareKontakte.find((k) => k.id === kontaktId);
          if (!kontakt) return null;
          return {
            id: `t_${kontakt.id}`,
            name: kontakt.name,
            bild: kontakt.bild,
          };
        })
        .filter((x): x is Teilnehmer => x !== null);

      const id = `u_${Date.now()}`;
      const basisDaten: Omit<Aktivitaet, "id"> = {
        titel: titel.trim(),
        ort: adresseValidiert.plzOrt || adresseValidiert.strasse,
        beschreibung: beschreibung.trim(),
        hintergrundbild: bilder[0],
        bilder,
        adresse: {
          strasse: adresseValidiert.strasse,
          plzOrt: adresseValidiert.plzOrt,
        },
        koordinaten: adresseValidiert.koordinaten,
        datum: formatDatum(datum),
        uhrzeit: formatUhrzeit(uhrzeit),
        maxPlaetze: maxPlaetzeZahl,
        teilnehmer: [ersteller, ...eingeladeneTeilnehmer],
      };

      if (istLerngruppe && kursId) {
        await erstelleLerngruppe({
          id,
          kursId,
          ...basisDaten,
        });
      } else {
        await erstelleAktivitaet({
          id,
          ...basisDaten,
        });

        // Eingeladene aus Personen-Chats bekommen einen Treffensvorschlag.
        const personenChatIds = eingeladen
          .map((kontaktId) => {
            const kontakt = einladbareKontakte.find((k) => k.id === kontaktId);
            if (!kontakt) return null;
            return kontakt.id.startsWith("chat:")
              ? kontakt.id.slice("chat:".length)
              : null;
          })
          .filter((x): x is string => x !== null);

        await Promise.all(
          personenChatIds.map((chatId) =>
            sendeAktivitaetsVorschlag(chatId, {
              coverbild: bilder[0],
              aktivitaetId: id,
              aktivitaet: titel.trim(),
              datum: formatDatum(datum),
              uhrzeit: formatUhrzeit(uhrzeit),
              status: "pending",
            })
          )
        );
      }
      router.back();
    } finally {
      setSendend(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: istLerngruppe ? "Lerngruppe erstellen" : "Treffen erstellen",
        }}
      />

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
        {/* Bilder */}
        <BilderBereich
          bilder={bilder}
          onAdd={bilderWaehlen}
          onRemove={bildEntfernen}
        />

        {/* Titel */}
        <View style={styles.textBlock}>
          <TextInput
            style={styles.titelEingabe}
            placeholder="Titel hinzufügen"
            placeholderTextColor="#b0b0b8"
            value={titel}
            onChangeText={setTitel}
            maxLength={60}
          />
          <TextInput
            style={styles.beschreibungEingabe}
            placeholder="Beschreibung hinzufügen"
            placeholderTextColor="#b0b0b8"
            value={beschreibung}
            onChangeText={setBeschreibung}
            multiline
          />
        </View>

        {/* Teilnehmer einladen */}
        <TouchableOpacity
          style={styles.sektionKopf}
          onPress={() => setEinladungsOffen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.sektionKopfLinks}>
            <Ionicons name="people" size={18} color="#1a1a1a" />
            <Text style={styles.sektionTitel}>
              Teilnehmer einladen
              {eingeladen.length > 0 ? ` (${eingeladen.length})` : ""}
            </Text>
          </View>
          <Ionicons
            name={einladungsOffen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#888"
          />
        </TouchableOpacity>

        {einladungsOffen && (
          <View style={styles.einladungsListe}>
            {einladbareKontakte.length === 0 && (
              <Text style={styles.einladungsLeer}>
                Keine Kontakte vorhanden.
              </Text>
            )}
            {einladbareKontakte.map((k) => {
              const gewaehlt = eingeladen.includes(k.id);
              return (
                <TouchableOpacity
                  key={k.id}
                  style={styles.einladungsZeile}
                  onPress={() => toggleEingeladen(k.id)}
                  activeOpacity={0.7}
                >
                  {k.bild ? (
                    <Image
                      source={{ uri: k.bild }}
                      style={styles.einladungsAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.einladungsAvatar,
                        styles.einladungsAvatarPlatzhalter,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={22}
                        color="#fff"
                        style={{ marginTop: 4 }}
                      />
                    </View>
                  )}
                  <Text style={styles.einladungsName}>{k.name}</Text>
                  <View
                    style={[
                      styles.check,
                      gewaehlt && styles.checkAktiv,
                    ]}
                  >
                    {gewaehlt && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Max. Plätze */}
        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Maximale Teilnehmerzahl</Text>
          <View style={styles.feldWert}>
            <TextInput
              style={styles.plaetzeEingabe}
              value={maxPlaetze}
              onChangeText={(t) => setMaxPlaetze(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="z.B. 8"
              placeholderTextColor="#b0b0b8"
              maxLength={3}
            />
          </View>
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
                <Text style={styles.adresseOkZeile}>
                  {adresseValidiert.strasse}
                </Text>
                {!!adresseValidiert.plzOrt && (
                  <Text style={styles.adresseOkZeile}>
                    {adresseValidiert.plzOrt}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Karte (nur nach Validierung) */}
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

        {/* Erstellen */}
        <View style={styles.aktionWrapper}>
          <TouchableOpacity
            style={[
              styles.erstellenButton,
              !darfErstellen && styles.erstellenButtonDisabled,
            ]}
            onPress={erstellen}
            disabled={!darfErstellen}
            activeOpacity={0.85}
          >
            {sendend ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.erstellenText}>Erstellen</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bilderLeer: {
    backgroundColor: "#f2f2f7",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bilderLeerText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
  },
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
  titelEingabe: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingVertical: 4,
  },
  beschreibungEingabe: {
    fontSize: 15,
    color: "#1a1a1a",
    lineHeight: 21,
    marginTop: 4,
    paddingVertical: 4,
    minHeight: 60,
    textAlignVertical: "top",
  },
  sektionKopf: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
  },
  sektionKopfLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sektionTitel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  einladungsListe: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  einladungsLeer: {
    fontSize: 13,
    color: "#888",
    paddingVertical: 6,
  },
  einladungsZeile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  einladungsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e5ea",
  },
  einladungsAvatarPlatzhalter: {
    backgroundColor: "#b0b0b8",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  einladungsName: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#c7c7cc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkAktiv: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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
    marginBottom: 6,
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
    color: "#b0b0b8",
  },
  feldWertTextAktiv: {
    color: "#007AFF",
    fontWeight: "600",
  },
  plaetzeEingabe: {
    fontSize: 16,
    color: "#1a1a1a",
    paddingVertical: 2,
    flex: 1,
  },
  adresseReihe: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
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
  adresseStrasse: {
    flex: 3,
  },
  adresseHausnummer: {
    flex: 1,
  },
  adressePlz: {
    flex: 1,
  },
  adresseOrt: {
    flex: 3,
  },
  adressePruefenButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eaf3ff",
    borderRadius: 14,
  },
  adressePruefenText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  adresseFehlerText: {
    marginTop: 6,
    fontSize: 13,
    color: "#c0392b",
  },
  adresseOkBlock: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    marginTop: 8,
  },
  adresseOkZeile: {
    fontSize: 14,
    color: "#1a1a1a",
  },
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
  aktionWrapper: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },
  erstellenButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 22,
    minWidth: 180,
    alignItems: "center",
  },
  erstellenButtonDisabled: {
    backgroundColor: "#c0d8f7",
  },
  erstellenText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
