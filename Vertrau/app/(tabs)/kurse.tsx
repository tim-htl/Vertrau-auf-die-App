import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_STUDIENGANG } from "../../data/kurse";

const CARD_BG = "#f8f8f6";
const BLACK = "#050505";
const ACCENT = "#ff6b5f";

const STATIC_BACKGROUND = require("../../assets/images/grad1.jpg");
const SCREEN_BG = "#FFFFFF";

type Teilnehmer = {
  id: string;
  bild?: string | null;
};

type KursItem = {
  id: string;
  name: string;
  ects?: number | string | null;
  teilnehmer?: Teilnehmer[];
};

type ModulItem = {
  id?: string;
  name?: string | null;
};

type ModulBereichItem = {
  id: string;
  name: string;
  module?: ModulItem[];
  bereiche?: ModulBereichItem[];
};

// ─── App Hintergrund ─────────────────────────────────────────────────────────

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

// Das hochgeladene TU Logo wird nun hier fest eingebunden
function UniLogo() {
  return (
    <View style={[styles.uniLogo, styles.uniLogoPlatzhalter]}>
      <Image 
        source={require("../../assets/images/TUB.png")} 
        style={styles.tuLogoImage} 
        resizeMode="contain"
      />
    </View>
  );
}

function MiniAvatar({ bild }: { bild?: string | null }) {
  return (
    <View style={styles.avatarBubble}>
      {bild ? (
        <Image source={{ uri: bild }} style={styles.avatarImage} />
      ) : (
        <Ionicons name="person" size={17} color="#111" />
      )}
    </View>
  );
}

function TeilnehmerAvatare({ teilnehmer }: { teilnehmer?: Teilnehmer[] }) {
  if (!teilnehmer || teilnehmer.length === 0) {
    return null;
  }

  return (
    <View style={styles.avatarRow}>
      {teilnehmer.slice(0, 4).map((t) => (
        <MiniAvatar key={t.id} bild={t.bild} />
      ))}

      {teilnehmer.length > 4 && (
        <View style={styles.moreAvatars}>
          <Text style={styles.moreAvatarsText}>+{teilnehmer.length - 4}</Text>
        </View>
      )}
    </View>
  );
}

function StudiengangKarte({
  name,
}: {
  name: string;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 36;

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.card, styles.headerCard, { width: cardWidth }]}>
        <ImageBackground
          source={require("../../assets/images/tub.jpg")}
          style={styles.headerHero}
          imageStyle={styles.headerHeroImage}
        >
          <View style={styles.heroOverlay} />


        </ImageBackground>

        {/* Floating Logo - Tweak coordinates in styles.floatingLogo */}
        <View style={styles.floatingLogo}>
           <UniLogo />
        </View>

        <View style={styles.content}>
          <Text 
            style={styles.title} 
            numberOfLines={1} 
            adjustsFontSizeToFit 
            minimumFontScale={0.5}
          >
            {name}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="school" size={15} color={ACCENT} />
            <Text style={styles.metaText} numberOfLines={1}>
              Studiengang
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SammelKarte({
  titel,
  beschreibung,
  icon,
  children,
}: {
  titel: string;
  beschreibung: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 36;

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.groupCard, { width: cardWidth }]}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIconBubble}>
            <Ionicons name={icon} size={22} color="#D5E3E8" />
          </View>

          <View style={styles.groupHeaderText}>
            <Text style={styles.groupTitle}>{titel}</Text>
            <Text style={styles.groupDescription} numberOfLines={2}>
              {beschreibung}
            </Text>
          </View>
        </View>

        {children}
      </View>
    </View>
  );
}

function KompakterEintrag({
  titel,
  beschreibung,
  icon,
  teilnehmer,
  onPress,
}: {
  titel: string;
  beschreibung: string;
  icon: keyof typeof Ionicons.glyphMap;
  teilnehmer?: Teilnehmer[];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactItem,
        pressed ? styles.compactItemPressed : null,
      ]}
    >
      <View style={styles.compactItemMain}>
        <View style={styles.compactIconBubble}>
          <Ionicons name={icon} size={20} color="#A0C3D2" />
        </View>

        <View style={styles.compactTextBlock}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {titel}
          </Text>
          <Text style={styles.compactDescription} numberOfLines={1}>
            {beschreibung}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#A0C3D2" />
      </View>

      {teilnehmer && teilnehmer.length > 0 && (
        <View style={styles.compactFooter}>
          <TeilnehmerAvatare teilnehmer={teilnehmer} />
        </View>
      )}
    </Pressable>
  );
}

function SuchLeiste({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={19} color="#777" />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Module suchen"
        placeholderTextColor="#999"
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </Pressable>
      )}
    </View>
  );
}

function getBereichBeschreibung(bereich: ModulBereichItem) {
  if (bereich.bereiche && bereich.bereiche.length > 0) {
    return `${bereich.bereiche.length} Bereiche entdecken`;
  }

  if (bereich.module && bereich.module.length > 0) {
    return `${bereich.module.length} Module entdecken`;
  }

  return "Module entdecken";
}

