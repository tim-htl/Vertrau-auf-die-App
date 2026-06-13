import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hobbyIcon } from "../../data/hobbies";
import { DEMO_PERSONEN, type Person } from "../../data/personen";
import { ladeGelikte, likePerson, resetSwipes } from "../../data/swipes";

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[styles.bildPlatzhalter, styles.neuSoftInset, { width: size, height: size }]}>
      <Ionicons name="person" size={size * 0.5} color="#fff" style={{ marginTop: size * 0.08 }} />
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
              <Ionicons name={hobbyIcon(item)} size={12} color="#1a1a1a" style={{ marginRight: 4 }} />
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
  const seitenPadding = 16;
  const spaltenGap = 14;
  const innenBreite = breite - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.33;
  const infoSpalteBreite = innenBreite - bildSpalteBreite - spaltenGap;

  const anzahlBilder = 5;
  const bildAbstand = 8;
  const verfuegbarFuerBilder = hoehe - 32;
  const bildKanteNachHoehe =
    (verfuegbarFuerBilder - bildAbstand * (anzahlBilder - 1)) / anzahlBilder;
  const bildKante = Math.min(bildSpalteBreite, bildKanteNachHoehe);

  return (
    <View style={[styles.karte, styles.neuCard, { width: breite, height: hoehe }]}>
      <View style={[styles.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>
        <View style={{ width: bildSpalteBreite, gap: bildAbstand, alignItems: "center" }}>
          {person.bilder.slice(0, anzahlBilder).map((bild, i) =>
            bild ? (
              <View
                key={i}
                style={[
                  styles.bildRahmen,
                  styles.neuSoft,
                  {
                    width: bildKante,
                    height: bildKante,
                    borderRadius: 14,
                  },
                ]}
              >
                <Image
                  source={{ uri: bild }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 14,
                  }}
                />
              </View>
            ) : (
              <View
                key={i}
                style={[
                  styles.bildRahmen,
                  styles.neuSoft,
                  {
                    width: bildKante,
                    height: bildKante,
                    borderRadius: 14,
                  },
                ]}
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
        style={[styles.ladeFlaeche, { height: hoehe, opacity: ladung }]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.ladeKreis, styles.neuSoftStrong, { transform: [{ scale: ladeSkala }] }]}>
          <Ionicons name="people" size={44} color="#34C759" />
        </Animated.View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          backgroundColor: "#F4F5F7",
          transform: [{ translateX }, { rotate: rotation }],
        }}
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

  const headerHeight = insets.top + 44;
  const bottomBarHeight = 100;
  const karteHoehe = height - headerHeight - bottomBarHeight;

  const [feed, setFeed] = useState<Person[] | null>(null);
  const [listeScrollbar, setListeScrollbar] = useState(true);
  const [matchInfo, setMatchInfo] = useState<{ name: string; chatId: string } | null>(null);

  const bannerY = useRef(new Animated.Value(-120)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ladeGelikte().then((gelikte) =>
      setFeed(DEMO_PERSONEN.filter((p) => !gelikte.includes(p.id)))
    );

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
    Animated.timing(bannerY, { toValue: -120, duration: 250, useNativeDriver: true }).start(
      () => setMatchInfo(null)
    );
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
    return <View style={styles.hintergrund} />;
  }

  if (feed.length === 0) {
    return (
      <View style={[styles.hintergrund, styles.leerContainer, { paddingTop: headerHeight }]}>
        <Ionicons name="people-outline" size={48} color="#C7C7CC" />
        <Text style={styles.leerTitel}>Keine weiteren Profile</Text>
        <Text style={styles.leerText}>Du hast alle Profile durchgeswiped.</Text>

        <TouchableOpacity style={[styles.resetKnopf, styles.neuSoft]} onPress={demoZuruecksetzen}>
          <Text style={styles.resetKnopfText}>Demo zurücksetzen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.hintergrund}>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        pagingEnabled
        scrollEnabled={listeScrollbar}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={karteHoehe}
        snapToAlignment="start"
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
        getItemLayout={(_, index) => ({
          length: karteHoehe,
          offset: karteHoehe * index,
          index,
        })}
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
            style={[styles.matchBannerInhalt, styles.neuMatch]}
            activeOpacity={0.85}
            onPress={() => {
              const chatId = matchInfo.chatId;
              verbergeMatchBanner();
              router.push(`/chat/${chatId}`);
            }}
          >
            <Ionicons name="people" size={22} color="#fff" />

            <View style={{ flex: 1 }}>
              <Text style={styles.matchBannerTitel}>Ihr seid jetzt Freunde! 🎉</Text>
              <Text style={styles.matchBannerText}>
                {matchInfo.name} hat dich auch geliked — tippe, um zu chatten.
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },

  neuSoft: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.75,
    shadowRadius: 5,
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

  neuCard: {
    backgroundColor: "#F4F5F7",
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
    backgroundColor: "#E8F8EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
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
    backgroundColor: "#34C759",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
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
    gap: 8,
    paddingHorizontal: 32,
  },

  leerTitel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 8,
  },

  leerText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },

  resetKnopf: {
    marginTop: 16,
    backgroundColor: "#F4F5F7",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },

  resetKnopfText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
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

  infoSpalte: {
    flex: 1,
    paddingTop: 4,
  },

  bildRahmen: {
    backgroundColor: "#F4F5F7",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },

  bildPlatzhalter: {
    backgroundColor: "#C7C7CC",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },

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
    backgroundColor: "#DDE1E6",
  },

  trennerOben: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDE1E6",
    marginVertical: 10,
  },

  infoZeile: {
    marginBottom: 45,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F5F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },

  tagText: {
    fontSize: 12,
    color: "#1a1a1a",
    fontWeight: "500",
  },
});