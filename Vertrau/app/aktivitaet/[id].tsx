import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { type Aktivitaet, type Teilnehmer } from "../../data/aktivitaeten";
import { type ProposalStatus } from "../../data/chats";
import {
  beitretenAktivitaet,
  ladeAktivitaet,
  verlassenAktivitaet,
} from "../../api/aktivitaeten";
import { beantworteProposal } from "../../api/chats";
import { ApiError } from "../../lib/api";
import { getCurrentSession } from "../../lib/supabase";

type Modus = "teilnehmen" | "einladung";

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
          <View key={i} style={[styles.dot, i === index && styles.dotAktiv]} />
        ))}
      </View>
    </View>
  );
}

// ─── Profil-Platzhalter ───────────────────────────────────────────────────────

function ProfilAvatar({ teil, size }: { teil: Teilnehmer; size: number }) {
  if (teil.bild) {
    return (
      <Image
        source={{ uri: teil.bild }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#e5e5ea",
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#b0b0b8",
        justifyContent: "flex-end",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Ionicons
        name="person"
        size={size * 0.55}
        color="#fff"
        style={{ marginTop: size * 0.1 }}
      />
    </View>
  );
}

// ─── Maps-Öffner ──────────────────────────────────────────────────────────────

async function oeffneInKarten(
  latitude: number,
  longitude: number,
  name: string
) {
  const label = encodeURIComponent(name);
  const googleWeb = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
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
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // nächster Kandidat
    }
  }
  try {
    await Linking.openURL(googleWeb);
  } catch {
    // egal
  }
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function AktivitaetDetailScreen() {
  const {
    id,
    modus: modusParam,
    proposalId,
    proposalDatum,
    proposalUhrzeit,
    proposalStatus,
    proposalVonMir,
  } = useLocalSearchParams<{
    id: string;
    modus?: Modus;
    proposalId?: string;
    proposalDatum?: string;
    proposalUhrzeit?: string;
    proposalStatus?: ProposalStatus;
    proposalVonMir?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const modus: Modus = modusParam ?? "teilnehmen";

  const [aktivitaet, setAktivitaet] = useState<Aktivitaet | undefined>(undefined);
  const [laden, setLaden] = useState(true);
  const [teilnehmerOffen, setTeilnehmerOffen] = useState(false);
  const [meineId, setMeineId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentSession().then((s) => setMeineId(s?.user.id ?? null));
  }, []);

  useEffect(() => {
    if (!id) return;
    let abgebrochen = false;
    setLaden(true);
    (async () => {
      try {
        const a = await ladeAktivitaet(id);
        if (!abgebrochen) setAktivitaet(a);
      } catch {
        if (!abgebrochen) setAktivitaet(undefined);
      } finally {
        if (!abgebrochen) setLaden(false);
      }
    })();
    return () => {
      abgebrochen = true;
    };
  }, [id]);

  // Stilles Neuladen bei jedem Fokus — z. B. nach dem Bearbeiten oder einem
  // Beitritt erscheinen die Änderungen, ohne Spinner-Flackern.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let abgebrochen = false;
      ladeAktivitaet(id)
        .then((a) => {
          if (!abgebrochen) setAktivitaet(a);
        })
        .catch(() => {});
      return () => {
        abgebrochen = true;
      };
    }, [id])
  );

  if (!aktivitaet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Aktivität" }} />
        {laden ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
        ) : (
          <Text style={styles.leerText}>Aktivität nicht gefunden.</Text>
        )}
      </View>
    );
  }

  const vorschlagVonMir = proposalVonMir === "1" || proposalVonMir === "true";
  const aktuellerProposalStatus: ProposalStatus =
    proposalStatus === "accepted" || proposalStatus === "declined"
      ? proposalStatus
      : "pending";
  const darfAntworten =
    modus === "einladung" &&
    !vorschlagVonMir &&
    aktuellerProposalStatus === "pending";
  const belegt = aktivitaet.teilnehmer.length;
  const frei = Math.max(0, aktivitaet.maxPlaetze - belegt);
  const beigetreten =
    !!meineId && aktivitaet.teilnehmer.some((t) => t.id === meineId);
  const istAdmin = !!meineId && aktivitaet.adminId === meineId;

  async function teilnehmen() {
    if (!aktivitaet || busy) return;
    setBusy(true);
    try {
      const aktualisiert = await beitretenAktivitaet(aktivitaet.id);
      setAktivitaet(aktualisiert);
    } catch (e) {
      Alert.alert(
        "Beitreten fehlgeschlagen",
        e instanceof ApiError ? e.message : "Bitte später erneut versuchen."
      );
    } finally {
      setBusy(false);
    }
  }

  async function verlassen() {
    if (!aktivitaet || busy) return;
    setBusy(true);
    try {
      await verlassenAktivitaet(aktivitaet.id);
      const aktualisiert = await ladeAktivitaet(aktivitaet.id);
      setAktivitaet(aktualisiert);
    } catch (e) {
      Alert.alert(
        "Verlassen fehlgeschlagen",
        e instanceof ApiError ? e.message : "Bitte später erneut versuchen."
      );
    } finally {
      setBusy(false);
    }
  }

  async function aufEinladungAntworten(antwort: ProposalStatus) {
    if (
      modus !== "einladung" ||
      vorschlagVonMir ||
      !proposalId ||
      (antwort !== "accepted" && antwort !== "declined") ||
      busy
    ) {
      return;
    }
    setBusy(true);
    try {
      // Annahme macht backend-seitig zum Teilnehmer + Gruppenchat-Mitglied.
      await beantworteProposal(proposalId, antwort);
      router.back();
    } catch (e) {
      Alert.alert(
        "Aktion fehlgeschlagen",
        e instanceof ApiError ? e.message : "Bitte später erneut versuchen."
      );
    } finally {
      setBusy(false);
    }
  }

  const maxVorschau = Math.min(aktivitaet.teilnehmer.length, 5);

  return (
    <>
      <Stack.Screen
        options={{
          title: aktivitaet.titel,
          // Bearbeiten nur für den Admin — öffnet das Formular im Edit-Modus.
          headerRight: istAdmin
            ? () => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/aktivitaet/neu",
                      params: { editId: aktivitaet.id },
                    })
                  }
                  hitSlop={8}
                  activeOpacity={0.6}
                >
                  <Ionicons name="create-outline" size={23} color="#007AFF" />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <BilderSlideshow bilder={aktivitaet.bilder} />

        {/* Name + Beschreibung */}
        <View style={styles.textBlock}>
          <Text style={styles.name}>{aktivitaet.titel}</Text>
          <Text style={styles.beschreibung}>{aktivitaet.beschreibung}</Text>
        </View>

        {/* Teilnehmer – einklappbar */}
        <TouchableOpacity
          style={styles.teilnehmerKopf}
          onPress={() => setTeilnehmerOffen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.teilnehmerKopfLinks}>
            <Ionicons name="people" size={18} color="#1a1a1a" />
            <Text style={styles.teilnehmerTitel}>Teilnehmer</Text>
          </View>
          <View style={styles.teilnehmerKopfRechts}>
            {!teilnehmerOffen && (
              <View style={styles.avatarReihe}>
                {aktivitaet.teilnehmer.slice(0, maxVorschau).map((t, i) => (
                  <View
                    key={t.id}
                    style={[
                      styles.avatarVorschauRahmen,
                      { marginLeft: i === 0 ? 0 : -10, zIndex: maxVorschau - i },
                    ]}
                  >
                    <ProfilAvatar teil={t} size={28} />
                  </View>
                ))}
              </View>
            )}
            <Ionicons
              name={teilnehmerOffen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#888"
            />
          </View>
        </TouchableOpacity>

        {teilnehmerOffen && (
          <View style={styles.teilnehmerListe}>
            {aktivitaet.teilnehmer.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.teilnehmerZeile}
                onPress={() => router.push(`/person/${t.id}`)}
                activeOpacity={0.7}
              >
                <ProfilAvatar teil={t} size={44} />
                <Text style={styles.teilnehmerName}>{t.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#c7c7cc"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            ))}
            {aktivitaet.teilnehmer.length === 0 && (
              <Text style={styles.teilnehmerLeer}>Noch keine Teilnehmer.</Text>
            )}
          </View>
        )}

        <Text style={styles.plaetzeText}>
          {belegt}/{aktivitaet.maxPlaetze} Plätze belegt · {frei} frei
        </Text>

        {/* Adresse */}
        <View style={styles.adresseBlock}>
          <View style={styles.adresseKopf}>
            <Ionicons name="location" size={18} color="#e74c3c" />
            <Text style={styles.adresseTitel}>Adresse</Text>
          </View>
          <Text style={styles.adresseZeile}>{aktivitaet.adresse.strasse}</Text>
          <Text style={styles.adresseZeile}>{aktivitaet.adresse.plzOrt}</Text>
        </View>

        {/* Karte */}
        <TouchableOpacity
          style={styles.karteWrapper}
          onPress={() =>
            oeffneInKarten(
              aktivitaet.koordinaten.latitude,
              aktivitaet.koordinaten.longitude,
              aktivitaet.titel
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
              latitude: aktivitaet.koordinaten.latitude,
              longitude: aktivitaet.koordinaten.longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            }}
          >
            <Marker
              coordinate={aktivitaet.koordinaten}
              title={aktivitaet.titel}
            />
          </MapView>
          <View style={styles.karteBadge}>
            <Ionicons name="open-outline" size={14} color="#1a1a1a" />
            <Text style={styles.karteBadgeText}>In Karten öffnen</Text>
          </View>
        </TouchableOpacity>

        {/* Datum / Uhrzeit – vom Ersteller festgelegt (bei Einladung kommt der
            Wert aus dem Vorschlag, sonst aus der Aktivität selbst). */}
        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Datum</Text>
          <View style={styles.feldWert}>
            <Text style={styles.feldWertText}>
              {modus === "einladung" ? proposalDatum : aktivitaet.datum}
            </Text>
          </View>
        </View>
        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Uhrzeit</Text>
          <View style={styles.feldWert}>
            <Text style={styles.feldWertText}>
              {modus === "einladung" ? proposalUhrzeit : aktivitaet.uhrzeit}
            </Text>
          </View>
        </View>

        {/* Modus-spezifische Aktion unten */}
        {modus === "einladung" ? (
          <View style={styles.aktionWrapper}>
            {darfAntworten ? (
              <View style={styles.einladungAktionen}>
                <TouchableOpacity
                  style={[styles.einladungButton, styles.einladungAblehnen]}
                  onPress={() => aufEinladungAntworten("declined")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.einladungAblehnenText}>Ablehnen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.einladungButton, styles.einladungAnnehmen]}
                  onPress={() => aufEinladungAntworten("accepted")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.einladungAnnehmenText}>Annehmen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={[
                  styles.einladungsStatusText,
                  aktuellerProposalStatus === "accepted"
                    ? styles.einladungsStatusAngenommen
                    : aktuellerProposalStatus === "declined"
                    ? styles.einladungsStatusAbgelehnt
                    : styles.einladungsStatusWartend,
                ]}
              >
                {aktuellerProposalStatus === "accepted"
                  ? "Angenommen"
                  : aktuellerProposalStatus === "declined"
                  ? "Abgelehnt"
                  : "Warten auf Antwort"}
              </Text>
            )}
          </View>
        ) : (
          // modus === "teilnehmen"
          <View style={styles.aktionWrapper}>
            {istAdmin ? (
              <View style={[styles.teilnehmenButton, styles.teilnehmenButtonAktiv]}>
                <Ionicons
                  name="star"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.teilnehmenText}>Du bist Admin</Text>
              </View>
            ) : beigetreten ? (
              <TouchableOpacity
                style={[styles.teilnehmenButton, styles.verlassenButton]}
                onPress={verlassen}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={styles.teilnehmenText}>
                  {busy ? "…" : "Treffen verlassen"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.teilnehmenButton,
                  frei === 0 && styles.teilnehmenButtonDisabled,
                ]}
                onPress={teilnehmen}
                disabled={busy || frei === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.teilnehmenText}>
                  {busy ? "…" : frei === 0 ? "Voll" : "Teilnehmen"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  teilnehmerKopf: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
  },
  teilnehmerKopfLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teilnehmerKopfRechts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teilnehmerTitel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  avatarReihe: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarVorschauRahmen: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  teilnehmerListe: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  teilnehmerZeile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  teilnehmerName: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  teilnehmerLeer: {
    fontSize: 13,
    color: "#888",
    paddingVertical: 6,
  },
  plaetzeText: {
    fontSize: 12,
    color: "#888",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  adresseBlock: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5ea",
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
  aktionWrapper: {
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
  teilnehmenButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 22,
  },
  teilnehmenButtonAktiv: {
    backgroundColor: "#1f8f4f",
  },
  verlassenButton: {
    backgroundColor: "#e74c3c",
  },
  teilnehmenButtonDisabled: {
    backgroundColor: "#b8b8be",
  },
  teilnehmenText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  einladungAktionen: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  einladungButton: {
    flex: 1,
    borderRadius: 22,
    alignItems: "center",
    paddingVertical: 13,
  },
  einladungAnnehmen: {
    backgroundColor: "#2ecc71",
  },
  einladungAnnehmenText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  einladungAblehnen: {
    backgroundColor: "#fdecea",
    borderWidth: 1,
    borderColor: "#f7c5c0",
  },
  einladungAblehnenText: {
    color: "#c0392b",
    fontSize: 16,
    fontWeight: "700",
  },
  einladungsStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  einladungsStatusAngenommen: {
    color: "#1f8f4f",
  },
  einladungsStatusAbgelehnt: {
    color: "#c0392b",
  },
  einladungsStatusWartend: {
    color: "#2f6fce",
  },
  hinweisText: {
    marginTop: 10,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
