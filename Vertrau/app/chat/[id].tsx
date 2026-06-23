import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ChatItem, type Message, type ProposalStatus } from "../../data/chats";
import {
  beantworteProposal as apiBeantworteProposal,
  ladeChats,
  ladeNachrichten,
  sendeNachricht,
} from "../../api/chats";

// ─── Einzelne Nachricht ───────────────────────────────────────────────────────

function NachrichtBlase({
  nachricht,
  zeigeSender,
}: {
  nachricht: Message;
  zeigeSender: boolean;
}) {
  const vonMir = nachricht.fromMe;
  return (
    <View
      style={[
        styles.blasenZeile,
        vonMir ? styles.blasenZeileRechts : styles.blasenZeileLinks,
      ]}
    >
      {zeigeSender && !vonMir && nachricht.senderName && (
        <Text style={styles.senderName}>{nachricht.senderName}</Text>
      )}
      <View style={[styles.blase, vonMir ? styles.blaseMir : styles.blaseAnder]}>
        <Text style={[styles.blasenText, vonMir && styles.blasenTextMir]}>
          {nachricht.text}
        </Text>
      </View>
      <Text style={[styles.zeit, vonMir ? styles.zeitRechts : styles.zeitLinks]}>
        {nachricht.time}
      </Text>
    </View>
  );
}

// ─── Treffens-Vorschlag als Nachricht ─────────────────────────────────────────

