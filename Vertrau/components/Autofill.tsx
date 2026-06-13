import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Selbsteingabe mit Autofill-Vorschlägen. Tippen filtert die Optionen,
// Tap auf einen Vorschlag meldet ihn via onWaehlen. Single- und
// Multi-Select bauen darauf auf (die Anzeige des Gewählten macht der
// Aufrufer). Bereits gewählte Einträge via `ausschliessen` ausblenden.

export function Autofill({
  optionen,
  onWaehlen,
  placeholder,
  ausschliessen = [],
  maxVorschlaege = 6,
}: {
  optionen: string[];
  onWaehlen: (wert: string) => void;
  placeholder: string;
  ausschliessen?: string[];
  maxVorschlaege?: number;
}) {
  const [suche, setSuche] = useState("");

  const treffer = suche.trim().length === 0
    ? []
    : optionen
        .filter(
          (o) =>
            !ausschliessen.includes(o) &&
            o.toLowerCase().includes(suche.trim().toLowerCase())
        )
        .slice(0, maxVorschlaege);

  function waehlen(wert: string) {
    onWaehlen(wert);
    setSuche("");
  }

  return (
    <View>
      <View style={stile.eingabeZeile}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={stile.eingabe}
          value={suche}
          onChangeText={setSuche}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          autoCorrect={false}
        />
        {suche.length > 0 && (
          <TouchableOpacity onPress={() => setSuche("")}>
            <Ionicons name="close-circle" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        )}
      </View>

      {treffer.length > 0 && (
        <View style={stile.vorschlaege}>
          {treffer.map((o, i) => (
            <TouchableOpacity
              key={o}
              style={[stile.vorschlag, i > 0 && stile.vorschlagTrenner]}
              onPress={() => waehlen(o)}
            >
              <Text style={stile.vorschlagText}>{o}</Text>
              <Ionicons name="add" size={18} color="#007AFF" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const stile = StyleSheet.create({
  eingabeZeile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  eingabe: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    padding: 0,
  },
  vorschlaege: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    overflow: "hidden",
  },
  vorschlag: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vorschlagTrenner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5ea",
  },
  vorschlagText: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
  },
});
