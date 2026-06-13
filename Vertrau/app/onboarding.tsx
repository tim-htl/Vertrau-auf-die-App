import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Autofill } from "../components/Autofill";
import {
  frageText,
  MAX_ANTWORT_LAENGE,
  MAX_FRAGEN,
  PROFIL_FRAGEN,
  type FrageAntwort,
} from "../data/fragen";
import { HOBBY_KATALOG, hobbyIcon } from "../data/hobbies";
import {
  KATALOG_UNIS,
  modulnamenFuerStudiengang,
  studiengaengeFuerUni,
} from "../data/onboarding-katalog";
import { authSync } from "../api/me";
import { signUpWithPassword } from "../lib/supabase";

// ─── Onboarding-Wizard (Mock-first) ───────────────────────────────────────────
//
// Ein Screen, interner Schritt-State. Schritte sind ein Array (SCHRITTE) —
// der reservierte Uni-Mail-Verifikations-Screen (Phase 7) wird später nach
// dem Uni-Schritt eingeschoben, ohne Navigation/Fortschritt umzubauen.
// Datenquelle: data/-Mocks (kein Backend) → läuft auf dem Designer-Branch.
// Ergebnis landet im selben profil_v2-AsyncStorage wie der Profil-Tab.

const STORAGE_KEY = "profil_v2";
const MAX_BILDER = 10;
const KP_BILDER = 5; // Mindestanzahl Fotos (die auf der Kurzansicht)

type Entwurf = {
  name: string;
  alter: string;
  uniId: string | null;
  uniName: string;
  studiengangId: string | null;
  studiengangName: string;
  module: string[];
  hobbies: string[];
  bio: string;
  frageAntworten: FrageAntwort[];
  bilder: (string | null)[];
  // Login-Account, im letzten Schritt eingegeben
  email: string;
  passwort: string;
  passwortWdh: string;
};

const LEER: Entwurf = {
  name: "",
  alter: "",
  uniId: null,
  uniName: "",
  studiengangId: null,
  studiengangName: "",
  module: [],
  hobbies: [],
  bio: "",
  frageAntworten: [],
  bilder: Array(MAX_BILDER).fill(null),
  email: "",
  passwort: "",
  passwortWdh: "",
};

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
  return result.canceled ? null : result.assets[0].uri;
}

// Schritt-Definition: Validität + ob überspringbar. id dient als Key.
type Schritt = {
  id: string;
  titel: string;
  untertitel: string;
  ueberspringbar: boolean;
  fertig: (e: Entwurf) => boolean;
};