function VorschlagsKarte({
  nachricht,
  zeigeSender,
  onAntwort,
  onInfoPress,
}: {
  nachricht: Message;
  zeigeSender: boolean;
  onAntwort: (antwort: ProposalStatus) => void;
  onInfoPress: () => void;
}) {
  const vonMir = nachricht.fromMe;
  const p = nachricht.proposal!;
  const status = p.status ?? "pending";

  // Statusfarben: akzeptiert = grün, abgelehnt = rot.
  const statusFarbe = status === "accepted" ? "#2ecc71" : "#c0392b";
  // Auf blauem Hintergrund hellere Varianten verwenden.
  const statusFarbeMir =
    status === "accepted" ? "#8cf3ba" : "#ffb3ad";

  return (
    <View
      style={[
        styles.vorschlagZeile,
        vonMir ? styles.vorschlagZeileRechts : styles.vorschlagZeileLinks,
      ]}
    >
      {zeigeSender && !vonMir && nachricht.senderName && (
        <Text style={styles.senderName}>{nachricht.senderName}</Text>
      )}
      <View
        style={[
          styles.vorschlagKarte,
          vonMir ? styles.vorschlagKarteMir : styles.vorschlagKarteAnder,
        ]}
      >
        {/* Kopfzeile: Cover + Name/Datum + Info-Knopf */}
        <View style={styles.vorschlagKopf}>
          <Image
            source={{ uri: p.coverbild }}
            style={styles.vorschlagCover}
          />
          <View style={styles.vorschlagMitte}>
            <Text
              style={[
                styles.vorschlagName,
                vonMir && styles.vorschlagTextMir,
              ]}
              numberOfLines={1}
            >
              {p.aktivitaet}
            </Text>
            <Text
              style={[
                styles.vorschlagZeit,
                vonMir && styles.vorschlagZeitMir,
              ]}
            >
              {p.datum} · {p.uhrzeit}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.vorschlagInfo}
            activeOpacity={0.7}
            onPress={onInfoPress}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={vonMir ? "#ffffff" : "#007AFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Aktionen bzw. Status */}
        {status === "pending" && !vonMir ? (
          // Empfängerseite: Annehmen/Ablehnen
          <View style={styles.vorschlagAktionen}>
            <TouchableOpacity
              style={[styles.vorschlagButton, styles.vorschlagAblehnen]}
              onPress={() => onAntwort("declined")}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={16} color="#c0392b" />
              <Text style={styles.vorschlagAblehnenText}>Ablehnen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vorschlagButton, styles.vorschlagAnnehmen]}
              onPress={() => onAntwort("accepted")}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.vorschlagAnnehmenText}>Annehmen</Text>
            </TouchableOpacity>
          </View>
        ) : status === "pending" && vonMir ? (
          // Senderseite wartet auf Antwort
          <View style={styles.vorschlagStatusBlock}>
            <Ionicons name="time-outline" size={16} color="#ffffff" />
            <Text style={[styles.vorschlagStatusText, { color: "#ffffff" }]}>
              Warten auf Antwort
            </Text>
          </View>
        ) : (
          // Endgültiger Status – beide Seiten
          <View style={styles.vorschlagStatusBlock}>
            <Ionicons
              name={status === "accepted" ? "checkmark-circle" : "close-circle"}
              size={16}
              color={vonMir ? statusFarbeMir : statusFarbe}
            />
            <Text
              style={[
                styles.vorschlagStatusText,
                { color: vonMir ? statusFarbeMir : statusFarbe },
              ]}
            >
              {status === "accepted" ? "Angenommen" : "Abgelehnt"}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.zeit, vonMir ? styles.zeitRechts : styles.zeitLinks]}
      >
        {nachricht.time}
      </Text>
    </View>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [nachrichten, setNachrichten] = useState<Message[]>([]);
  const [eingabe, setEingabe] = useState("");
  const [chat, setChat] = useState<ChatItem | undefined>(undefined);

  // Chat-Kopf (Name/Bild/Verknüpfung) aus der Backend-Chatliste holen.
  useEffect(() => {
    ladeChats()
      .then((chats) => setChat(chats.find((c) => c.id === id)))
      .catch(() => {});
  }, [id]);

  const istGruppe = chat?.linkType === "activity";
  const istPersonenChat = chat?.linkType === "person";

  // Nachrichten aus dem Backend (GET /chats/:id/messages), chronologisch.
  useEffect(() => {
    ladeNachrichten(id)
      .then(setNachrichten)
      .catch(() => setNachrichten([]));
  }, [id]);

  // Bei jedem Fokus neu laden – damit Nachrichten vom Gegenüber beim
  // Zurückkehren erscheinen (kein Realtime in dieser Stufe).
  useFocusEffect(
    useCallback(() => {
      let abgebrochen = false;
      ladeNachrichten(id)
        .then((msgs) => {
          if (!abgebrochen) setNachrichten(msgs);
        })
        .catch(() => {});
      return () => {
        abgebrochen = true;
      };
    }, [id])
  );

  // Für jede Nachricht entscheiden, ob der Sendername angezeigt wird
  // (nur in Gruppen-Chats, nur bei Senderwechsel – WhatsApp-Stil).
  const senderSichtbar = useMemo(() => {
    if (!istGruppe) return nachrichten.map(() => false);
    return nachrichten.map((msg, i) => {
      if (msg.fromMe) return false;
      if (!msg.senderName) return false;
      const vorherige = nachrichten[i - 1];
      if (!vorherige) return true;
      if (vorherige.fromMe) return true;
      return vorherige.senderName !== msg.senderName;
    });
  }, [nachrichten, istGruppe]);

  // Header-Tap: zur verknüpften Profil-/Aktivitätsansicht navigieren
  function oeffneHeaderZiel() {
    if (!chat?.linkType || !chat.linkId) return;
    if (chat.linkType === "person") {
      router.push(`/person/${chat.linkId}`);
    } else if (chat.linkType === "activity") {
      router.push(`/aktivitaet/${chat.linkId}`);
    }
  }

  function treffenVorschlagen() {
    router.push({
      pathname: "/treffen-vorschlagen",
      params: { chatId: id },
    });
  }

  function oeffneVorschlagsInfo(nachricht: Message) {
    const proposal = nachricht.proposal;
    if (!proposal) return;

    const gemeinsameParams = {
      chatId: id,
      proposalMessageId: nachricht.id,
      proposalId: proposal.proposalId ?? "",
      proposalDatum: proposal.datum,
      proposalUhrzeit: proposal.uhrzeit,
      proposalStatus: proposal.status ?? "pending",
      proposalVonMir: nachricht.fromMe ? "1" : "0",
    };

    if (proposal.aktivitaetId) {
      router.push({
        pathname: "/aktivitaet/[id]",
        params: {
          id: proposal.aktivitaetId,
          modus: "einladung",
          ...gemeinsameParams,
        },
      });
      return;
    }

    if (proposal.locationId) {
      router.push({
        pathname: "/location/[id]",
        params: { id: proposal.locationId, ...gemeinsameParams },
      });
      return;
    }

    // Eigener Vorschlag (kein locationId, kein aktivitaetId) — eigener
    // Info-Screen, der die customAdresse/-Koordinaten/-Bilder anzeigt.
    router.push({
      pathname: "/vorschlag/[id]",
      params: {
        id: nachricht.id,
        chatId: id,
        proposalVonMir: nachricht.fromMe ? "1" : "0",
      },
    });
  }

  // Auf einen Treffens-Vorschlag antworten (Annehmen / Ablehnen) → Backend
  // (PATCH /meeting-proposals/:id). Optimistischer Status-Wechsel, bei Fehler
  // Rückrollen. Nach Erfolg neu laden — bei Gruppentreffen ändert die Annahme
  // zusätzlich die Mitgliedschaft (Teilnehmer + Gruppenchat).
  async function beantworteProposal(nachricht: Message, antwort: ProposalStatus) {
    const proposalId = nachricht.proposal?.proposalId;
    if (!proposalId || (antwort !== "accepted" && antwort !== "declined")) return;

    const vorher = nachricht.proposal?.status ?? "pending";
    setNachrichten((prev) =>
      prev.map((m) =>
        m.id === nachricht.id && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: antwort } }
          : m
      )
    );
    try {
      await apiBeantworteProposal(proposalId, antwort);
      const frisch = await ladeNachrichten(id);
      setNachrichten(frisch);
    } catch {
      setNachrichten((prev) =>
        prev.map((m) =>
          m.id === nachricht.id && m.proposal
            ? { ...m, proposal: { ...m.proposal, status: vorher } }
            : m
        )
      );
      Alert.alert(
        "Aktion fehlgeschlagen",
        "Deine Antwort konnte nicht gespeichert werden."
      );
    }
  }

  // Nachricht senden
  async function senden() {
    const text = eingabe.trim();
    if (!text) return;
    setEingabe("");

    try {
      const neue = await sendeNachricht(id, text);
      setNachrichten((prev) => [...prev, neue]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch {
      Alert.alert("Senden fehlgeschlagen", "Deine Nachricht konnte nicht gesendet werden.");
      setEingabe(text);
    }
  }

  return (
    <>
      {/* Header mit Bild + Name – tapbar */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerInnen}
              onPress={oeffneHeaderZiel}
              activeOpacity={0.6}
              disabled={!chat?.linkType || !chat?.linkId}
            >
              {chat?.image ? (
                <Image source={{ uri: chat.image }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlatzhalter}>
                  <Ionicons
                    name="person"
                    size={18}
                    color="#fff"
                    style={{ marginTop: 4 }}
                  />
                </View>
              )}
              <Text style={styles.headerName} numberOfLines={1}>
                {chat?.name ?? "Chat"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Aktionsleiste unterhalb des Headers – nur bei 1:1-Personen-Chats */}
        {istPersonenChat && (
          <View style={styles.aktionsLeiste}>
            <TouchableOpacity
              style={styles.aktionsButton}
              onPress={treffenVorschlagen}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color="#007AFF" />
              <Text style={styles.aktionsButtonText}>Treffen vorschlagen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nachrichtenliste */}
        <FlatList
          ref={flatListRef}
          data={nachrichten}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) =>
            item.proposal ? (
              <VorschlagsKarte
                nachricht={item}
                zeigeSender={senderSichtbar[index] ?? false}
                onAntwort={(antwort) => beantworteProposal(item, antwort)}
                onInfoPress={() => oeffneVorschlagsInfo(item)}
              />
            ) : (
              <NachrichtBlase
                nachricht={item}
                zeigeSender={senderSichtbar[index] ?? false}
              />
            )
          }
          contentContainerStyle={styles.liste}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Eingabeleiste */}
        <View style={[styles.eingabeLeiste, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.eingabe}
            value={eingabe}
            onChangeText={setEingabe}
            placeholder="Nachricht schreiben…"
            placeholderTextColor="#aaa"
            multiline
            returnKeyType="send"
            onSubmitEditing={senden}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendenButton, !eingabe.trim() && styles.sendenButtonDisabled]}
            onPress={senden}
            disabled={!eingabe.trim()}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  headerInnen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerAvatarPlatzhalter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#b0b0b8",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    maxWidth: 200,
  },
  liste: {
    padding: 12,
    paddingBottom: 4,
  },
  blasenZeile: {
    marginVertical: 3,
    maxWidth: "78%",
  },
  blasenZeileLinks: {
    alignSelf: "flex-start",
  },
  blasenZeileRechts: {
    alignSelf: "flex-end",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 10,
    marginBottom: 2,
  },
  blase: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  blaseMir: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  blaseAnder: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  blasenText: {
    fontSize: 15,
    color: "#1a1a1a",
    lineHeight: 20,
  },
  blasenTextMir: {
    color: "#fff",
  },
  zeit: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 3,
  },
  zeitLinks: {
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  zeitRechts: {
    alignSelf: "flex-end",
    marginRight: 4,
  },
  eingabeLeiste: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    gap: 8,
  },
  eingabe: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  sendenButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  sendenButtonDisabled: {
    backgroundColor: "#c0d8f7",
  },
  aktionsLeiste: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  aktionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#eaf3ff",
  },
  aktionsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },

  // ─── Treffens-Vorschlag ────────────────────────────────────────────────────
  vorschlagZeile: {
    marginVertical: 4,
    maxWidth: "88%",
  },
  vorschlagZeileLinks: {
    alignSelf: "flex-start",
  },
  vorschlagZeileRechts: {
    alignSelf: "flex-end",
  },
  vorschlagKarte: {
    borderRadius: 14,
    padding: 10,
    minWidth: 260,
  },
  vorschlagKarteAnder: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  vorschlagKarteMir: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  vorschlagKopf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vorschlagCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#e5e5ea",
  },
  vorschlagMitte: {
    flex: 1,
    minWidth: 0,
  },
  vorschlagName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  vorschlagTextMir: {
    color: "#fff",
  },
  vorschlagZeit: {
    fontSize: 13,
    color: "#6b6b70",
    marginTop: 2,
  },
  vorschlagZeitMir: {
    color: "#dbeafe",
  },
  vorschlagInfo: {
    padding: 4,
  },
  vorschlagAktionen: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  vorschlagButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  vorschlagAnnehmen: {
    backgroundColor: "#2ecc71",
  },
  vorschlagAnnehmenText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  vorschlagAblehnen: {
    backgroundColor: "#fdecea",
  },
  vorschlagAblehnenText: {
    color: "#c0392b",
    fontSize: 14,
    fontWeight: "700",
  },
  vorschlagStatusBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    justifyContent: "center",
  },
  vorschlagStatusText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
