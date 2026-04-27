// Dateiname: app/(tabs)/personen.tsx

import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate, 
  runOnJS,
  Extrapolate
} from "react-native-reanimated";
import { DEMO_PERSONEN, type Person } from "../../data/personen";

const ICON_SIZE = 40; // Größe des Smileys

/**
 * Karte für eine einzelne Person mit Swipe-Aktion auf dem Fotostreifen
 */
export function PersonenKarte({ person, breite, hoehe }: { person: Person, breite: number, hoehe: number }) {
  const seitenPadding = 16;
  const spaltenGap = 20;
  const bildSpalteBreite = (breite - seitenPadding * 2) * 0.33;
  const infoSpalteBreite = (breite - seitenPadding * 2) - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const slotHeight = hoehe / anzahlBilder; 
  const bildKante = Math.min(bildSpalteBreite - 16, slotHeight - 8);

  // Shared Value für die Verschiebung
  const translateX = useSharedValue(0);
  const swipeLimit = bildSpalteBreite * 0.75;

  const onLikeAction = () => {
    console.log(`${person.name} wurde geliked!`);
  };

  // Geste definieren
  const panGesture = Gesture.Pan()
    .activeOffsetX(5) // Erlaubt vertikales Scrollen der FlatList weiterhin
    .onUpdate((event) => {
      // Nur nach rechts wischen erlauben (positiver Wert)
      translateX.value = Math.max(0, event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX > swipeLimit) {
        // Erfolgreicher Swipe: Animation beenden und Aktion auslösen
        translateX.value = withSpring(bildSpalteBreite, {}, () => {
          runOnJS(onLikeAction)();
          translateX.value = withSpring(0);
        });
      } else {
        // Zurückschnellen
        translateX.value = withSpring(0);
      }
    });

  // Animierter Stil für den Fotostreifen
  const animatedStreifenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // === FÜLL-EFFEKT LOGIK ===
  
  // Stil für den Container des gelben Smileys
  // Wir animieren die HÖHE von 0 auf ICON_SIZE, um den Füll-Effekt zu erzeugen
  const animatedFillStyle = useAnimatedStyle(() => {
    const fillHeight = interpolate(
      translateX.value,
      [0, swipeLimit], // Eingabe: Swipe-Weg
      [0, ICON_SIZE],    // Ausgabe: Höhe des gelben Icons
      Extrapolate.CLAMP  // Verhindert, dass die Höhe größer als das Icon wird
    );

    return {
      height: fillHeight,
    };
  });

  // Stil für den gesamten Smiley-Container (für leichtes Pulsieren)
  const animatedIconContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value, 
      [0, swipeLimit], 
      [0.9, 1.2], 
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={{ width: breite, height: hoehe, flexDirection: "row", paddingHorizontal: seitenPadding }}>
      
      {/* Hintergrund-Ebene: Der Smiley, der sich füllt */}
      <View style={[styles.swipeBackground, { width: bildSpalteBreite }]}>
        <Animated.View style={[styles.iconWrapper, animatedIconContainerStyle]}>
          
          {/* 1. Das graue Basis-Icon (Hintergrund, immer sichtbar) */}
          <Ionicons name="happy" size={ICON_SIZE} color="#D1D1D6" />

          {/* 2. Das gelbe Icon in einem animierten Container (Vordergrund) */}
          {/* overflow: 'hidden' ist entscheidend, damit nur der untere Teil gelb wird */}
          <Animated.View style={[styles.yellowFillContainer, animatedFillStyle]}>
            <Ionicons name="happy" size={ICON_SIZE} color="#FFCC00" />
          </Animated.View>

          {/* 3. Ein grüner Haken, der erscheint, wenn das Limit erreicht ist */}
          {translateX.value > swipeLimit && (
            <View style={styles.checkmarkOverlay}>
              <Ionicons name="checkmark-circle" size={ICON_SIZE} color="#34C759" />
            </View>
          )}

        </Animated.View>
      </View>

      {/* Vordergrund: Der interaktive Fotostreifen */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.fotostreifen, animatedStreifenStyle, { width: bildSpalteBreite }]}>
          {person.bilder.slice(0, anzahlBilder).map((bild, i) => (
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
        </Animated.View>
      </GestureDetector>

      {/* Rechte Info-Spalte */}
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
          {person.module.map((m, i) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{m}</Text></View>
          ))}
        </View>

        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Hobbies</Text>
        <View style={styles.tagReihe}>
          {person.hobbies.map((h, i) => (
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
  
  const HEADER_HEIGHT = 44 + insets.top;
  const TAB_BAR = 49 + insets.bottom;
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
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: TAB_BAR }}
        renderItem={({ item }) => <PersonenKarte person={item} breite={width} hoehe={karteHoehe} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fotostreifen: { 
    backgroundColor: "#F2F2F7", 
    borderRightWidth: 2, 
    borderRightColor: "#D1D1D6",
    zIndex: 2,
  },
  swipeBackground: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowFillContainer: {
    position: 'absolute',
    bottom: 0, // Wichtig: Füllt von unten auf
    left: 0,
    right: 0,
    overflow: 'hidden', // Schneidet das Icon ab, wenn die Höhe kleiner ist
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F2F2F7', // Gleiche Farbe wie der Hintergrund, um den Smiley zu verdecken
  },
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