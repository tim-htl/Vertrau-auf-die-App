import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ImageBackground,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoStripCard } from "../../components/PhotoStripCard";
import { DEMO_PERSONEN, type Person } from "../../data/personen";
import { likePerson, resetSwipes } from "../../data/swipes";

const STATIC_BACKGROUND = require("/Users/lindadang/Desktop/Vertrau-auf-die-App/Vertrau/assets/images/pack9.jpg");

const SCREEN_BG = "#FFFFFF";
const CARD_BG = "rgba(255,255,255,0.12)";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const FUN_PINK = "#FF9A9E";
const FUN_GREEN = "#34C759";

const DISPLAY_FONT = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif-condensed",
  default: undefined,
});

const FUN_TYPO = {
  title: {
    fontFamily: DISPLAY_FONT,
    color: TEXT,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.9,
    textAlign: "center",
  },

  bannerTitle: {
    fontFamily: DISPLAY_FONT,
    color: "#fff",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  body: {
    fontFamily: DISPLAY_FONT,
    color: MUTED,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },

  button: {
    fontFamily: DISPLAY_FONT,
    color: TEXT,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
} as const;

function AppHintergrund({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ImageBackground
      source={STATIC_BACKGROUND}
      resizeMode="cover"
      style={[styles.hintergrund, style]}
      imageStyle={styles.hintergrundBild}
    >
      <View pointerEvents="none" style={styles.hintergrundOverlay} />
      {children}
    </ImageBackground>
  );
}

function SwipeKarte({
  person,
  breite,
  hoehe,
  onLike,
  onOeffnen,
  onPanAktiv,
}: {
  person: Person;
  breite: number;
  hoehe: number;
  onLike: () => void;
  onOeffnen: () => void;
  onPanAktiv?: (aktiv: boolean) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const schwelle = breite * 0.35;

  const onLikeRef = useRef(onLike);
  onLikeRef.current = onLike;

  const onPanAktivRef = useRef(onPanAktiv);
  onPanAktivRef.current = onPanAktiv;

  const zurueckFedern = () =>
    Animated.spring(translateX, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => onPanAktivRef.current?.(true),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => {
        translateX.setValue(g.dx > 0 ? g.dx : g.dx / 5);
      },
      onPanResponderRelease: (_e, g) => {
        onPanAktivRef.current?.(false);

        if (g.dx > schwelle) {
          Animated.timing(translateX, {
            toValue: breite * 1.3,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onLikeRef.current());
        } else {
          zurueckFedern();
        }
      },
      onPanResponderTerminate: () => {
        onPanAktivRef.current?.(false);
        zurueckFedern();
      },
    })
  ).current;

  const rotation = translateX.interpolate({
    inputRange: [-breite, 0, breite],
    outputRange: ["-6deg", "0deg", "6deg"],
  });

  const ladung = translateX.interpolate({
    inputRange: [0, schwelle],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const ladeSkala = translateX.interpolate({
    inputRange: [0, schwelle],
    outputRange: [0.4, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={{ width: breite, height: hoehe }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ladeFlaeche, { height: hoehe, opacity: ladung }]}
      >
        <Animated.View
          style={[
            styles.ladeKreis,
            styles.neuSoftStrong,
            { transform: [{ scale: ladeSkala }] },
          ]}
        >
          <Ionicons name="people" size={44} color={FUN_GREEN} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          backgroundColor: "transparent",
          transform: [{ translateX }, { rotate: rotation }],
        }}
      >
        <Pressable onPress={onOeffnen}>
          <PhotoStripCard
            name={person.name}
            alter={person.alter}
            bio={person.kurzbeschreibung}
            uni={person.uni}
            studiengang={person.studiengang}
            module={person.module}
            hobbies={person.hobbies}
            bilder={person.bilder}
            cardHeight={hoehe}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function PersonenScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const headerHeight = insets.top + 10;
  const bottomBarHeight = 80;
  const karteHoehe = height - headerHeight - bottomBarHeight;

  const [feed, setFeed] = useState<Person[] | null>(null);
  const [listeScrollbar, setListeScrollbar] = useState(true);
  const [matchInfo, setMatchInfo] = useState<{
    name: string;
    chatId: string;
  } | null>(null);

  const bannerY = useRef(new Animated.Value(-120)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFeed(DEMO_PERSONEN);

    return () => {
      if (bannerTimer.current) {
        clearTimeout(bannerTimer.current);
      }
    };
  }, []);

  function zeigeMatchBanner(name: string, chatId: string) {
    setMatchInfo({ name, chatId });

    Animated.spring(bannerY, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();

    if (bannerTimer.current) {
      clearTimeout(bannerTimer.current);
    }

    bannerTimer.current = setTimeout(verbergeMatchBanner, 4000);
  }

  function verbergeMatchBanner() {
    Animated.timing(bannerY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setMatchInfo(null));
  }

  async function personGeliked(person: Person) {
    setFeed((f) => (f ? f.filter((p) => p.id !== person.id) : f));

    const ergebnis = await likePerson(person);

    if (ergebnis.match && ergebnis.chatId) {
      zeigeMatchBanner(person.name, ergebnis.chatId);
    }
  }

  async function demoZuruecksetzen() {
    await resetSwipes();
    setFeed(DEMO_PERSONEN);
  }

  if (feed === null) {
    return <AppHintergrund />;
  }

  if (feed.length === 0) {
    return (
      <AppHintergrund style={[styles.leerContainer, { paddingTop: headerHeight }]}> 
        <View style={[styles.leerKarte, styles.karteSchatten]}>
          <View style={styles.leerKarteInnen}>
            <BlurView tint="light" intensity={34} style={StyleSheet.absoluteFill} />
            <View style={styles.leerGlasPanel} />

            <View style={[styles.leerIconBubble, styles.neuSoftStrong]}>
              <Ionicons name="people-outline" size={42} color={FUN_PINK} />
            </View>

            <Text style={styles.leerTitel} numberOfLines={2}>
              für heute warst du genug am Handy :)
            </Text>

            <Text style={styles.leerText} numberOfLines={2}>
              gönn dir eine Pause — morgen warten neue Leute auf dich.
            </Text>

            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.resetKnopf, styles.neuSoft]}
              onPress={demoZuruecksetzen}
            >
              <Text style={styles.resetKnopfText}>Demo zurücksetzen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppHintergrund>
    );
  }

  return (
    <AppHintergrund>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        pagingEnabled
        scrollEnabled={listeScrollbar}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={karteHoehe}
        style={styles.liste}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: bottomBarHeight,
        }}
        renderItem={({ item }) => (
          <SwipeKarte
            person={item}
            breite={width}
            hoehe={karteHoehe}
            onLike={() => personGeliked(item)}
            onOeffnen={() => router.push(`/person/${item.id}`)}
            onPanAktiv={(aktiv) => setListeScrollbar(!aktiv)}
          />
        )}
      />

      {matchInfo && (
        <Animated.View
          style={[
            styles.matchBanner,
            {
              top: headerHeight + 8,
              transform: [{ translateY: bannerY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.matchBannerInhalt, styles.neuMatch]}
            onPress={() => {
              verbergeMatchBanner();
              router.push(`/chat/${matchInfo.chatId}`);
            }}
          >
            <View style={styles.matchIconBubble}>
              <Ionicons name="people" size={22} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.matchBannerTitel} numberOfLines={1}>
                Ihr seid jetzt Freunde! 🎉
              </Text>

              <Text style={styles.matchBannerText} numberOfLines={2}>
                {matchInfo.name} hat dich auch geliked.
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </AppHintergrund>
  );
}

const styles = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },

  hintergrundBild: {
    opacity: 1,
  },

  hintergrundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  liste: {
    backgroundColor: "transparent",
  },

  karteSchatten: {
    borderRadius: 0,
    backgroundColor: CARD_BG,
    elevation: 0,
  },

  neuSoft: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.5,
    shadowRadius: 7,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
  },

  neuSoftStrong: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 5 },
    elevation: 5,
  },

  neuMatch: {
    shadowColor: "#1E9E4A",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 5 },
    elevation: 6,
  },

  ladeFlaeche: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
  },

  ladeKreis: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(232,248,238,0.86)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
  },

  matchBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },

  matchBannerInhalt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(52,199,89,0.93)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
  },

  matchIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  matchBannerTitel: {
    ...FUN_TYPO.bannerTitle,
  },

  matchBannerText: {
    fontFamily: DISPLAY_FONT,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 1,
  },

  leerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  leerKarte: {
    width: "100%",
    maxWidth: 360,
    height: 342,
  },

  leerKarteInnen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.60)",
    paddingHorizontal: 24,
  },

  leerGlasPanel: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 8,
    width: "43%",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
  },

  leerIconBubble: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    marginBottom: 12,
  },

  leerTitel: {
    ...FUN_TYPO.title,
    marginTop: 2,
  },

  leerText: {
    ...FUN_TYPO.body,
    marginTop: 8,
    maxWidth: 270,
  },

  resetKnopf: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },

  resetKnopfText: {
    ...FUN_TYPO.button,
  },
});
