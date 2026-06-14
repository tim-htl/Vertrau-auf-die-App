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
import { likePerson, resetSwipes } from "../../data/swipes";

const SCREEN_BG = "#FFFFFF";
const CARD_BG = "#FFFFFF";
const GLASS_BG = "rgba(255,255,255,0.64)";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const LINE = "rgba(35, 35, 35, 0.1)";

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View style={[styles.bildPlatzhalter, styles.neuSoftInset, { width: size, height: size }]}>
      <Ionicons name="person" size={size * 0.5} color="#ccc" style={{ marginTop: size * 0.08 }} />
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

  const seitenPadding = 16;
  const spaltenGap = 14;
  const trennerBreite = StyleSheet.hairlineWidth;

  const innenBreite = cardBreite - seitenPadding * 2;
  const bildSpalteBreite = innenBreite * 0.34;
  const glasBreite = seitenPadding + bildSpalteBreite + spaltenGap * 0.75;
  const infoSpalteBreite =
    innenBreite - bildSpalteBreite - spaltenGap * 2 - trennerBreite;

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
          <View pointerEvents="none" style={[styles.glasPanel, { width: glasBreite }]}>
            <View style={styles.glasMilch} />
          </View>

          <View style={[styles.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>
            <View style={{ width: bildSpalteBreite, gap: bildAbstand, alignItems: "center" }}>
              {person.bilder.slice(0, anzahlBilder).map((bild, i) =>
                bild ? (
                  <View
                    key={i}
                    style={[styles.bildRahmen, styles.neuSoft, { width: bildKante, height: bildKante }]}
                  >
                    <Image source={{ uri: bild }} style={{ width: "100%", height: "100%" }} />
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

            <View style={styles.vertikalerTrenner} />

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
        style={{ backgroundColor: SCREEN_BG, transform: [{ translateX }, { rotate: rotation }] }}
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
    // Demo immer mit allen Personen starten, nicht nur mit den noch nicht gelikten.
    // So erscheinen auch die anderen Personen wieder neben Lena Fischer.
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
    Animated.timing(bannerY, { toValue: -120, duration: 250, useNativeDriver: true }).start(() => setMatchInfo(null));
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

  if (feed === null) return <View style={styles.hintergrund} />;

  if (feed.length === 0) {
    return (
      <View
        style={[
          styles.hintergrund,
          styles.leerContainer,
          { paddingTop: headerHeight },
        ]}
      >
        <TouchableOpacity
          style={[styles.profilKnopf, { top: insets.top + 10 }]}
          onPress={() => router.push("/profil")}
        >
          <Ionicons name="person-circle" size={40} color={TEXT} />
        </TouchableOpacity>
  
        <View style={[styles.leerKarte, styles.karteSchatten]}>
          <View style={styles.leerKarteInnen}>
            <View style={styles.leerGlasPanel} />
            <Ionicons name="people-outline" size={48} color="#C7C7CC" />
  
            <Text style={styles.leerTitel}>
              für heute warst du genug am Handy :)
            </Text>
  
            <TouchableOpacity
              style={[styles.resetKnopf, styles.neuSoft]}
              onPress={async () => {
                await resetSwipes();
                setFeed(DEMO_PERSONEN);
              }}
            >
              <Text style={styles.resetKnopfText}>
                Demo zurücksetzen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.hintergrund}>
      <TouchableOpacity style={[styles.profilKnopf, { top: insets.top + 10 }]} onPress={() => router.push("/profil")}>
        <Ionicons name="person-circle" size={40} color={TEXT} />
      </TouchableOpacity>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        pagingEnabled
        scrollEnabled={listeScrollbar}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={karteHoehe}
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
          <TouchableOpacity style={[styles.matchBannerInhalt, styles.neuMatch]} onPress={() => { verbergeMatchBanner(); router.push(`/chat/${matchInfo.chatId}`); }}>
            <Ionicons name="people" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.matchBannerTitel}>Ihr seid jetzt Freunde! 🎉</Text>
              <Text style={styles.matchBannerText}>{matchInfo.name} hat dich auch geliked.</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hintergrund: { flex: 1, backgroundColor: SCREEN_BG },
  profilKnopf: { position: "absolute", right: 20, zIndex: 50 },
  karteAussen: { alignItems: "center", justifyContent: "center" },
  karteSchatten: { borderRadius: 0, backgroundColor: CARD_BG, elevation: 0 },
  karteClip: { flex: 1, overflow: "hidden", backgroundColor: CARD_BG },
  glasPanel: { position: "absolute", top: 8, bottom: 8, left: 8, borderRadius: 24, overflow: "hidden", backgroundColor: GLASS_BG, zIndex: 2 },
  glasMilch: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.32)" },
  neuSoft: { shadowColor: "#D8DDE3", shadowOpacity: 0.62, shadowRadius: 5, shadowOffset: { width: 3, height: 3 }, elevation: 3 },
  neuSoftStrong: { shadowColor: "#D8DDE3", shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 5, height: 5 }, elevation: 5 },
  neuSoftInset: { shadowColor: "#BFC5CC", shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 2, height: 2 }, elevation: 2 },
  neuMatch: { shadowColor: "#1E9E4A", shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 4, height: 5 }, elevation: 6 },
  ladeFlaeche: { position: "absolute", left: 0, top: 0, width: "40%", alignItems: "center", justifyContent: "center" },
  ladeKreis: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#E8F8EE", alignItems: "center", justifyContent: "center" },
  matchBanner: { position: "absolute", left: 16, right: 16, zIndex: 100 },
  matchBannerInhalt: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#34C759", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  matchBannerTitel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  matchBannerText: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 1 },
  leerContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  leerKarte: { width: "100%", maxWidth: 360, height: 320 },
  leerKarteInnen: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 28, overflow: "hidden", backgroundColor: CARD_BG },
  leerGlasPanel: { position: "absolute", top: 8, bottom: 8, left: 8, width: "43%", borderRadius: 24, backgroundColor: GLASS_BG },
  leerTitel: { fontSize: 18, fontWeight: "700", color: TEXT, marginTop: 8 },
  leerText: { fontSize: 14, color: MUTED, textAlign: "center" },
  resetKnopf: { marginTop: 16, backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  resetKnopfText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
  zeile: { flexDirection: "row", flex: 1, paddingTop: 16, paddingBottom: 16, zIndex: 3 },
  vertikalerTrenner: { width: StyleSheet.hairlineWidth, backgroundColor: LINE, alignSelf: "stretch" },
  infoSpalte: { flex: 1, paddingTop: 4 },
  bildRahmen: { backgroundColor: "rgba(255,255,255,0.34)", overflow: "hidden" },
  bildPlatzhalter: { backgroundColor: "rgba(240,240,240,1)", justifyContent: "flex-end", alignItems: "center", overflow: "hidden" },
  nameText: { fontSize: 26, fontWeight: "700", color: TEXT, letterSpacing: -0.5 },
  alterText: { fontSize: 15, color: MUTED, marginTop: 2, fontWeight: "500" },
  trennerOben: { height: StyleSheet.hairlineWidth, backgroundColor: LINE, marginVertical: 10 },
  infoZeile: { marginBottom: 45 },
  infoLabel: { fontSize: 11, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  infoWert: { fontSize: 14, color: TEXT, lineHeight: 19 },
  tagReihe: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(245,245,245,1)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: TEXT, fontWeight: "500" },
});