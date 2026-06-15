import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  PanResponder,
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
import { hobbyIcon } from "../../data/hobbies";
import { DEMO_PERSONEN, type Person } from "../../data/personen";
import { likePerson, resetSwipes } from "../../data/swipes";

// Put the uploaded image into your project here:
// assets/images/static-background.jpeg
// If your screen file is in another folder, adjust this relative path.
const STATIC_BACKGROUND = require("../../assets/images/pack9.jpg");

const SCREEN_BG = "#FFFFFF";
const CARD_BG = "rgba(255,255,255,0.12)";
const PHOTO_STRIP_GLASS_BG = "rgba(255,255,255,0.90)";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const LINE = "rgba(35, 35, 35, 0.12)";

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

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[styles.bildPlatzhalter, styles.neuSoftInset, { width: size, height: size }]}> 
      <Ionicons name="person" size={size * 0.5} color="#C7C7CC" style={{ marginTop: size * 0.08 }} />
    </View>
  );
}

function InfoZeile({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={styles.infoZeile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoWert}>{wert}</Text>
    </View>
  );
}

function TagReihe({
  label,
  items,
  mitIcons = false,
}: {
  label: string;
  items: string[];
  mitIcons?: boolean;
}) {
  return (
    <View style={styles.infoZeile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.tagReihe}>
        {items.map((item, i) => (
          <View key={i} style={[styles.tag, styles.neuSoft]}>
            {mitIcons && (
              <Ionicons name={hobbyIcon(item)} size={12} color={TEXT} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PersonenKarte({
  person,
  breite,
  hoehe,
}: {
  person: Person;
  breite: number;
  hoehe: number;
}) {
  const cardBreite = breite;
  const cardHoehe = hoehe;

  const seitenPadding = 18;
  const stripLinksAbstand = 10;
  const stripRechtsPadding = 10;
  const spaltenGap = 26;
  const innenBreite = cardBreite - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.28;

  const glasBreite =
    seitenPadding - stripLinksAbstand + bildSpalteBreite + stripRechtsPadding;
  const infoSpalteBreite = innenBreite - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const bildAbstand = 8;
  const verfuegbarFuerBilder = cardHoehe - 34;
  const bildKanteNachHoehe =
    (verfuegbarFuerBilder - bildAbstand * (anzahlBilder - 1)) / anzahlBilder;
  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);

  return (
    <View style={[styles.karteAussen, { width: breite, height: hoehe }]}> 
      <View style={[styles.karteSchatten, { width: cardBreite, height: cardHoehe }]}> 
        <View style={styles.karteClip}>
          <BlurView
            pointerEvents="none"
            tint="light"
            intensity={62}
            style={[styles.glasPanel, { left: stripLinksAbstand, width: glasBreite }]}
          >
            <View style={styles.glasWeiss} />
          </BlurView>

          <View style={[styles.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}> 
            <View style={{ width: bildSpalteBreite, gap: bildAbstand, alignItems: "center" }}> 
              {person.bilder.slice(0, anzahlBilder).map((bild, i) =>
                bild ? (
                  <View
                    key={i}
                    style={[styles.bildRahmen, styles.neuSoft, { width: bildKante, height: bildKante }]}
                  >
                    <Image source={{ uri: bild }} style={styles.bild} />
                  </View>
                ) : (
                  <View
                    key={i}
                    style={[styles.bildRahmen, styles.neuSoft, { width: bildKante, height: bildKante }]}
                  >
                    <BildPlatzhalter size={bildKante} />
                  </View>
                )
              )}
            </View>

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
              <TagReihe label="Hobbies" items={person.hobbies} mitIcons />
            </View>
          </View>
        </View>
      </View>
    </View>
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
      <Animated.View style={[styles.ladeFlaeche, { height: hoehe, opacity: ladung }]} pointerEvents="none">
        <Animated.View style={[styles.ladeKreis, styles.neuSoftStrong, { transform: [{ scale: ladeSkala }] }]}> 
          <Ionicons name="people" size={44} color="#34C759" />
        </Animated.View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{ backgroundColor: "transparent", transform: [{ translateX }, { rotate: rotation }] }}
      >
        <Pressable onPress={onOeffnen}>
          <PersonenKarte person={person} breite={breite} hoehe={hoehe} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function PersonenScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Angepasst an den neuen schmalen Header und die TabBar Höhe
  const headerHeight = insets.top + 10;
  const bottomBarHeight = 80;
  const karteHoehe = height - headerHeight - bottomBarHeight;

  const [feed, setFeed] = useState<Person[] | null>(null);
  const [listeScrollbar, setListeScrollbar] = useState(true);
  const [matchInfo, setMatchInfo] = useState<{ name: string; chatId: string } | null>(null);
  const bannerY = useRef(new Animated.Value(-120)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFeed(DEMO_PERSONEN);
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  function zeigeMatchBanner(name: string, chatId: string) {
    setMatchInfo({ name, chatId });
    Animated.spring(bannerY, { toValue: 0, friction: 7, useNativeDriver: true }).start();
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(verbergeMatchBanner, 4000);
  }

  function verbergeMatchBanner() {
    Animated.timing(bannerY, { toValue: -120, duration: 250, useNativeDriver: true }).start(() =>
      setMatchInfo(null)
    );
  }

  async function personGeliked(person: Person) {
    setFeed((f) => (f ? f.filter((p) => p.id !== person.id) : f));
    const ergebnis = await likePerson(person);
    if (ergebnis.match && ergebnis.chatId) zeigeMatchBanner(person.name, ergebnis.chatId);
  }

  async function demoZuruecksetzen() {
    await resetSwipes();
    setFeed(DEMO_PERSONEN);
  }

  if (feed === null) return <AppHintergrund />;

  if (feed.length === 0) {
    return (
      <AppHintergrund
        style={[
          styles.leerContainer,
          { paddingTop: headerHeight },
        ]}
      >
        <View style={[styles.leerKarte, styles.karteSchatten]}> 
          <View style={styles.leerKarteInnen}>
            <BlurView tint="light" intensity={34} style={StyleSheet.absoluteFill} />
            <View style={styles.leerGlasPanel} />
            <Ionicons name="people-outline" size={48} color="#C7C7CC" />

            <Text style={styles.leerTitel}>
              für heute warst du genug am Handy :)
            </Text>

            <TouchableOpacity
              style={[styles.resetKnopf, styles.neuSoft]}
              onPress={demoZuruecksetzen}
            >
              <Text style={styles.resetKnopfText}>
                Demo zurücksetzen
              </Text>
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
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: bottomBarHeight }}
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
        <Animated.View style={[styles.matchBanner, { top: headerHeight + 8, transform: [{ translateY: bannerY }] }]}> 
          <TouchableOpacity
            style={[styles.matchBannerInhalt, styles.neuMatch]}
            onPress={() => {
              verbergeMatchBanner();
              router.push(`/chat/${matchInfo.chatId}`);
            }}
          >
            <Ionicons name="people" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.matchBannerTitel}>Ihr seid jetzt Freunde! 🎉</Text>
              <Text style={styles.matchBannerText}>{matchInfo.name} hat dich auch geliked.</Text>
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
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  liste: {
    backgroundColor: "transparent",
  },
  karteAussen: {
    alignItems: "center",
    justifyContent: "center",
  },
  karteSchatten: {
    borderRadius: 0,
    backgroundColor: CARD_BG,
    elevation: 0,
  },
  karteClip: {
    flex: 1,
    overflow: "hidden",
  },
  glasPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderColor: "white",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 0,
    zIndex: 2,
  },
  glasWeiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  neuSoft: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.50,
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
  neuSoftInset: {
    shadowColor: "#BFC5CC",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 2,
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
    backgroundColor: "rgba(52,199,89,0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  matchBannerTitel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  matchBannerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
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
    height: 320,
  },
  leerKarteInnen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.60)",
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
  leerTitel: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
    marginTop: 8,
  },
  leerText: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
  },
  resetKnopf: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
  },
  resetKnopfText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  zeile: {
    flexDirection: "row",
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 3,
  },
  infoSpalte: {
    flex: 1,
    paddingTop: 4,
  },
  bildRahmen: {
    backgroundColor: "rgba(255,255,255,0.36)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.64)",
  },
  bild: {
    width: "100%",
    height: "100%",
  },
  bildPlatzhalter: {
    backgroundColor: "rgba(245,245,245,0.50)",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  nameText: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: -0.5,
  },
  alterText: {
    fontSize: 15,
    color: MUTED,
    marginTop: 2,
    fontWeight: "500",
  },
  trennerOben: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: 10,
  },
  infoZeile: {
    marginBottom: 45,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoWert: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 19,
  },
  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)",
  },
  tagText: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "500",
  },
});