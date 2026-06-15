import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRouter } from "expo-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfilAusfuehrlich } from "../../components/ProfilAusfuehrlich";
import {
  frageText,
  MAX_ANTWORT_LAENGE,
  MAX_FRAGEN,
  PROFIL_FRAGEN,
  type FrageAntwort,
} from "../../data/fragen";
import { HOBBY_KATALOG, hobbyIcon } from "../../data/hobbies";
import { alleModule, DEMO_STUDIENGANG } from "../../data/kurse";

type IconName = keyof typeof Ionicons.glyphMap;

const MAX_BILDER = 10;
const KP_BILDER = 5;
const SICHTBARE_KARTEN_BILDER = 5;

// Layout-Konstanten für die Tab-Bar
const TAB_BAR_HOEHE_BASIS = 65;
const TAB_BAR_ABSTAND_UNTEN_BASIS = 24;
const TAB_BAR_EXTRA_ABSTAND = 20;

const STORAGE_KEY = "profil_v2";

// Gleiches visuelles Grunddesign wie im Personen-Screen.
const STATIC_BACKGROUND = require("../../assets/images/pack8.jpg");

const SCREEN_BG = "#FFFFFF";
const CARD_BG = "rgba(255,255,255,0.12)";
const PHOTO_STRIP_GLASS_BG = "#FFFFFF";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const LINE = "rgba(35, 35, 35, 0.12)";

const MODUL_KATALOG = [
  ...new Set(
    alleModule(DEMO_STUDIENGANG.moduldatenbank).map((modul) => modul.name)
  ),
];

type ProfilData = {
  name: string;
  alter: string;
  studiengang: string;
  uni: string;
  bilder: (string | null)[];
  bio: string;
  hobbies: string[];
  module: string[];
  frageAntworten: FrageAntwort[];
};

const DEFAULT_PROFIL: ProfilData = {
  name: "Dein Name",
  alter: "22",
  studiengang: "Studiengang",
  uni: "Universität",
  bilder: Array(MAX_BILDER).fill(null),
  bio: "",
  hobbies: [],
  module: [],
  frageAntworten: [],
};

function normalisiereProfil(daten: Partial<ProfilData> | null): ProfilData {
  const bilder = Array.isArray(daten?.bilder) ? [...daten.bilder] : [];

  while (bilder.length < MAX_BILDER) {
    bilder.push(null);
  }

  return {
    ...DEFAULT_PROFIL,
    ...(daten ?? {}),
    bilder: bilder.slice(0, MAX_BILDER),
    hobbies: Array.isArray(daten?.hobbies) ? daten.hobbies : [],
    module: Array.isArray(daten?.module) ? daten.module : [],
    frageAntworten: Array.isArray(daten?.frageAntworten)
      ? daten.frageAntworten
      : [],
  };
}

function bereinigeProfil(profil: ProfilData): ProfilData {
  return {
    ...profil,
    bio: profil.bio.trim(),
    frageAntworten: profil.frageAntworten
      .map((fa) => ({
        ...fa,
        antwort: fa.antwort.trim(),
      }))
      .filter((fa) => fa.antwort.length > 0),
  };
}

async function bildAuswaehlen(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Berechtigung benötigt",
      "Bitte erlaube den Zugriff auf deine Fotos."
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets?.[0]?.uri ?? null;
}


function AppHintergrund({ children }: { children?: ReactNode }) {
  return (
    <ImageBackground
      source={STATIC_BACKGROUND}
      resizeMode="cover"
      style={stile.hintergrund}
      imageStyle={stile.hintergrundBild}
    >
      <View pointerEvents="none" style={stile.hintergrundOverlay} />
      {children}
    </ImageBackground>
  );
}

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[stile.bildPlatzhalter, stile.neuSoftInset, { width: size, height: size }]}>
      <Ionicons
        name="person"
        size={size * 0.5}
        color="#C7C7CC"
        style={{ marginTop: size * 0.08 }}
      />
    </View>
  );
}

// ─── Ansicht: Profil-Karte ───────────────────────────────────────────────────

