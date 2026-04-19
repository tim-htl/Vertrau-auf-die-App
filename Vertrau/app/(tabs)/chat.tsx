import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { INITIAL_CHATS, type ChatItem, type Message } from "../../data/chats";

// ─── Hilfsfunktion: Nachrichten laden ────────────────────────────────────────

async function ladeNachrichten(chatId: string): Promise<Message[]> {
  const key = `messages_v2_${chatId}`;
  const gespeichert = await AsyncStorage.getItem(key);
  if (gespeichert) return JSON.parse(gespeichert);
  // Erstmalig: Demo-Nachrichten speichern
  const initial = INITIAL_CHATS.find((c) => c.id === chatId)?.messages ?? [];
  await AsyncStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

// ─── Einzelnes Chat-Listen-Element ───────────────────────────────────────────

function ChatListItem({
  chat,
  letzteNachricht,
  onPress,
}: {
  chat: ChatItem;
  letzteNachricht: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      {/* Profilbild / Aktivitätsbild */}
      {chat.image ? (
        <Image source={{ uri: chat.image }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlatzhalter}>
          <Ionicons name="person" size={28} color="#fff" style={{ marginTop: 6 }} />
        </View>
      )}

      {/* Name + letzte Nachricht */}
      <View style={styles.textBereich}>
        <Text style={styles.name} numberOfLines={1}>
          {chat.name}
        </Text>
        <Text style={styles.vorschau} numberOfLines={1}>
          {letzteNachricht}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Trennlinie ───────────────────────────────────────────────────────────────

function Trennlinie() {
  return <View style={styles.trennlinie} />;
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const router = useRouter();
  const [letzteNachrichten, setLetzteNachrichten] = useState<
    Record<string, string>
  >({});

  // Beim Fokus immer neueste letzte Nachricht laden (auch nach dem Tippen)
  useFocusEffect(
    useCallback(() => {
      async function laden() {
        const eintraege: Record<string, string> = {};
        for (const chat of INITIAL_CHATS) {
          const nachrichten = await ladeNachrichten(chat.id);
          const letzte = nachrichten[nachrichten.length - 1];
          eintraege[chat.id] = letzte
            ? `${letzte.fromMe ? "Du: " : ""}${letzte.text}`
            : "";
        }
        setLetzteNachrichten(eintraege);
      }
      laden();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={INITIAL_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            letzteNachricht={letzteNachrichten[item.id] ?? ""}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={Trennlinie}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlatzhalter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#b0b0b8",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  textBereich: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  vorschau: {
    fontSize: 14,
    color: "#888",
  },
  trennlinie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e0e0e0",
    marginLeft: 82,
  },
});
