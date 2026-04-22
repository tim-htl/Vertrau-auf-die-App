import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import MaskedView from "@react-native-masked-view/masked-view"; // Installation: npx expo install @react-native-masked-view/masked-view
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate, 
  runOnJS,
  useDerivedValue
} from "react-native-reanimated";
import { DEMO_PERSONEN, type Person } from "../../data/personen";

/**
 * Hilfskomponente für den sich progressiv füllenden Smiley im Hintergrund
 */
const FillingSmiley = ({ progress, size, limit }: { progress: Animated.SharedValue<number>, size: number, limit: number }) => {
  const fillProgress = useDerivedValue(() => {
    // Mapping: Der Smiley füllt sich progressiv, während der Nutzer wischt (bis zum Limit)
    return interpolate(progress.value, [0, limit], [0, 1], "clamp");
  });

  const animatedFillStyle = useAnimatedStyle(() => ({
    height: `${fillProgress.value * 100}%`,
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* 1. Basis: Der graue Smiley im Hintergrund */}
      <Ionicons name="happy" size={size} color="#D1D1D6" style={StyleSheet.absoluteFill} />
      
      {/* 2. Maske: Gelbe Füllung über dem grauen Smiley */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={styles.maskContainer}>
            <Ionicons name="happy" size={size} color="black" />
          </View>
        }
      >
        <View style={styles.fillBackground}>
          <Animated.View style={[styles.yellowFill, animatedFillStyle]} />
        </View>
      </MaskedView>
    </View>
  );
};

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

  const translateX = useSharedValue(0);
  const swipeLimit = bildSpalteBreite * 0.75;
  const iconSize = 40;

  const onLike = () => { console.log("Geliked:", person.name); };

  const panGesture = Gesture.Pan()
    .activeOffsetX(5)
    .onUpdate((event) => {
      translateX.value = Math.max(0, event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX > swipeLimit) {
        translateX.value = withSpring(bildSpalteBreite, {}, () => {
          runOnJS(onLike)();
          translateX.value = withSpring(0);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStreifenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // NEU: Stil für den grünen Haken direkt AUF dem Fotostreifen
  const animatedCheckOnStreifenStyle = useAnimatedStyle(() => {
    // Der Haken blendet ein und skaliert hoch, sobald das Limit erreicht ist
    const opacity = interpolate(translateX.value, [swipeLimit * 0.9, swipeLimit], [0, 1], "clamp");
    const scale = interpolate(translateX.value, [swipeLimit * 0.9, swipeLimit], [0.6, 1], "clamp");
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={{ width: breite, height: hoehe, flexDirection: "row", paddingHorizontal: seitenPadding }}>
      
      {/* Hintergrund-Ebene: Der Smiley, der sich progressiv füllt */}
      <View style={[styles.swipeBackground, { width: bildSpalteBreite }]}>
        <View style={styles.centerIcon}>
          <FillingSmiley progress={translateX} size={iconSize} limit={swipeLimit} />
        </View>
      </View>

      {/* Vordergrund: Der interaktive Fotostreifen */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.fotostreifen, animatedStreifenStyle, { width: bildSpalteBreite }]}>
          
          {/* Die Bilder des Streifens */}
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

          {/* NEU: Der grüne Haken, der AUF dem Streifen erscheint */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.checkOverstreifen, animatedCheckOnStreifenStyle]}>
            <Ionicons name="checkmark-circle" size={50} color="#4CD964" />
          </Animated.View>

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
  const karteHoehe = height - (44 + insets.top) - (49 + insets.bottom);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={DEMO_PERSONEN}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={karteHoehe}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 44 + insets.top, paddingBottom: 49 + insets.bottom }}
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
    position: 'relative', // Wichtig für absoluten Haken
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
  centerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // NEU: Stil für den Haken, der ÜBER dem Streifen liegt
  checkOverstreifen: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 242, 247, 0.8)', // Halbtransparenter Hintergrund, um Bilder leicht zu verdecken
  },
  // MaskedView Styles
  maskContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  fillBackground: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  yellowFill: { backgroundColor: '#FFCC00', width: '100%' },
  // Rest
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