function ProfilAnsicht({ profil }: { profil: ProfilData }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // Dynamische Berechnung des reservierten Raums für die Tab-Bar
  // (Basis-Höhe + Basis-Abstand + unteres Safe-Area-Inset des Geräts)
  const tabBarReserviert =
    TAB_BAR_HOEHE_BASIS + TAB_BAR_ABSTAND_UNTEN_BASIS + insets.bottom;

  // ANPASSUNG: Dynamische Berechnung der verfügbaren Höhe für die Karte
  const verfuegbar = height - headerHeight - tabBarReserviert;

  const seitenPadding = 16;
  const spaltenGap = 14;
  const trennerBreite = StyleSheet.hairlineWidth;
  const innenBreite = width - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.34;
  const glasBreite = seitenPadding + bildSpalteBreite + spaltenGap;
  const infoSpalteBreite =
    innenBreite - bildSpalteBreite - spaltenGap * 2 - trennerBreite;

  const bildAbstand = 8;
  const bildKanteNachHoehe =
    (verfuegbar -
      32 -
      bildAbstand * (SICHTBARE_KARTEN_BILDER - 1)) /
    SICHTBARE_KARTEN_BILDER;

  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);
  const bildAbstandDynamisch = Math.max(
    bildAbstand,
    (verfuegbar -
      32 -
      bildKante * SICHTBARE_KARTEN_BILDER) /
      (SICHTBARE_KARTEN_BILDER - 1)
  );

  return (
    <View style={[stile.karteAussen, { width, height: verfuegbar }]}>
      <View style={[stile.karteSchatten, { width, height: verfuegbar }]}>
        <View style={stile.karteClip}>
          <View pointerEvents="none" style={[stile.glasPanel, { width: glasBreite }]} />

          <View
            style={[
              stile.zeile,
              {
                paddingHorizontal: seitenPadding,
                gap: spaltenGap,
              },
            ]}
          >
            <View
              style={{
                width: bildSpalteBreite,
                gap: bildAbstandDynamisch,
                alignItems: "center",
              }}
            >
          {profil.bilder.slice(0, SICHTBARE_KARTEN_BILDER).map((bild, i) =>
            bild ? (
              <View
                key={i}
                style={[stile.bildRahmen, stile.neuSoft, { width: bildKante, height: bildKante }]}
              >
                <Image source={{ uri: bild }} style={stile.bild} />
              </View>
            ) : (
              <View
                key={i}
                style={[stile.bildRahmen, stile.neuSoft, { width: bildKante, height: bildKante }]}
              >
                <BildPlatzhalter size={bildKante} />
              </View>
            )
          )}
            </View>

            <View style={stile.vertikalerTrenner} />

            <View style={[stile.infoSpalte, { width: infoSpalteBreite }]}>
          <Text style={stile.nameText} numberOfLines={1}>
            {profil.name}
          </Text>
          <Text style={stile.alterText}>{profil.alter} Jahre</Text>

          <View style={stile.trenner} />

          <InfoZeile label="Bio" wert={profil.bio || "—"} />
          <InfoZeile label="Uni" wert={profil.uni} />
          <InfoZeile label="Studiengang" wert={profil.studiengang} />
          <TagZeile label="Module" items={profil.module} />
              <TagZeile label="Hobbies" items={profil.hobbies} mitIcons />
            </View>
          </View>
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

function TagZeile({
  label,
  items,
  mitIcons = false,
}: {
  label: string;
  items: string[];
  mitIcons?: boolean;
}) {
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>

      {items.length > 0 ? (
        <View style={stile.tagReihe}>
          {items.map((item) => (
            <View key={item} style={[stile.tag, stile.neuSoft]}>
              {mitIcons && (
                <Ionicons
                  name={hobbyIcon(item) as IconName}
                  size={12}
                  color={TEXT}
                  style={{ marginRight: 4 }}
                />
              )}
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
  profil: startProfil,
  onChange: onAenderung,
}: {
  profil: ProfilData;
  onChange: (profil: ProfilData) => void;
}) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets(); // ANPASSUNG: Insets hier benötigt

  const [profil, setProfil] = useState(startProfil);
  const [frageAuswahlOffen, setFrageAuswahlOffen] = useState(false);
  const [hobbyAuswahlOffen, setHobbyAuswahlOffen] = useState(false);
  const [hobbySuche, setHobbySuche] = useState("");
  const [modulAuswahlOffen, setModulAuswahlOffen] = useState(false);
  const [modulSuche, setModulSuche] = useState("");

  const onChange = useCallback(
    (neu: ProfilData) => {
      setProfil(neu);
      onAenderung(neu);
    },
    [onAenderung]
  );

  const bildWaehlen = useCallback(
    async (index: number) => {
      const uri = await bildAuswaehlen();

      if (!uri) {
        return;
      }

      const neueBilder = [...profil.bilder];
      neueBilder[index] = uri;

      onChange({
        ...profil,
        bilder: neueBilder,
      });
    },
    [onChange, profil]
  );

  const bildEntfernen = useCallback(
    (index: number) => {
      const neueBilder = [...profil.bilder];
      neueBilder[index] = null;

      onChange({
        ...profil,
        bilder: neueBilder,
      });
    },
    [onChange, profil]
  );

  const hobbyHinzufuegen = useCallback(
    (name: string) => {
      if (profil.hobbies.includes(name)) {
        return;
      }

      onChange({
        ...profil,
        hobbies: [...profil.hobbies, name],
      });
    },
    [onChange, profil]
  );

  const hobbyEntfernen = useCallback(
    (index: number) => {
      onChange({
        ...profil,
        hobbies: profil.hobbies.filter((_, i) => i !== index),
      });
    },
    [onChange, profil]
  );

  const modulHinzufuegen = useCallback(
    (name: string) => {
      if (profil.module.includes(name)) {
        return;
      }

      onChange({
        ...profil,
        module: [...profil.module, name],
      });
    },
    [onChange, profil]
  );

  const modulEntfernen = useCallback(
    (index: number) => {
      onChange({
        ...profil,
        module: profil.module.filter((_, i) => i !== index),
      });
    },
    [onChange, profil]
  );

  const frageHinzufuegen = useCallback(
    (frageId: string) => {
      const frageExistiertSchon = profil.frageAntworten.some(
        (fa) => fa.frageId === frageId
      );

      if (profil.frageAntworten.length >= MAX_FRAGEN || frageExistiertSchon) {
        return;
      }

      onChange({
        ...profil,
        frageAntworten: [
          ...profil.frageAntworten,
          {
            frageId,
            antwort: "",
          },
        ],
      });

      setFrageAuswahlOffen(false);
    },
    [onChange, profil]
  );

  const frageEntfernen = useCallback(
    (frageId: string) => {
      onChange({
        ...profil,
        frageAntworten: profil.frageAntworten.filter(
          (fa) => fa.frageId !== frageId
        ),
      });
    },
    [onChange, profil]
  );

  const antwortAendern = useCallback(
    (frageId: string, text: string) => {
      onChange({
        ...profil,
        frageAntworten: profil.frageAntworten.map((fa) =>
          fa.frageId === frageId
            ? {
                ...fa,
                antwort: text,
              }
            : fa
        ),
      });
    },
    [onChange, profil]
  );

  const frageVerschieben = useCallback(
    (index: number, delta: -1 | 1) => {
      const ziel = index + delta;

      if (ziel < 0 || ziel >= profil.frageAntworten.length) {
        return;
      }

      const neu = [...profil.frageAntworten];
      [neu[index], neu[ziel]] = [neu[ziel], neu[index]];

      onChange({
        ...profil,
        frageAntworten: neu,
      });
    },
    [onChange, profil]
  );

  const verfuegbareHobbies = useMemo(() => {
    const suche = hobbySuche.trim().toLowerCase();

    return HOBBY_KATALOG.filter(
      (hobby) =>
        !profil.hobbies.includes(hobby.name) &&
        hobby.name.toLowerCase().includes(suche)
    );
  }, [hobbySuche, profil.hobbies]);

  const verfuegbareModule = useMemo(() => {
    const suche = modulSuche.trim().toLowerCase();

    return MODUL_KATALOG.filter(
      (modul) =>
        !profil.module.includes(modul) && modul.toLowerCase().includes(suche)
    );
  }, [modulSuche, profil.module]);

  const verfuegbareFragen = useMemo(() => {
    return PROFIL_FRAGEN.filter(
      (frage) =>
        !profil.frageAntworten.some((fa) => fa.frageId === frage.id)
    );
  }, [profil.frageAntworten]);

  // ANPASSUNG: Dynamische Berechnung des unteren Abstands für das ScrollView
  const unteresPadding =
    TAB_BAR_HOEHE_BASIS +
    TAB_BAR_ABSTAND_UNTEN_BASIS +
    insets.bottom +
    TAB_BAR_EXTRA_ABSTAND;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={stile.editContainer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          // ANPASSUNG: Padding Top nutzt Safe-Area Insets nicht direkt,
          // da KeyboardAvoidingView dies für uns handhabt.
          paddingTop: 12,
          paddingBottom: unteresPadding,
        }}
      >
        <Text style={stile.editSektionTitel}>Bilder</Text>

        {[profil.bilder.slice(0, KP_BILDER), profil.bilder.slice(KP_BILDER)].map(
          (reihe, reihenIndex) => (
            <View
              key={reihenIndex}
              style={[
                stile.bildReihe,
                reihenIndex > 0 && {
                  marginTop: 10,
                },
              ]}
            >
              {reihe.map((bild, bildIndex) => {
                const index = reihenIndex * KP_BILDER + bildIndex;

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={stile.bildSlot}
                    onPress={() => bildWaehlen(index)}
                    onLongPress={() => bild && bildEntfernen(index)}
                  >
                    {bild ? (
                      <>
                        <Image
                          source={{ uri: bild }}
                          style={stile.bildSlotBild}
                        />
                        <View style={stile.bildLoeschenBadge}>
                          <Ionicons name="close" size={10} color="#fff" />
                        </View>
                      </>
                    ) : (
                      <View style={stile.bildSlotLeer}>
                        <Ionicons name="add" size={22} color="#8E8E93" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}

        <Text style={stile.editHinweis}>
          Tippen zum Ändern · Halten zum Entfernen · Reihe 1 erscheint auf
          deiner Karte
        </Text>

        <Text style={stile.editSektionTitel}>Bio</Text>
        <View style={stile.editSektion}>
          <TextInput
            style={stile.bioInput}
            value={profil.bio}
            onChangeText={(text) =>
              onChange({
                ...profil,
                bio: text,
              })
            }
            placeholder="Schreib etwas über dich…"
            placeholderTextColor="#aaa"
            multiline
            maxLength={200}
          />
          <Text style={stile.zeichenZaehler}>{profil.bio.length}/200</Text>
        </View>

        <Text style={stile.editSektionTitel}>
          Fragen über dich ({profil.frageAntworten.length}/{MAX_FRAGEN})
        </Text>

        <View style={stile.editSektion}>
          {profil.frageAntworten.map((fa, index) => (
            <View
              key={fa.frageId}
              style={[
                stile.frageKarte,
                index > 0 && {
                  marginTop: 12,
                },
              ]}
            >
              <View style={stile.frageKopfZeile}>
                <Text style={stile.frageKopfText}>
                  {frageText(fa.frageId)}
                </Text>

                <View style={stile.frageAktionen}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => frageVerschieben(index, -1)}
                    disabled={index === 0}
                    style={{
                      opacity: index === 0 ? 0.25 : 1,
                    }}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={18}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => frageVerschieben(index, 1)}
                    disabled={index === profil.frageAntworten.length - 1}
                    style={{
                      opacity:
                        index === profil.frageAntworten.length - 1 ? 0.25 : 1,
                    }}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => frageEntfernen(fa.frageId)}
                  >
                    <Ionicons name="close" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={stile.antwortInput}
                value={fa.antwort}
                onChangeText={(text) => antwortAendern(fa.frageId, text)}
                placeholder="Deine Antwort…"
                placeholderTextColor="#aaa"
                multiline
                maxLength={MAX_ANTWORT_LAENGE}
              />

              <Text style={stile.zeichenZaehler}>
                {fa.antwort.length}/{MAX_ANTWORT_LAENGE}
              </Text>
            </View>
          ))}

          {profil.frageAntworten.length < MAX_FRAGEN && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                stile.frageHinzufuegenKnopf,
                profil.frageAntworten.length > 0 && {
                  marginTop: 12,
                },
              ]}
              onPress={() => setFrageAuswahlOffen((offen) => !offen)}
            >
              <Ionicons
                name={frageAuswahlOffen ? "chevron-up" : "add"}
                size={18}
                color="#007AFF"
              />
              <Text style={stile.frageHinzufuegenText}>
                {frageAuswahlOffen
                  ? "Auswahl schließen"
                  : "Frage hinzufügen"}
              </Text>
            </TouchableOpacity>
          )}

          {frageAuswahlOffen &&
            verfuegbareFragen.map((frage) => (
              <TouchableOpacity
                key={frage.id}
                activeOpacity={0.7}
                style={stile.frageAuswahlZeile}
                onPress={() => frageHinzufuegen(frage.id)}
              >
                <Text style={stile.frageAuswahlText}>{frage.text}</Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text style={stile.editSektionTitel}>Hobbies</Text>

        <View style={stile.editSektion}>
          {profil.hobbies.length > 0 && (
            <View style={stile.tagReiheEdit}>
              {profil.hobbies.map((hobby, index) => (
                <TouchableOpacity
                  key={hobby}
                  activeOpacity={0.7}
                  style={stile.tagEdit}
                  onPress={() => hobbyEntfernen(index)}
                >
                  <Ionicons
                    name={hobbyIcon(hobby) as IconName}
                    size={13}
                    color={TEXT}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={stile.tagEditText}>{hobby}</Text>
                  <Ionicons
                    name="close"
                    size={12}
                    color="#666"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={stile.frageHinzufuegenKnopf}
            onPress={() => setHobbyAuswahlOffen((offen) => !offen)}
          >
            <Ionicons
              name={hobbyAuswahlOffen ? "chevron-up" : "add"}
              size={18}
              color="#007AFF"
            />
            <Text style={stile.frageHinzufuegenText}>
              {hobbyAuswahlOffen
                ? "Auswahl schließen"
                : "Hobby hinzufügen"}
            </Text>
          </TouchableOpacity>

          {hobbyAuswahlOffen && (
            <>
              <TextInput
                style={stile.sucheInput}
                value={hobbySuche}
                onChangeText={setHobbySuche}
                placeholder="Suchen…"
                placeholderTextColor="#aaa"
                autoCorrect={false}
              />

              <View style={stile.tagReiheEdit}>
                {verfuegbareHobbies.map((hobby) => (
                  <TouchableOpacity
                    key={hobby.name}
                    activeOpacity={0.7}
                    style={stile.tagAuswahl}
                    onPress={() => hobbyHinzufuegen(hobby.name)}
                  >
                    <Ionicons
                      name={hobby.icon as IconName}
                      size={13}
                      color={TEXT}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={stile.tagEditText}>{hobby.name}</Text>
                  </TouchableOpacity>
                ))}

                {verfuegbareHobbies.length === 0 && (
                  <Text style={stile.keineTreffer}>Keine Treffer.</Text>
                )}
              </View>
            </>
          )}
        </View>

        <Text style={stile.editSektionTitel}>Module</Text>

        <View style={stile.editSektion}>
          {profil.module.length > 0 && (
            <View style={stile.tagReiheEdit}>
              {profil.module.map((modul, index) => (
                <TouchableOpacity
                  key={modul}
                  activeOpacity={0.7}
                  style={stile.tagEdit}
                  onPress={() => modulEntfernen(index)}
                >
                  <Text style={stile.tagEditText}>{modul}</Text>
                  <Ionicons
                    name="close"
                    size={12}
                    color="#666"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={stile.frageHinzufuegenKnopf}
            onPress={() => setModulAuswahlOffen((offen) => !offen)}
          >
            <Ionicons
              name={modulAuswahlOffen ? "chevron-up" : "add"}
              size={18}
              color="#007AFF"
            />
            <Text style={stile.frageHinzufuegenText}>
              {modulAuswahlOffen
                ? "Auswahl schließen"
                : "Modul hinzufügen"}
            </Text>
          </TouchableOpacity>

          {modulAuswahlOffen && (
            <>
              <TextInput
                style={stile.sucheInput}
                value={modulSuche}
                onChangeText={setModulSuche}
                placeholder="Moduldatenbank durchsuchen…"
                placeholderTextColor="#aaa"
                autoCorrect={false}
              />

              <View style={stile.tagReiheEdit}>
                {verfuegbareModule.map((modul) => (
                  <TouchableOpacity
                    key={modul}
                    activeOpacity={0.7}
                    style={stile.tagAuswahl}
                    onPress={() => modulHinzufuegen(modul)}
                  >
                    <Text style={stile.tagEditText}>{modul}</Text>
                  </TouchableOpacity>
                ))}

                {verfuegbareModule.length === 0 && (
                  <Text style={stile.keineTreffer}>Keine Treffer.</Text>
                )}
              </View>
            </>
          )}
        </View>

        <Text style={stile.editSektionTitel}>Nicht änderbar</Text>

        <View style={stile.editSektion}>
          {[
            {
              label: "Name",
              wert: profil.name,
            },
            {
              label: "Alter",
              wert: `${profil.alter} Jahre`,
            },
            {
              label: "Uni",
              wert: profil.uni,
            },
            {
              label: "Studiengang",
              wert: profil.studiengang,
            },
          ].map(({ label, wert }, index, array) => (
            <View
              key={label}
              style={[
                stile.readonlyZeile,
                index < array.length - 1 && stile.readonlyTrenner,
              ]}
            >
              <Text style={stile.readonlyLabel}>{label}</Text>
              <Text style={stile.readonlyWert}>{wert}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [profil, setProfil] = useState<ProfilData>(DEFAULT_PROFIL);
  const [editModus, setEditModus] = useState(false);
  const [seite, setSeite] = useState(0);
  const [pagerAktiv, setPagerAktiv] = useState(true);

  const editProfilRef = useRef<ProfilData>(DEFAULT_PROFIL);

  // Dynamische Berechnung des reservierten Raums für die Tab-Bar
  // (wird für die Pager Dots Positionierung benötigt)
  const tabBarReserviert =
    TAB_BAR_HOEHE_BASIS + TAB_BAR_ABSTAND_UNTEN_BASIS + insets.bottom;

  useEffect(() => {
    let istAktiv = true;

    async function profilLaden() {
      try {
        const gespeichert = await AsyncStorage.getItem(STORAGE_KEY);

        if (!istAktiv || !gespeichert) {
          return;
        }

        const parsed = JSON.parse(gespeichert) as Partial<ProfilData>;
        const geladen = normalisiereProfil(parsed);

        setProfil(geladen);
        editProfilRef.current = geladen;
      } catch {
        Alert.alert(
          "Profil konnte nicht geladen werden",
          "Deine gespeicherten Profildaten konnten nicht gelesen werden."
        );
      }
    }

    profilLaden();

    return () => {
      istAktiv = false;
    };
  }, []);

  const onProfilAenderung = useCallback((neuesProfil: ProfilData) => {
    editProfilRef.current = neuesProfil;
  }, []);

  const speichernUndEditModusWechseln = useCallback(async () => {
    if (editModus) {
      const bereinigt = bereinigeProfil(editProfilRef.current);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bereinigt));
        editProfilRef.current = bereinigt;
        setProfil(bereinigt);
      } catch {
        Alert.alert(
          "Speichern fehlgeschlagen",
          "Dein Profil konnte gerade nicht gespeichert werden."
        );
        return;
      }
    } else {
      editProfilRef.current = profil;
    }

    setEditModus((aktiv) => !aktiv);
  }, [editModus, profil]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/settings")}
          style={stile.headerLinksButton}
        >
          <Ionicons name="settings-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={speichernUndEditModusWechseln}
          style={stile.headerRechtsButton}
        >
          <Ionicons
            name={editModus ? "checkmark" : "pencil"}
            size={editModus ? 22 : 20}
            color="#007AFF"
          />
        </TouchableOpacity>
      ),
    });
  }, [editModus, navigation, router, speichernUndEditModusWechseln]);

  if (editModus) {
    return (
      <ProfilBearbeiten
        profil={editProfilRef.current}
        onChange={onProfilAenderung}
      />
    );
  }

  return (
    <AppHintergrund>
      <ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={pagerAktiv}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
        }}
        onMomentumScrollEnd={(event) => {
          const neueSeite = Math.round(
            event.nativeEvent.contentOffset.x / width
          );

          setSeite(neueSeite);
        }}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <ProfilAnsicht profil={profil} />
        </View>

        <View style={{ width }}>
          <ProfilAusfuehrlich
            profil={{
              name: profil.name,
              alter: profil.alter,
              bilder: profil.bilder,
              kurzbeschreibung: profil.bio,
              uni: profil.uni,
              studiengang: profil.studiengang,
              module: profil.module,
              hobbies: profil.hobbies,
              frageAntworten: profil.frageAntworten,
            }}
            breite={width}
            onCarouselTouch={(aktiv) => setPagerAktiv(!aktiv)}
          />
        </View>
      </ScrollView>

      <View
        style={[
          stile.pagerDots,
          {
            // ANPASSUNG: Positionierung der Dots orientiert sich an der
            // reservierten Tab-Bar Höhe.
            bottom: tabBarReserviert + 10,
          },
        ]}
        pointerEvents="none"
      >
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[
              stile.pagerDot,
              index === seite && stile.pagerDotAktiv,
            ]}
          />
        ))}
      </View>
    </AppHintergrund>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stile = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  hintergrundBild: {
    opacity: 1,
  },
  hintergrundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },

  headerLinksButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerLinksText: {
    color: "#007AFF",
    fontSize: 16,
  },
  headerRechtsButton: {
    marginRight: 4,
    padding: 8,
  },

  karteAussen: {
    alignItems: "center",
    justifyContent: "center",
  },
  karteSchatten: {
    borderRadius: 0,
    backgroundColor: CARD_BG,
    elevation: 0,
  },
  karteClip: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  glasPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: PHOTO_STRIP_GLASS_BG,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.66)",
    shadowColor: "#9BA6B5",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    zIndex: 2,
  },
  neuSoft: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.5,
    shadowRadius: 7,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
  },
  neuSoftInset: {
    shadowColor: "#BFC5CC",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 2,
  },
  zeile: {
    flexDirection: "row",
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 3,
  },
  vertikalerTrenner: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    alignSelf: "stretch",
  },
  bildRahmen: {
    backgroundColor: "rgba(255,255,255,0.36)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.64)",
  },
  bild: {
    width: "100%",
    height: "100%",
  },
  bildPlatzhalter: {
    backgroundColor: "rgba(245,245,245,0.50)",
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
    color: TEXT,
    letterSpacing: -0.5,
  },
  alterText: {
    fontSize: 15,
    color: MUTED,
    marginTop: 2,
    fontWeight: "500",
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: 10,
  },
  infoZeile: {
    marginBottom: 45,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoWert: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 19,
  },

  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)",
  },
  tagText: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "500",
  },

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
  },
  bildSlotBild: {
    width: "100%",
    height: "100%",
  },
  bildSlotLeer: {
    flex: 1,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  bildLoeschenBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editHinweis: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 2,
  },

  bioInput: {
    fontSize: 15,
    color: TEXT,
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 21,
  },
  zeichenZaehler: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 4,
  },

  frageKarte: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 12,
  },
  frageKopfZeile: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  frageKopfText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
    lineHeight: 18,
  },
  frageAktionen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  antwortInput: {
    fontSize: 15,
    color: TEXT,
    minHeight: 44,
    textAlignVertical: "top",
    lineHeight: 21,
    marginTop: 8,
  },
  frageHinzufuegenKnopf: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  frageHinzufuegenText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },
  frageAuswahlZeile: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
  },
  frageAuswahlText: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 19,
  },

  sucheInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: TEXT,
    marginBottom: 10,
  },
  tagReiheEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tagEdit: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagAuswahl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagEditText: {
    fontSize: 13,
    color: TEXT,
  },
  keineTreffer: {
    fontSize: 13,
    color: MUTED,
    paddingVertical: 4,
  },

  pagerDots: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  pagerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D1D1D6",
  },
  pagerDotAktiv: {
    backgroundColor: "#007AFF",
  },

  readonlyZeile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
  },
  readonlyTrenner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  readonlyLabel: {
    fontSize: 15,
    color: TEXT,
  },
  readonlyWert: {
    fontSize: 15,
    color: MUTED,
    maxWidth: "60%",
    textAlign: "right",
  },
});