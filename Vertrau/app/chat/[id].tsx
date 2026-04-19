import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { INITIAL_CHATS, type Message } from "../../data/chats";

const STORAGE_PREFIX = "messages_v2_";

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

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [nachrichten, setNachrichten] = useState<Message[]>([]);
  const [eingabe, setEingabe] = useState("");

  const chat = INITIAL_CHATS.find((c) => c.id === id);
  const istGruppe = chat?.linkType === "activity";

  // Nachrichten laden
  useEffect(() => {
    async function laden() {
      const key = STORAGE_PREFIX + id;
      const gespeichert = await AsyncStorage.getItem(key);
      if (gespeichert) {
        setNachrichten(JSON.parse(gespeichert));
      } else {
        const initial = chat?.messages ?? [];
        await AsyncStorage.setItem(key, JSON.stringify(initial));
        setNachrichten(initial);
      }
    }
    laden();
  }, [id]);

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

  // Nachricht senden
  async function senden() {
    const text = eingabe.trim();
    if (!text) return;

    const jetzt = new Date();
    const zeit = `${jetzt.getHours().toString().padStart(2, "0")}:${jetzt
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const neue: Message = {
      id: `msg_${Date.now()}`,
      text,
      fromMe: true,
      time: zeit,
    };

    const aktualisiert = [...nachrichten, neue];
    setNachrichten(aktualisiert);
    setEingabe("");
    await AsyncStorage.setItem(
      STORAGE_PREFIX + id,
      JSON.stringify(aktualisiert)
    );

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
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
        {/* Nachrichtenliste */}
        <FlatList
          ref={flatListRef}
          data={nachrichten}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NachrichtBlase
              nachricht={item}
              zeigeSender={senderSichtbar[index] ?? false}
            />
          )}
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
});
