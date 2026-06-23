import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type ChatItem } from "../../data/chats";
import { ladeChats } from "../../api/chats";

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
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.6}>
      {/* Profilbild / Aktivitätsbild */}
      {chat.image ? (
        <Image source={{ uri: chat.image }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlatzhalter}>
          <Ionicons name="person" size={22} color="#a1a1a1" />
        </View>
      )}

      {/* Name + letzte Nachricht */}
      <View style={styles.textBereich}>
        <Text style={styles.name} numberOfLines={1}>
          {chat.name}
        </Text>
        <Text style={styles.vorschau} numberOfLines={1}>
          {letzteNachricht || "Noch keine Nachrichten..."}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.15)" />
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
  const insets = useSafeAreaInsets();
  const [letzteNachrichten, setLetzteNachrichten] = useState<Record<string, string>>({});
  const [alleChats, setAlleChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Beim Fokus die Chats aus dem Backend laden (GET /me/chats). Die Vorschau
  // (letzte Nachricht) kommt direkt mit, kein Extra-Call pro Chat.
  useFocusEffect(
    useCallback(() => {
      async function laden() {
        let chats: ChatItem[] = [];
        try {
          chats = await ladeChats();
        } catch {
          chats = [];
        }
        setAlleChats(chats);

        const eintraege: Record<string, string> = {};
        for (const chat of chats) {
          const letzte = chat.messages[chat.messages.length - 1];
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

  // Filterung für die Suchleiste
  const sichtbareChats = useMemo(() => {
    if (!searchQuery.trim()) return alleChats;
    return alleChats.filter((chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [alleChats, searchQuery]);

  return (
    <ImageBackground
      source={require("../../assets/images/pack8.jpg")} // Pfad zu deinem statischen Asset hier anpassen
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Minimalistischer Header mit SafeArea padding */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 40) }]}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Suchen..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Zusammenhängendes Glassmorphism-Panel ohne Lücken */}
        <View style={styles.listWrapper}>
          <FlatList
            data={sichtbareChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  // Minimalistische Glassmorphism-Suchleiste
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)", 
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
  },
  // Die umschließende "Glasscheibe" für die gesamte Liste
  listWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 30 : 20,
    borderRadius: 24,
    overflow: "hidden", // Verhindert, dass Ecken der Items herausragen
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  listContent: {
    paddingVertical: 4,
  },
  // Keine Abstände/Marginale mehr zwischen den Items
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "transparent",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlatzhalter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  textBereich: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  vorschau: {
    fontSize: 13,
    color: "#555",
  },
  trennlinie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginLeft: 80, // Schließt bündig nach dem Avatar ab
  },
});