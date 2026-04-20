import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_PERSONEN, type Person } from "../../data/personen";

export function PersonenKarte({ person, breite, hoehe }: { person: Person, breite: number, hoehe: number }) {
  const seitenPadding = 16;
  const spaltenGap = 20;
  const bildSpalteBreite = (breite - seitenPadding * 2) * 0.33;
  const infoSpalteBreite = (breite - seitenPadding * 2) - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const kartenGap = 8;
  // Mathematik für den unendlichen Streifen: Jedes Bild bekommt exakt 1/5 der Kartenhöhe
  const slotHeight = hoehe / anzahlBilder; 
  const bildKante = Math.min(bildSpalteBreite - 16, slotHeight - kartenGap);

  return (
    <View style={{ width: breite, height: hoehe, flexDirection: "row", paddingHorizontal: seitenPadding }}>
      
      {/* Unendlicher Photostreifen (100% Höhe, keine Ränder oben/unten) */}
      <View style={[styles.fotostreifen, { width: bildSpalteBreite }]}>
        {person.bilder.slice(0, anzahlBilder).map((bild: string | null, i: number) => (
          <View key={i} style={{ height: slotHeight, justifyContent: 'center', alignItems: 'center' }}>
            {bild ? (
              <Image source={{ uri: bild }} style={{ width: bildKante, height: bildKante }} />
            ) : (
              <View style={[styles.platzhalter, { width: bildKante, height: bildKante }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Rechte Info-Spalte mit KOMPLETTEM Steckbrief */}
      <View style={{ width: infoSpalteBreite, paddingLeft: 12, paddingTop: 10 }}>
        <Text style={styles.nameText} numberOfLines={1}>{person.name}</Text>
        <Text style={styles.alterText}>{person.alter} Jahre</Text>
        
        <View style={styles.trenner} />
        
        <Text style={styles.infoLabel}>Bio</Text>
        <Text style={styles.infoWert}>{person.kurzbeschreibung}</Text>
        
        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Uni</Text>
        <Text style={styles.infoWert}>{person.uni}</Text>

        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Studiengang</Text>
        <Text style={styles.infoWert}>{person.studiengang}</Text>

        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Module</Text>
        <View style={styles.tagReihe}>
          {person.module.map((m: string, i: number) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{m}</Text></View>
          ))}
        </View>

        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Hobbies</Text>
        <View style={styles.tagReihe}>
          {person.hobbies.map((h: string, i: number) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{h}</Text></View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function PersonenScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Exakte Höhen berechnen, damit nichts verdeckt wird
  const HEADER_HEIGHT = 44 + insets.top;
  const TAB_BAR = 49 + insets.bottom;
  // Die Karte ist genau so hoch wie der sichtbare Bereich zwischen Header und Tab-Bar
  const karteHoehe = height - HEADER_HEIGHT - TAB_BAR;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={DEMO_PERSONEN}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={karteHoehe}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        // Content startet genau UNTER dem Header
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: TAB_BAR }}
        renderItem={({ item }) => <PersonenKarte person={item} breite={width} hoehe={karteHoehe} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fotostreifen: { backgroundColor: "#F2F2F7", borderRightWidth: 2, borderRightColor: "#D1D1D6" },
  platzhalter: { backgroundColor: "#C7C7CC", justifyContent: "center", alignItems: "center" },
  nameText: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  alterText: { fontSize: 15, color: "#8E8E93" },
  trenner: { height: 1, backgroundColor: "#E5E5EA", marginVertical: 12 },
  infoLabel: { fontSize: 11, fontWeight: "700", color: "#8E8E93", textTransform: "uppercase", marginBottom: 4 },
  infoWert: { fontSize: 14, color: "#1a1a1a" },
  tagReihe: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "#F2F2F7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  tagText: { fontSize: 12, fontWeight: "500" }
});