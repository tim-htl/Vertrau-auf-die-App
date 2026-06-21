import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { type ReactNode, useCallback, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Aktivitaet } from "../../data/aktivitaeten";
import { ladeAktivitaeten } from "../../api/aktivitaeten";

const STATIC_BACKGROUND = require("../../assets/images/grad1.jpg");
const SCREEN_BG = "#FFFFFF";

// ─── App Hintergrund ─────────────────────────────────────────────────────────

function AppHintergrund({ children }: { children?: ReactNode }) {
  return (
    <ImageBackground
      source={STATIC_BACKGROUND}
      resizeMode="cover"
      style={styles.hintergrund}
      imageStyle={styles.hintergrundBild}
    >
      <View pointerEvents="none" style={styles.hintergrundOverlay} />
      {children}
    </ImageBackground>
  );
}

// ─── Profilbild-Platzhalter ──────────────────────────────────────────────────

function MiniAvatar({ bild }: { bild?: string | null }) {
  return (
    <View style={styles.avatarBubble}>
      {bild ? (
        <Image source={{ uri: bild }} style={styles.avatarImage} />
      ) : (
        <Ionicons name="person" size={17} color="#FF9A9E" />
      )}
    </View>
  );
}

// ─── Einzelne Aktivitätskarte ─────────────────────────────────────────────────

export function AktivitaetKarte({
  item,
  verfuegbareHoehe,
  onPress,
}: {
  item: Aktivitaet;
  verfuegbareHoehe: number;
  onPress?: () => void;
}) {
  const { width } = useWindowDimensions();

  const cardWidth = width - 36;
  const cardHeight = verfuegbareHoehe - 28;
  const heroHeight = cardHeight * 0.58;

  return (
    <View style={[styles.itemContainer, { height: verfuegbareHoehe }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image
            source={{ uri: item.hintergrundbild }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          <View style={styles.heroOverlay} />

        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.titel}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color="#ff6b5f" />

            <Text style={styles.location} numberOfLines={1}>
              {item.ort}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {item.beschreibung}
          </Text>

          <View style={styles.footer}>
            <View style={styles.avatarRow}>
              {item.teilnehmer.slice(0, 4).map((t) => (
                <MiniAvatar key={t.id} bild={t.bild} />
              ))}

              {item.teilnehmer.length > 4 && (
                <View style={styles.moreAvatars}>
                  <Text style={styles.moreAvatarsText}>
                    +{item.teilnehmer.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function TreffenScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [aktivitaeten, setAktivitaeten] = useState<Aktivitaet[]>([]);
  const [laden, setLaden] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let abgebrochen = false;
      (async () => {
        setLaden(true);
        try {
          const liste = await ladeAktivitaeten();
          if (!abgebrochen) setAktivitaeten(liste);
        } catch {
          if (!abgebrochen) setAktivitaeten([]);
        } finally {
          if (!abgebrochen) setLaden(false);
        }
      })();

      return () => {
        abgebrochen = true;
      };
    }, [])
  );

  const alleAktivitaeten: Aktivitaet[] = aktivitaeten;

  const headerHeight = insets.top + 22;
  const bottomBarHeight = 100;
  const verfuegbareHoehe = height - headerHeight - bottomBarHeight;

  return (
    <AppHintergrund>
      <FlatList
        data={alleAktivitaeten}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: bottomBarHeight,
        }}
        renderItem={({ item }) => (
          <AktivitaetKarte
            item={item}
            verfuegbareHoehe={verfuegbareHoehe}
            onPress={() =>
              router.push({
                pathname: "/aktivitaet/[id]",
                params: {
                  id: item.id,
                  modus: "teilnehmen",
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          !laden ? (
            <View
              style={{
                height: verfuegbareHoehe,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
              }}
            >
              <Text style={styles.leerText}>
                Noch keine Treffen. Erstelle das erste über den +-Button unten rechts.
              </Text>
            </View>
          ) : null
        }
        pagingEnabled
        snapToInterval={verfuegbareHoehe}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: verfuegbareHoehe,
          offset: verfuegbareHoehe * index,
          index,
        })}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: bottomBarHeight + 18,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
        onPress={() => router.push("/aktivitaet/standort-waehlen")}
      >
        <Ionicons name="add" size={30} color="#FF9A9E" />
      </Pressable>
    </AppHintergrund>
  );
}

const styles = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  hintergrundBild: {
    opacity: 100,
  },
  hintergrundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  leerText: {
    color: "#555",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },

  itemContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    borderRadius: 35,
    backgroundColor: "rgba(248,248,246)",
    overflow: "hidden",
    shadowColor: "#7d7d7d",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },

  hero: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: "hidden",
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  topBar: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  heroBottom: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 0,
    minHeight: 82,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#f8f8f6",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  kicker: {
    flex: 1,
    color: "#303030",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginRight: 14,
  },

  cta: {
    height: 54,
    borderRadius: 28,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff5c5c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  ctaText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
  },

  title: {
    color: "#111",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  location: {
    flex: 1,
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 5,
  },

  description: {
    color: "#3d3d3d",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#f8f8f6",
    marginRight: -10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
  },

  moreAvatars: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#f8f8f6",
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  moreAvatarsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  fab: {
    position: "absolute",
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff5c5c",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
});