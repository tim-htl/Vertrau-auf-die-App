import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type Message,
  type MessageProposal,
  type ProposalStatus,
} from "../../data/chats";
import { MESSAGES_PREFIX } from "../../data/userAktivitaeten";

// Info-/Antwort-Screen für Zu-zweit-Vorschläge, die KEINE locationId und
// KEINE aktivitaetId haben — also vom User selbst zusammengestellte Treffen.
// Liest den passenden Vorschlag direkt aus AsyncStorage anhand chatId +
// proposalMessageId und erlaubt dem Empfänger das Annehmen/Ablehnen.

export default function VorschlagInfoScreen() {
  const { id, chatId, proposalVonMir } = useLocalSearchParams<{
    id: string; // = proposalMessageId
    chatId?: string;
    proposalVonMir?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [proposal, setProposal] = useState<MessageProposal | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let abgebrochen = false;
    (async () => {
      if (!chatId || !id) {
        setLaden(false);
        return;
      }
      const roh = await AsyncStorage.getItem(MESSAGES_PREFIX + chatId);
      if (!roh) {
        if (!abgebrochen) setLaden(false);
        return;
      }
      const nachrichten: Message[] = JSON.parse(roh);
      const treffer = nachrichten.find((m) => m.id === id);
      if (!abgebrochen) {
        setProposal(treffer?.proposal ?? null);
        setLaden(false);
      }
    })();
    return () => {
      abgebrochen = true;
    };
  }, [chatId, id]);

  const vorschlagVonMir = proposalVonMir === "1" || proposalVonMir === "true";
  const aktuellerStatus: ProposalStatus = proposal?.status ?? "pending";
  const darfAntworten =
    !!proposal && !vorschlagVonMir && aktuellerStatus === "pending";

  async function antworten(antwort: ProposalStatus) {
    if (!chatId || !id) return;
    const key = MESSAGES_PREFIX + chatId;
    const roh = await AsyncStorage.getItem(key);
    if (!roh) return;
    const nachrichten: Message[] = JSON.parse(roh);
    const aktualisiert = nachrichten.map((m) =>
      m.id === id && m.proposal
        ? { ...m, proposal: { ...m.proposal, status: antwort } }
        : m
    );
    await AsyncStorage.setItem(key, JSON.stringify(aktualisiert));
    router.back();
  }

  if (laden) {
    return (
      <View style={styles.zentriert}>
        <Stack.Screen options={{ title: "Vorschlag" }} />
        <ActivityIndicator />
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={styles.zentriert}>
        <Stack.Screen options={{ title: "Vorschlag" }} />
        <Text style={styles.leerText}>Vorschlag nicht gefunden.</Text>
      </View>
    );
  }

  const bilder =
    proposal.customBilder && proposal.customBilder.length > 0
      ? proposal.customBilder
      : [proposal.coverbild];
  const adresse = proposal.customAdresse;
  const koordinaten = proposal.customKoordinaten;

  const heroHoehe = 280;

  return (
    <>
      <Stack.Screen options={{ title: "Treffen-Vorschlag" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ height: heroHoehe }}
        >
          {bilder.map((url, i) => (
            <Image
              key={i}
              source={{ uri: url }}
              style={{ width, height: heroHoehe }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.textBlock}>
          <Text style={styles.titel}>{proposal.aktivitaet}</Text>
        </View>

        {adresse && (
          <View style={styles.feldBlock}>
            <Text style={styles.feldLabel}>Adresse</Text>
            <Text style={styles.feldText}>{adresse.strasse}</Text>
            <Text style={styles.feldText}>{adresse.plzOrt}</Text>
          </View>
        )}

        {koordinaten && (
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
                latitude: koordinaten.latitude,
                longitude: koordinaten.longitude,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
            >
              <Marker coordinate={koordinaten} />
            </MapView>
          </View>
        )}

        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Datum</Text>
          <Text style={styles.feldText}>{proposal.datum}</Text>
        </View>
        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Uhrzeit</Text>
          <Text style={styles.feldText}>{proposal.uhrzeit}</Text>
        </View>

        <View style={styles.feldBlock}>
          <Text style={styles.feldLabel}>Status</Text>
          <View style={styles.statusReihe}>
            <Ionicons
              name={
                aktuellerStatus === "accepted"
                  ? "checkmark-circle"
                  : aktuellerStatus === "declined"
                    ? "close-circle"
                    : "time"
              }
              size={18}
              color={
                aktuellerStatus === "accepted"
                  ? "#1f8f4f"
                  : aktuellerStatus === "declined"
                    ? "#c0392b"
                    : "#8a8a8e"
              }
            />
            <Text style={styles.feldText}>
              {aktuellerStatus === "accepted"
                ? "Angenommen"
                : aktuellerStatus === "declined"
                  ? "Abgelehnt"
                  : "Offen"}
            </Text>
          </View>
        </View>

        {darfAntworten && (
          <View style={styles.aktionWrapper}>
            <TouchableOpacity
              style={[styles.btn, styles.btnAblehnen]}
              onPress={() => antworten("declined")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Ablehnen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnAnnehmen]}
              onPress={() => antworten("accepted")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, styles.btnTextAnnehmen]}>
                Annehmen
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  zentriert: { flex: 1, alignItems: "center", justifyContent: "center" },
  leerText: { fontSize: 15, color: "#888" },
  textBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  titel: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
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
  feldText: { fontSize: 16, color: "#1a1a1a" },
  statusReihe: { flexDirection: "row", alignItems: "center", gap: 8 },
  karteWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e5ea",
  },
  aktionWrapper: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
  },
  btnAblehnen: {
    backgroundColor: "#f2f2f7",
  },
  btnAnnehmen: {
    backgroundColor: "#007AFF",
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  btnTextAnnehmen: { color: "#fff" },
});