function getSuchtextFuerBereich(bereich: ModulBereichItem): string {
  const eigeneModule = bereich.module?.map((modul) => modul.name ?? "") ?? [];

  const unterbereiche =
    bereich.bereiche?.flatMap((unterbereich) => [
      unterbereich.name,
      ...(unterbereich.module?.map((modul) => modul.name ?? "") ?? []),
    ]) ?? [];

  return [bereich.name, ...eigeneModule, ...unterbereiche]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function KurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studiengang = DEMO_STUDIENGANG;

  const meineKurse = studiengang.meineKurse as KursItem[];
  const moduldatenbank = studiengang.moduldatenbank as ModulBereichItem[];

  const [suche, setSuche] = useState("");

  const gefilterteModuldatenbank = useMemo(() => {
    const query = suche.trim().toLowerCase();

    if (!query) {
      return moduldatenbank;
    }

    return moduldatenbank.filter((bereich) =>
      getSuchtextFuerBereich(bereich).includes(query)
    );
  }, [moduldatenbank, suche]);

  const sucheIstAktiv = suche.trim().length > 0;

  return (
    <AppHintergrund>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 22,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <StudiengangKarte
          name={studiengang.name}
        />

        <SammelKarte
          titel="Meine Module"
          beschreibung={`${meineKurse.length} Module in deinem Studiengang`}
          icon="book"
        >
          {meineKurse.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Noch keine Module vorhanden.</Text>
            </View>
          ) : (
            meineKurse.map((kurs) => {
              const teilnehmerText = kurs.teilnehmer?.length
                ? ` · ${kurs.teilnehmer.length} Teilnehmer`
                : "";

              return (
                <KompakterEintrag
                  key={kurs.id}
                  titel={kurs.name}
                  beschreibung={
                    kurs.ects != null
                      ? `${kurs.ects} ECTS${teilnehmerText}`
                      : `Modul öffnen${teilnehmerText}`
                  }
                  icon="book"
                  teilnehmer={kurs.teilnehmer}
                  onPress={() => router.push(`/kurs/${kurs.id}`)}
                />
              );
            })
          )}
        </SammelKarte>

        <SammelKarte
          titel="Moduldatenbank"
          beschreibung={
            sucheIstAktiv
              ? `${gefilterteModuldatenbank.length} von ${moduldatenbank.length} Treffern`
              : `${moduldatenbank.length} Modulbereiche durchsuchen`
          }
          icon="albums"
        >
          <SuchLeiste
            value={suche}
            onChangeText={setSuche}
            onClear={() => setSuche("")}
          />

          {gefilterteModuldatenbank.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Keine passenden Module gefunden.
              </Text>
            </View>
          ) : (
            gefilterteModuldatenbank.map((bereich) => (
              <KompakterEintrag
                key={bereich.id}
                titel={bereich.name}
                beschreibung={getBereichBeschreibung(bereich)}
                icon="albums"
                onPress={() => router.push(`/bereich/${bereich.id}`)}
              />
            ))
          )}
        </SammelKarte>
      </ScrollView>
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

  screen: {
    flex: 1,
  },

  itemContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  card: {
    borderRadius: 34,
    backgroundColor: CARD_BG,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },

  headerCard: {
    minHeight: 280, 
  },

  headerHero: {
    height: 214,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: BLACK,
    overflow: "hidden",
  },

  headerHeroImage: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
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
    fontSize: 2,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  // NEW: Absolute positioning for the logo
  floatingLogo: {
    position: "absolute",
    top: 10, // Adjust this so it overlaps perfectly with the image and content
     // Change to 'left: 24' if you want it on the left side
    right: 20,
    zIndex: 10,
    elevation: 13, // Ensure it sits higher than the card shadow
  },

  uniLogo: {
    width: 70,
    height: 70,
    borderRadius: 45,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: CARD_BG,
    overflow: "hidden", 
  },

  uniLogoPlatzhalter: {
    justifyContent: "center",
    alignItems: "center",
  },

  tuLogoImage: {
    width: 50,
    height: 50,
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

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  metaText: {
    flex: 1,
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 5,
  },

  groupCard: {
    borderRadius: 34,
    backgroundColor: CARD_BG,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  groupIconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLACK,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  groupHeaderText: {
    flex: 1,
  },

  groupTitle: {
    color: "#111",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    textTransform: "uppercase",
  },

  groupDescription: {
    color: "#777",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 2,
  },

  compactItem: {
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  compactItemPressed: {
    transform: [{ scale: 0.985 }],
  },

  compactItemMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  compactIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: BLACK,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  compactTextBlock: {
    flex: 1,
    marginRight: 8,
  },

  compactTitle: {
    color: "#111",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },

  compactDescription: {
    color: "#777",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 3,
  },

  compactFooter: {
    marginTop: 12,
    paddingLeft: 56,
  },

  searchContainer: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ededed",
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
    marginLeft: 8,
  },

  emptyState: {
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },

  emptyText: {
    color: "#777",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarBubble: {
    width: 38,
    height: 38,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: CARD_BG,
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
    width: 38,
    height: 38,
    borderRadius: 21,
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: CARD_BG,
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  moreAvatarsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});