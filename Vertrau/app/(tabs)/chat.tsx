import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { INITIAL_CHATS, type ChatItem } from "../../data/chats";
import { DEMO_PERSONEN } from "../../data/personen";

export default function ChatScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [aktiveChats, setAktiveChats] = useState<ChatItem[]>([]);
  const [letzteNachrichten, setLetzteNachrichten] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      async function laden() {
        const keys = await AsyncStorage.getAllKeys();
        const chatKeys = keys.filter(k => k.startsWith("messages_v2_"));
        const chats: ChatItem[] = [];
        const vorschauen: Record<string, string> = {};

        for (const key of chatKeys) {
          const id = key.replace("messages_v2_", "");
          const raw = await AsyncStorage.getItem(key);
          const msgs = raw ? JSON.parse(raw) : [];
          
          let meta = INITIAL_CHATS.find(c => c.id === id);
          if (!meta) {
            const p = DEMO_PERSONEN.find(pers => pers.id === id);
            if (p) meta = { id: p.id, name: p.name, image: p.bilder[0] || "", messages: [] };
          }

          if (meta) {
            chats.push(meta);
            const letzte = msgs[msgs.length - 1];
            vorschauen[id] = letzte ? (letzte.fromMe ? "Du: " : "") + letzte.text : "Neues Match! 👋";
          }
        }
        setAktiveChats(chats);
        setLetzteNachrichten(vorschauen);
      }
      laden();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={aktiveChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: headerHeight }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item.id}`)}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.platzhalter]}><Ionicons name="person" size={24} color="#fff" /></View>
            )}
            <View style={styles.textBereich}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.vorschau} numberOfLines={1}>{letzteNachrichten[item.id]}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.trennlinie} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  item: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  platzhalter: { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" },
  textBereich: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700" },
  vorschau: { fontSize: 14, color: "#888" },
  trennlinie: { height: 1, backgroundColor: "#E5E5EA", marginLeft: 82 }
});