const SCHRITTE: Schritt[] = [
  {
    // Platzhalter. Die echte Uni-Mail-Verifikation (Token-Mail an die
    // Uni-Adresse) kommt in Phase 7, sobald der E-Mail-Provider steht.
    // Position ganz vorne ist bewusst gewählt; bis dahin überspringbar.
    id: "unimail",
    titel: "Bestätige deine Uni",
    untertitel: "Mit deiner Uni-Mail bestätigst du, dass du wirklich an deiner Uni bist.",
    ueberspringbar: true,
    fertig: () => true,
  },
  {
    id: "name",
    titel: "Wie heißt du?",
    untertitel: "Name und Alter erscheinen auf deinem Profil.",
    ueberspringbar: false,
    fertig: (e) => e.name.trim().length > 0 && /^\d{1,3}$/.test(e.alter) && +e.alter >= 16 && +e.alter <= 120,
  },
  {
    id: "uni",
    titel: "Wo studierst du?",
    untertitel: "Uni, Studiengang und deine Module.",
    ueberspringbar: false,
    fertig: (e) => !!e.uniId && !!e.studiengangId,
  },
  {
    id: "hobbies",
    titel: "Deine Hobbies",
    untertitel: "Wähle, was zu dir passt — oder überspringe.",
    ueberspringbar: true,
    fertig: () => true,
  },
  {
    id: "bio",
    titel: "Über dich",
    untertitel: "Ein, zwei Sätze über dich. Optional.",
    ueberspringbar: true,
    fertig: () => true,
  },
  {
    id: "fragen",
    titel: "Witzige Fragen",
    untertitel: `Bis zu ${MAX_FRAGEN} Fragen für dein Profil. Optional.`,
    ueberspringbar: true,
    fertig: () => true,
  },
  {
    id: "fotos",
    titel: "Deine Fotos",
    untertitel: `Mindestens ${KP_BILDER} Fotos — sie erscheinen auf deinem Profil.`,
    ueberspringbar: false,
    fertig: (e) => e.bilder.slice(0, KP_BILDER).every((b) => !!b),
  },
  {
    // Letzter Schritt: hier entsteht der Account. Erst nach erfolgreichem
    // signUp existiert eine Session → AuthGate wechselt zu den Tabs.
    id: "account",
    titel: "Erstelle dein Konto",
    untertitel: "Mit E-Mail und Passwort meldest du dich künftig an.",
    ueberspringbar: false,
    fertig: (e) =>
      /\S+@\S+\.\S+/.test(e.email.trim()) &&
      e.passwort.length >= 6 &&
      e.passwort === e.passwortWdh,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [entwurf, setEntwurf] = useState<Entwurf>(LEER);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const schritt = SCHRITTE[index];
  const istLetzter = index === SCHRITTE.length - 1;
  const darfWeiter = schritt.fertig(entwurf);

  function set(teil: Partial<Entwurf>) {
    setEntwurf((e) => ({ ...e, ...teil }));
  }

  function zurueck() {
    if (index === 0) router.back();
    else setIndex((i) => i - 1);
  }

  function weiter() {
    if (istLetzter) {
      abschliessen();
      return;
    }
    setIndex((i) => i + 1);
  }

  async function abschliessen() {
    if (laedt) return;
    setFehler(null);
    setLaedt(true);
    try {
      // Profil lokal speichern (Mock), BEVOR die Session entsteht — sonst
      // zeigt der Profil-Tab beim automatischen Wechsel zu den Tabs kurz
      // nichts. Selbes Format wie der Profil-Tab (profil_v2).
      const profil = {
        name: entwurf.name.trim(),
        alter: entwurf.alter,
        studiengang: entwurf.studiengangName,
        uni: entwurf.uniName,
        bilder: entwurf.bilder,
        bio: entwurf.bio.trim(),
        hobbies: entwurf.hobbies,
        module: entwurf.module,
        frageAntworten: entwurf.frageAntworten
          .map((fa) => ({ ...fa, antwort: fa.antwort.trim() }))
          .filter((fa) => fa.antwort.length > 0),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profil));

      // Account anlegen → Session entsteht → AuthGate wechselt zu den Tabs.
      const session = await signUpWithPassword(entwurf.email.trim(), entwurf.passwort);
      if (!session) {
        // "Confirm email" aktiv (Production): noch keine Session. Profil
        // bleibt lokal, der Nutzer bestätigt erst seine Mail.
        Alert.alert(
          "Fast geschafft",
          "Wir haben dir eine Bestätigungs-E-Mail geschickt. Danach kannst du dich anmelden."
        );
        router.replace("/(auth)/login");
        return;
      }
      // Profil im Backend anlegen (idempotent, Fehler non-blocking).
      try {
        await authSync(entwurf.name.trim());
      } catch {
        // Backend nicht erreichbar — Konto ist erstellt, Profil wird beim
        // nächsten erfolgreichen Request gesynct.
      }
      // Session ist da → Guard rendert die Tabs, kein manuelles Navigieren.
    } catch (e) {
      setFehler(
        e instanceof Error ? e.message : "Konto konnte nicht erstellt werden."
      );
      setLaedt(false);
    }
  }

  return (
    <View style={[stile.container, { paddingTop: insets.top }]}>
      {/* Kopf: Zurück + Fortschrittsbalken */}
      <View style={stile.kopf}>
        <TouchableOpacity onPress={zurueck} style={stile.zurueckKnopf} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={stile.fortschrittSpur}>
          <View
            style={[stile.fortschrittBalken, { width: `${((index + 1) / SCHRITTE.length) * 100}%` }]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 20}
      >
        <ScrollView
          contentContainerStyle={stile.inhalt}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={stile.titel}>{schritt.titel}</Text>
          <Text style={stile.untertitel}>{schritt.untertitel}</Text>

          {schritt.id === "unimail" && <SchrittUniMail />}
          {schritt.id === "name" && <SchrittName entwurf={entwurf} set={set} />}
          {schritt.id === "uni" && <SchrittUni entwurf={entwurf} set={set} />}
          {schritt.id === "hobbies" && <SchrittHobbies entwurf={entwurf} set={set} />}
          {schritt.id === "bio" && <SchrittBio entwurf={entwurf} set={set} />}
          {schritt.id === "fragen" && <SchrittFragen entwurf={entwurf} set={set} />}
          {schritt.id === "fotos" && <SchrittFotos entwurf={entwurf} set={set} />}
          {schritt.id === "account" && <SchrittAccount entwurf={entwurf} set={set} fehler={fehler} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fuß: Überspringen + Weiter */}
      <View style={[stile.fuss, { paddingBottom: insets.bottom + 12 }]}>
        {schritt.ueberspringbar && (
          <TouchableOpacity onPress={weiter} style={stile.ueberspringen}>
            <Text style={stile.ueberspringenText}>Überspringen</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[stile.weiterKnopf, (!darfWeiter || laedt) && stile.weiterKnopfInaktiv]}
          onPress={weiter}
          disabled={!darfWeiter || laedt}
        >
          {laedt ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={stile.weiterText}>{istLetzter ? "Konto erstellen" : "Weiter"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Schritt 0: Uni-Mail-Verifikation (Platzhalter, Phase 7) ──────────────────

function SchrittUniMail() {
  // Reines Platzhalter-Feld (Mock): noch keine echte Verifikation. Der Wert
  // wird bewusst NICHT ins Profil übernommen — die Uni-Mail dient später
  // ausschließlich der Verifikation, nicht der Anzeige.
  const [uniMail, setUniMail] = useState("");

  return (
    <View style={stile.feldGruppe}>
      <View style={stile.platzhalterHinweis}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
        <Text style={stile.platzhalterHinweisText}>
          Die Uni-Mail-Verifikation wird in einer späteren Version aktiv. Du
          kannst diesen Schritt vorerst überspringen.
        </Text>
      </View>

      <Text style={[stile.feldLabel, { marginTop: 22 }]}>Uni-Mail-Adresse</Text>
      <TextInput
        style={stile.textFeld}
        value={uniMail}
        onChangeText={setUniMail}
        placeholder="vorname.nachname@tu-berlin.de"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
    </View>
  );
}

// ─── Schritt 1: Name + Alter ──────────────────────────────────────────────────

function SchrittName({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  return (
    <View style={stile.feldGruppe}>
      <Text style={stile.feldLabel}>Name</Text>
      <TextInput
        style={stile.textFeld}
        value={entwurf.name}
        onChangeText={(t) => set({ name: t })}
        placeholder="Dein Name"
        placeholderTextColor="#aaa"
      />
      <Text style={[stile.feldLabel, { marginTop: 20 }]}>Alter</Text>
      <TextInput
        style={stile.textFeld}
        value={entwurf.alter}
        onChangeText={(t) => set({ alter: t.replace(/[^0-9]/g, "").slice(0, 3) })}
        placeholder="z. B. 22"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
      />
    </View>
  );
}

// ─── Schritt 2: Uni → Studiengang → Module ────────────────────────────────────

function SchrittUni({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  const studiengaenge = entwurf.uniId ? studiengaengeFuerUni(entwurf.uniId) : [];
  const module = entwurf.uniId && entwurf.studiengangId
    ? modulnamenFuerStudiengang(entwurf.uniId, entwurf.studiengangId)
    : [];

  function uniWaehlen(name: string) {
    const uni = KATALOG_UNIS.find((u) => u.name === name);
    if (!uni) return;
    // Uni-Wechsel setzt Studiengang + Module zurück
    set({ uniId: uni.id, uniName: uni.name, studiengangId: null, studiengangName: "", module: [] });
  }

  function studiengangWaehlen(name: string) {
    const sg = studiengaenge.find((s) => s.name === name);
    if (!sg) return;
    set({ studiengangId: sg.id, studiengangName: sg.name, module: [] });
  }

  return (
    <View style={stile.feldGruppe}>
      {/* Uni */}
      <Text style={stile.feldLabel}>Universität</Text>
      {entwurf.uniId ? (
        <GewaehltChip
          text={entwurf.uniName}
          onEntfernen={() =>
            set({ uniId: null, uniName: "", studiengangId: null, studiengangName: "", module: [] })
          }
        />
      ) : (
        <Autofill
          optionen={KATALOG_UNIS.map((u) => u.name)}
          onWaehlen={uniWaehlen}
          placeholder="Uni suchen…"
        />
      )}

      {/* Studiengang — erst nach Uni-Wahl */}
      {entwurf.uniId && (
        <>
          <Text style={[stile.feldLabel, { marginTop: 22 }]}>Studiengang</Text>
          {entwurf.studiengangId ? (
            <GewaehltChip
              text={entwurf.studiengangName}
              onEntfernen={() => set({ studiengangId: null, studiengangName: "", module: [] })}
            />
          ) : (
            <Autofill
              optionen={studiengaenge.map((s) => s.name)}
              onWaehlen={studiengangWaehlen}
              placeholder="Studiengang suchen…"
            />
          )}
        </>
      )}

      {/* Module — erst nach Studiengang-Wahl, mehrfach */}
      {entwurf.studiengangId && (
        <>
          <Text style={[stile.feldLabel, { marginTop: 22 }]}>
            Module <Text style={stile.optional}>(optional)</Text>
          </Text>
          {entwurf.module.length > 0 && (
            <View style={stile.chipReihe}>
              {entwurf.module.map((m) => (
                <ChipEntfernbar
                  key={m}
                  text={m}
                  onEntfernen={() => set({ module: entwurf.module.filter((x) => x !== m) })}
                />
              ))}
            </View>
          )}
          <Autofill
            optionen={module}
            onWaehlen={(m) => set({ module: [...entwurf.module, m] })}
            ausschliessen={entwurf.module}
            placeholder="Modul suchen…"
          />
        </>
      )}
    </View>
  );
}

// ─── Schritt 4: Hobbies (Autofill + Grid) ─────────────────────────────────────

function SchrittHobbies({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  function umschalten(name: string) {
    set({
      hobbies: entwurf.hobbies.includes(name)
        ? entwurf.hobbies.filter((h) => h !== name)
        : [...entwurf.hobbies, name],
    });
  }

  return (
    <View style={stile.feldGruppe}>
      {entwurf.hobbies.length > 0 && (
        <View style={[stile.chipReihe, { marginBottom: 14 }]}>
          {entwurf.hobbies.map((h) => (
            <ChipEntfernbar key={h} text={h} icon={hobbyIcon(h)} onEntfernen={() => umschalten(h)} />
          ))}
        </View>
      )}

      <Autofill
        optionen={HOBBY_KATALOG.map((h) => h.name)}
        onWaehlen={umschalten}
        ausschliessen={entwurf.hobbies}
        placeholder="Hobby suchen…"
      />

      {/* Grid mit allen Hobbies (≥3 Spalten via flexWrap) */}
      <View style={stile.hobbyGrid}>
        {HOBBY_KATALOG.map((h) => {
          const aktiv = entwurf.hobbies.includes(h.name);
          return (
            <TouchableOpacity
              key={h.name}
              style={[stile.hobbyKachel, aktiv && stile.hobbyKachelAktiv]}
              onPress={() => umschalten(h.name)}
            >
              <Ionicons name={h.icon} size={15} color={aktiv ? "#fff" : "#1a1a1a"} />
              <Text style={[stile.hobbyKachelText, aktiv && stile.hobbyKachelTextAktiv]} numberOfLines={1}>
                {h.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Schritt 5: Bio ───────────────────────────────────────────────────────────

function SchrittBio({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  return (
    <View style={stile.feldGruppe}>
      <TextInput
        style={stile.bioFeld}
        value={entwurf.bio}
        onChangeText={(t) => set({ bio: t })}
        placeholder="Schreib etwas über dich…"
        placeholderTextColor="#aaa"
        multiline
        maxLength={200}
      />
      <Text style={stile.zeichenZaehler}>{entwurf.bio.length}/200</Text>
    </View>
  );
}

// ─── Schritt 6: Witzige Fragen ────────────────────────────────────────────────

function SchrittFragen({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  const [auswahlOffen, setAuswahlOffen] = useState(false);
  const verfuegbar = PROFIL_FRAGEN.filter(
    (f) => !entwurf.frageAntworten.some((fa) => fa.frageId === f.id)
  );
  const voll = entwurf.frageAntworten.length >= MAX_FRAGEN;

  function hinzufuegen(frageId: string) {
    set({ frageAntworten: [...entwurf.frageAntworten, { frageId, antwort: "" }] });
    setAuswahlOffen(false);
  }
  function entfernen(frageId: string) {
    set({ frageAntworten: entwurf.frageAntworten.filter((fa) => fa.frageId !== frageId) });
  }
  function antwort(frageId: string, text: string) {
    set({
      frageAntworten: entwurf.frageAntworten.map((fa) =>
        fa.frageId === frageId ? { ...fa, antwort: text } : fa
      ),
    });
  }

  return (
    <View style={stile.feldGruppe}>
      {entwurf.frageAntworten.map((fa) => (
        <View key={fa.frageId} style={stile.frageKarte}>
          <View style={stile.frageKopf}>
            <Text style={stile.frageKopfText}>{frageText(fa.frageId)}</Text>
            <TouchableOpacity onPress={() => entfernen(fa.frageId)}>
              <Ionicons name="close" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={stile.antwortFeld}
            value={fa.antwort}
            onChangeText={(t) => antwort(fa.frageId, t)}
            placeholder="Deine Antwort…"
            placeholderTextColor="#aaa"
            multiline
            maxLength={MAX_ANTWORT_LAENGE}
          />
          <Text style={stile.zeichenZaehler}>{fa.antwort.length}/{MAX_ANTWORT_LAENGE}</Text>
        </View>
      ))}

      {!voll && (
        <TouchableOpacity style={stile.hinzufuegenKnopf} onPress={() => setAuswahlOffen((v) => !v)}>
          <Ionicons name={auswahlOffen ? "chevron-up" : "add"} size={18} color="#007AFF" />
          <Text style={stile.hinzufuegenText}>
            {auswahlOffen ? "Auswahl schließen" : "Frage hinzufügen"}
          </Text>
        </TouchableOpacity>
      )}

      {auswahlOffen &&
        verfuegbar.map((f) => (
          <TouchableOpacity key={f.id} style={stile.frageAuswahl} onPress={() => hinzufuegen(f.id)}>
            <Text style={stile.frageAuswahlText}>{f.text}</Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}

// ─── Schritt 7: Fotos ─────────────────────────────────────────────────────────

function SchrittFotos({ entwurf, set }: { entwurf: Entwurf; set: (t: Partial<Entwurf>) => void }) {
  async function waehlen(i: number) {
    const uri = await bildAuswaehlen();
    if (!uri) return;
    const bilder = [...entwurf.bilder];
    bilder[i] = uri;
    set({ bilder });
  }
  function entfernen(i: number) {
    const bilder = [...entwurf.bilder];
    bilder[i] = null;
    set({ bilder });
  }

  return (
    <View style={stile.feldGruppe}>
      <View style={stile.fotoGrid}>
        {entwurf.bilder.map((bild, i) => (
          <TouchableOpacity
            key={i}
            style={stile.fotoSlot}
            onPress={() => waehlen(i)}
            onLongPress={() => bild && entfernen(i)}
          >
            {bild ? (
              <>
                <Image source={{ uri: bild }} style={stile.fotoBild} />
                {i < KP_BILDER && (
                  <View style={stile.fotoBadge}>
                    <Text style={stile.fotoBadgeText}>{i + 1}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[stile.fotoLeer, i < KP_BILDER && stile.fotoLeerPflicht]}>
                <Ionicons name="add" size={26} color="#8E8E93" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={stile.fotoHinweis}>
        Die ersten {KP_BILDER} (umrandet) sind Pflicht und erscheinen auf deiner Karte.
        Tippen zum Wählen, gedrückt halten zum Entfernen.
      </Text>
    </View>
  );
}

// ─── Schritt 8: Konto (E-Mail + Passwort) ─────────────────────────────────────

function SchrittAccount({
  entwurf,
  set,
  fehler,
}: {
  entwurf: Entwurf;
  set: (t: Partial<Entwurf>) => void;
  fehler: string | null;
}) {
  return (
    <View style={stile.feldGruppe}>
      <Text style={stile.feldLabel}>E-Mail</Text>
      <TextInput
        style={stile.textFeld}
        value={entwurf.email}
        onChangeText={(t) => set({ email: t })}
        placeholder="deine@email.de"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Text style={[stile.feldLabel, { marginTop: 20 }]}>Passwort</Text>
      <TextInput
        style={stile.textFeld}
        value={entwurf.passwort}
        onChangeText={(t) => set({ passwort: t })}
        placeholder="Mindestens 6 Zeichen"
        placeholderTextColor="#aaa"
        secureTextEntry
        textContentType="newPassword"
      />

      <Text style={[stile.feldLabel, { marginTop: 20 }]}>Passwort wiederholen</Text>
      <TextInput
        style={stile.textFeld}
        value={entwurf.passwortWdh}
        onChangeText={(t) => set({ passwortWdh: t })}
        placeholder="Passwort erneut eingeben"
        placeholderTextColor="#aaa"
        secureTextEntry
        textContentType="newPassword"
      />

      {fehler && <Text style={stile.fehlerText}>{fehler}</Text>}
    </View>
  );
}

// ─── Wiederverwendbare Chips ──────────────────────────────────────────────────

function GewaehltChip({ text, onEntfernen }: { text: string; onEntfernen: () => void }) {
  return (
    <View style={stile.gewaehltChip}>
      <Text style={stile.gewaehltChipText}>{text}</Text>
      <TouchableOpacity onPress={onEntfernen} hitSlop={8}>
        <Ionicons name="close-circle" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );
}

function ChipEntfernbar({
  text,
  icon,
  onEntfernen,
}: {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onEntfernen: () => void;
}) {
  return (
    <TouchableOpacity style={stile.chip} onPress={onEntfernen}>
      {icon && <Ionicons name={icon} size={13} color="#1a1a1a" style={{ marginRight: 5 }} />}
      <Text style={stile.chipText}>{text}</Text>
      <Ionicons name="close" size={13} color="#666" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stile = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  kopf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  zurueckKnopf: { padding: 2 },
  fortschrittSpur: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  fortschrittBalken: { height: 5, borderRadius: 3, backgroundColor: "#007AFF" },

  inhalt: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  titel: { fontSize: 28, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  untertitel: { fontSize: 15, color: "#8E8E93", marginTop: 6, marginBottom: 24 },

  feldGruppe: { gap: 0 },
  feldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  optional: { fontWeight: "500", textTransform: "none", letterSpacing: 0 },
  platzhalterHinweis: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EAF3FF",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  platzhalterHinweisText: { flex: 1, fontSize: 14, color: "#1a1a1a", lineHeight: 19 },
  textFeld: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#1a1a1a",
  },

  // gewählte Uni/Studiengang
  gewaehltChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EAF3FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  gewaehltChipText: { flex: 1, fontSize: 16, color: "#1a1a1a", fontWeight: "500" },

  // entfernbare Chips (Module/Hobbies)
  chipReihe: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: "#1a1a1a" },

  // Hobby-Grid
  hobbyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  hobbyKachel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F2F2F7",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hobbyKachelAktiv: { backgroundColor: "#007AFF" },
  hobbyKachelText: { fontSize: 13, color: "#1a1a1a", maxWidth: 130 },
  hobbyKachelTextAktiv: { color: "#fff", fontWeight: "600" },

  // Bio
  bioFeld: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  zeichenZaehler: { fontSize: 12, color: "#aaa", textAlign: "right", marginTop: 6 },
  fehlerText: { color: "#FF3B30", fontSize: 14, marginTop: 16 },

  // Fragen
  frageKarte: { backgroundColor: "#F2F2F7", borderRadius: 14, padding: 14, marginBottom: 12 },
  frageKopf: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  frageKopfText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a", lineHeight: 19 },
  antwortFeld: {
    fontSize: 15,
    color: "#1a1a1a",
    minHeight: 44,
    textAlignVertical: "top",
    lineHeight: 21,
    marginTop: 8,
  },
  hinzufuegenKnopf: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  hinzufuegenText: { fontSize: 15, fontWeight: "600", color: "#007AFF" },
  frageAuswahl: { paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#d1d1d6" },
  frageAuswahlText: { fontSize: 14, color: "#1a1a1a", lineHeight: 19 },

  // Fotos
  fotoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fotoSlot: { width: "30%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  fotoBild: { width: "100%", height: "100%" },
  fotoLeer: { flex: 1, backgroundColor: "#F2F2F7", justifyContent: "center", alignItems: "center" },
  fotoLeerPflicht: { borderWidth: 2, borderColor: "#007AFF", borderStyle: "dashed", borderRadius: 12 },
  fotoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#007AFF",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fotoBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  fotoHinweis: { fontSize: 13, color: "#8E8E93", marginTop: 14, lineHeight: 18 },

  // Fuß
  fuss: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
  },
  ueberspringen: { paddingVertical: 14, paddingHorizontal: 8 },
  ueberspringenText: { fontSize: 16, color: "#8E8E93", fontWeight: "500" },
  weiterKnopf: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  weiterKnopfInaktiv: { opacity: 0.4 },
  weiterText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
