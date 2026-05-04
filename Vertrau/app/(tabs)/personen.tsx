// Dateiname: app/(tabs)/personen.tsx
import { API_URL } from "../../api";
import React, { useEffect, useState } from "react";
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
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolate,
} from "react-native-reanimated";
import { DEMO_PERSONEN, type Person } from "../../data/personen";

const ICON_SIZE = 40;

export function PersonenKarte({
  person,
  breite,
  hoehe,
}: {
  person: Person;
  breite: number;
  hoehe: number;
}) {
  const seitenPadding = 16;
  const spaltenGap = 20;
  const bildSpalteBreite = (breite - seitenPadding * 2) * 0.33;
  const infoSpalteBreite =
    breite - seitenPadding * 2 - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const slotHeight = hoehe / anzahlBilder;
  const bildKante = Math.min(bildSpalteBreite - 16, slotHeight - 8);

  const translateX = useSharedValue(0);
  const swipeLimit = bildSpalteBreite * 0.75;

  const onLikeAction = async () => {
    console.log(`${person.name} wurde geliked!`);

    try {
      await fetch(`${API_URL}/api/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: person.id,
        }),
      });
    } catch (error) {
      console.log("Like konnte nicht an Server gesendet werden:", error);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX(5)
    .onUpdate((event) => {
      translateX.value = Math.max(0, event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX > swipeLimit) {
        translateX.value = withSpring(bildSpalteBreite, {}, () => {
          runOnJS(onLikeAction)();
          translateX.value = withSpring(0);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStreifenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => {
    const fillHeight = interpolate(
      translateX.value,
      [0, swipeLimit],
      [0, ICON_SIZE],
      Extrapolate.CLAMP
    );

    return {
      height: fillHeight,
    };
  });

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
    <View
      style={{
        width: breite,
        height: hoehe,
        flexDirection: "row",
        paddingHorizontal: seitenPadding,
      }}
    >
      <View style={[styles.swipeBackground, { width: bildSpalteBreite }]}>
        <Animated.View
          style={[styles.iconWrapper, animatedIconContainerStyle]}
        >
          <Ionicons name="happy" size={ICON_SIZE} color="#D1D1D6" />

          <Animated.View
            style={[styles.yellowFillContainer, animatedFillStyle]}
          >
            <Ionicons name="happy" size={ICON_SIZE} color="#FFCC00" />
          </Animated.View>
        </Animated.View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.fotostreifen,
            animatedStreifenStyle,
            { width: bildSpalteBreite },
          ]}
        >
          {person.bilder.slice(0, anzahlBilder).map((bild, i) => (
            <View
              key={i}
              style={{
                height: slotHeight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {bild ? (
                <Image
                  source={{ uri: bild }}
                  style={{ width: bildKante, height: bildKante }}
                />
              ) : (
                <View
                  style={[
                    styles.platzhalter,
                    { width: bildKante, height: bildKante },
                  ]}
                >
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <View
        style={{
          width: infoSpalteBreite,
          paddingLeft: 12,
          paddingTop: 10,
        }}
      >
        <Text style={styles.nameText} numberOfLines={1}>
          {person.name}
        </Text>
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
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{m}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.infoLabel, { marginTop: 15 }]}>Hobbies</Text>
        <View style={styles.tagReihe}>
          {person.hobbies.map((h, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{h}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function PersonenScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [personen, setPersonen] = useState<Person[]>(DEMO_PERSONEN);

  useEffect(() => {
    fetch(`${API_URL}/api/personen`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonen(data);
        }
      })
      .catch((error) => {
        console.log("Personen konnten nicht geladen werden:", error);
        setPersonen(DEMO_PERSONEN);
      });
  }, []);

  const HEADER_HEIGHT = 44 + insets.top;
  const TAB_BAR = 49 + insets.bottom;
  const karteHoehe = height - HEADER_HEIGHT - TAB_BAR;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={personen}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={karteHoehe}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT,
          paddingBottom: TAB_BAR,
        }}
        renderItem={({ item }) => (
          <PersonenKarte person={item} breite={width} hoehe={karteHoehe} />
        )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  yellowFillContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  platzhalter: {
    backgroundColor: "#C7C7CC",
    justifyContent: "center",
    alignItems: "center",
  },
  nameText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  alterText: {
    fontSize: 15,
    color: "#8E8E93",
  },
  trenner: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoWert: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});