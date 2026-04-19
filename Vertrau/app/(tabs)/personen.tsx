import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_PERSONEN, type Person } from "../../data/personen";

// ─── Bild-Platzhalter ─────────────────────────────────────────────────────────

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[styles.bildPlatzhalter, { width: size, height: size }]}>
      <Ionicons name="person" size={size * 0.5} color="#fff" style={{ marginTop: size * 0.08 }} />
    </View>
  );
}

// ─── Info-Zeile (Label + Wert) ────────────────────────────────────────────────

function InfoZeile({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={styles.infoZeile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoWert}>{wert}</Text>
    </View>
  );
}

// ─── Tag-Reihe ────────────────────────────────────────────────────────────────

function TagReihe({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.infoZeile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.tagReihe}>
        {items.map((item, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Personen-Karte ───────────────────────────────────────────────────────────

export function PersonenKarte({
  person,
  breite,
  hoehe,
}: {
  person: Person;
  breite: number;
  hoehe: number;
}) {
  // Seitenabstand und Spaltenaufteilung
  const seitenPadding = 16;
  const spaltenGap = 14;
  const innenBreite = breite - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.33; // ca. ein Drittel
  const infoSpalteBreite = innenBreite - bildSpalteBreite - spaltenGap;

  // Fotostreifen: 5 Bilder, dynamisch eingepasst damit alle sichtbar sind
  const anzahlBilder = 5;
  const bildAbstand = 8;
  const verfuegbarFuerBilder = hoehe - 32; // padding oben/unten abziehen
  const bildKanteNachHoehe =
    (verfuegbarFuerBilder - bildAbstand * (anzahlBilder - 1)) / anzahlBilder;
  // Bilder bleiben quadratisch – kleinere Seite gewinnt
  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);

  return (
    <View style={[styles.karte, { width: breite, height: hoehe }]}>
      <View style={[styles.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>
        {/* Linke Spalte: Fotostreifen */}
        <View style={{ width: bildSpalteBreite, gap: bildAbstand, alignItems: "center" }}>
          {person.bilder.slice(0, anzahlBilder).map((bild, i) =>
            bild ? (
              <Image
                key={i}
                source={{ uri: bild }}
                style={{
                  width: bildKante,
                  height: bildKante,
                  borderRadius: 14,
                }}
              />
            ) : (
              <View
                key={i}
                style={{
                  width: bildKante,
                  height: bildKante,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <BildPlatzhalter size={bildKante} />
              </View>
            )
          )}
        </View>

        {/* Rechte Spalte: Infos – fester Abstand (3 Zeilen) zwischen Feldern */}
        <View style={[styles.infoSpalte, { width: infoSpalteBreite }]}>
          <Text style={styles.nameText} numberOfLines={1}>
            {person.name}
          </Text>
          <Text style={styles.alterText}>{person.alter} Jahre</Text>

          <View style={styles.trennerOben} />

          <InfoZeile label="Bio" wert={person.kurzbeschreibung} />
          <InfoZeile label="Uni" wert={person.uni} />
          <InfoZeile label="Studiengang" wert={person.studiengang} />
          <TagReihe label="Module" items={person.module} />
          <TagReihe label="Hobbies" items={person.hobbies} />
        </View>
      </View>
    </View>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function PersonenScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const TAB_BAR = 49;

  // Exakter sichtbarer Bereich pro Profil – KEIN top padding oben (sonst
  // verschiebt sich der Abstand beim Swipen zwischen Profilen).
  const karteHoehe = height - insets.top - TAB_BAR - insets.bottom;

  return (
    <View style={[styles.hintergrund, { paddingTop: insets.top }]}>
      <FlatList
        data={DEMO_PERSONEN}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={karteHoehe}
        snapToAlignment="start"
        renderItem={({ item }) => (
          <PersonenKarte person={item} breite={width} hoehe={karteHoehe} />
        )}
        getItemLayout={(_, index) => ({
          length: karteHoehe,
          offset: karteHoehe * index,
          index,
        })}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: "#fff",
  },

  karte: {
    justifyContent: "flex-start",
    paddingTop: 16,
  },

  zeile: {
    flexDirection: "row",
    flex: 1,
    paddingBottom: 16,
  },

  // Rechte Spalte: alle Felder linksbündig, fester Abstand (3 Zeilen ≈ 45px)
  infoSpalte: {
    flex: 1,
    paddingTop: 4,
  },

  // Bild-Platzhalter (Apple-Kontakte-Stil)
  bildPlatzhalter: {
    backgroundColor: "#C7C7CC",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },

  // Infos rechts
  nameText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  alterText: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 2,
    fontWeight: "500",
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5ea",
  },
  trennerOben: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5ea",
    marginVertical: 10,
  },

  infoZeile: {
    marginBottom: 45, // ~3 Zeilen Abstand (lineHeight 15 × 3)
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoWert: {
    fontSize: 14,
    color: "#1a1a1a",
    lineHeight: 19,
  },

  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#1a1a1a",
    fontWeight: "500",
  },
});
