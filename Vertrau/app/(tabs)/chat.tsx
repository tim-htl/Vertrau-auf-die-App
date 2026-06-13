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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INITIAL_CHATS, type ChatItem, type Message } from "../../data/chats";
import { ladeJoinedAktivitaeten } from "../../data/joined";
import { ladeUserChats } from "../../data/userAktivitaeten";

async function ladeNachrichten(
  chatId: string,
  initialFallback: Message[]
): Promise<Message[]> {
  const key = `messages_v4_${chatId}`;
  const gespeichert = await AsyncStorage.getItem(key);
  if (gespeichert) return JSON.parse(gespeichert);
  await AsyncStorage.setItem(key, JSON.stringify(initialFallback));
  return initialFallback;
}

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
      {chat.image ? (
        <Image source={{ uri: chat.image }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlatzhalter}>
          <Ionicons name="person" size={28} color="#fff" style={{ marginTop: 6 }} />
        </View>
      )}

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

function Trennlinie() {
  return <View style={styles.trennlinie} />;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [letzteNachrichten, setLetzteNachrichten] = useState<
    Record<string, string>
  >({});
  const [sichtbareChats, setSichtbareChats] = useState<ChatItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function laden() {
        const joined = await ladeJoinedAktivitaeten();
        const userChats = await ladeUserChats();
        const alle = [...userChats, ...INITIAL_CHATS];
        const gefiltert = alle.filter((chat) => {
          if (chat.linkType !== "activity") return true;
          return !!chat.linkId && joined.includes(chat.linkId);
        });
        setSichtbareChats(gefiltert);

        const eintraege: Record<string, string> = {};
        for (const chat of gefiltert) {
          const nachrichten = await ladeNachrichten(chat.id, chat.messages);
          const letzte = nachrichten[nachrichten.length - 1];
          const vorschau = letzte
            ? letzte.text ?? (letzte.proposal ? "Treffens-Vorschlag" : "")
            : "";
          eintraege[chat.id] = letzte
            ? `${letzte.fromMe ? "Du: " : ""}${vorschau}`
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
        data={sichtbareChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            letzteNachricht={letzteNachrichten[item.id] ?? ""}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={Trennlinie}
        contentContainerStyle={{ paddingTop: insets.top + 44, paddingBottom: 110 }}
      />
    </View>
  );
}

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