import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { type ReactNode, useCallback, useMemo, useState } from "react";
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
import {
  belegeModul,
  entferneModul,
  ladeMeineKurse,
  ladeStudiengangModule,
  type UIKatalogModul,
  type UIMeinKurs,
} from "../../api/kurse";
import { getMe } from "../../api/me";

const CARD_BG = "#f8f8f6";
const BLACK = "#050505";
const ACCENT = "#ff6b5f";

const STATIC_BACKGROUND = require("../../assets/images/grad1.jpg");
const SCREEN_BG = "#FFFFFF";

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

function StudiengangKarte({ name }: { name: string }) {
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
  aktion,
}: {
  titel: string;
  beschreibung: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  // Optionaler Knopf oben rechts in der Kopfzeile (z. B. Bearbeiten).
  aktion?: ReactNode;
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

          {aktion ? <View style={styles.headerAktionRechts}>{aktion}</View> : null}
        </View>

        {children}
      </View>
    </View>
  );
}

// Listeneintrag für ein Modul. Standard: ganze Zeile öffnet die Teilnehmer-
// Übersicht. Optional rechts ein Belegen/Abwählen-Knopf (Moduldatenbank).
function KompakterEintrag({
  titel,
  beschreibung,
  icon,
  onPress,
  belegt,
  onToggleBelegt,
  minus,
  onMinus,
}: {
  titel: string;
  beschreibung: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  belegt?: boolean;
  onToggleBelegt?: () => void;
  // Bearbeiten-Modus: roter Minus-Button links → Modul verlassen.
  minus?: boolean;
  onMinus?: () => void;
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
        {minus ? (
          <Pressable onPress={onMinus} hitSlop={8} style={styles.minusKnopf}>
            <Ionicons name="remove-circle" size={26} color="#FF3B30" />
          </Pressable>
        ) : null}

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

        {onToggleBelegt ? (
          <Pressable
            onPress={onToggleBelegt}
            hitSlop={10}
            style={[styles.aktionButton, belegt ? styles.aktionButtonBelegt : null]}
          >
            <Ionicons
              name={belegt ? "checkmark" : "add"}
              size={20}
              color={belegt ? "#fff" : ACCENT}
            />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={22} color="#A0C3D2" />
        )}
      </View>
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

export default function KurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [studiengangName, setStudiengangName] = useState<string | null>(null);
  const [studiengangId, setStudiengangId] = useState<string | null>(null);
  const [meineKurse, setMeineKurse] = useState<UIMeinKurs[]>([]);
  const [katalog, setKatalog] = useState<UIKatalogModul[]>([]);
  const [laden, setLaden] = useState(true);
  const [meineEdit, setMeineEdit] = useState(false);
  const [suche, setSuche] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const belegteIds = useMemo(
    () => new Set(meineKurse.map((k) => k.id)),
    [meineKurse]
  );

  useFocusEffect(
    useCallback(() => {
      let weg = false;
      (async () => {
        setLaden(true);
        try {
          const me = await getMe();
          if (weg) return;
          setStudiengangName(me.studiengang?.name ?? null);
          setStudiengangId(me.studiengangId);
          const [meine, kat] = await Promise.all([
            ladeMeineKurse(),
            me.studiengangId
              ? ladeStudiengangModule(me.studiengangId)
              : Promise.resolve<UIKatalogModul[]>([]),
          ]);
          if (weg) return;
          setMeineKurse(meine);
          setKatalog(kat);
        } catch {
          // Leerer Zustand bleibt stehen; Fehler wird hier still geschluckt.
        } finally {
          if (!weg) setLaden(false);
        }
      })();
      return () => {
        weg = true;
      };
    }, [])
  );

  const gefilterterKatalog = useMemo(() => {
    const query = suche.trim().toLowerCase();
    if (!query) return katalog;
    return katalog.filter(
      (m) =>
        m.name.toLowerCase().includes(query) || m.nummer.includes(query)
    );
  }, [katalog, suche]);

  const sucheIstAktiv = suche.trim().length > 0;

  async function toggleBelegt(modulId: string) {
    if (busyId) return;
    const istBelegt = belegteIds.has(modulId);
    setBusyId(modulId);
    try {
      if (istBelegt) {
        await entferneModul(modulId);
      } else {
        await belegeModul(modulId);
      }
      const meine = await ladeMeineKurse();
      setMeineKurse(meine);
    } catch {
      // optional: Fehlerhinweis; vorerst still
    } finally {
      setBusyId(null);
    }
  }

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
        <StudiengangKarte name={studiengangName ?? "Mein Studiengang"} />

        <SammelKarte
          titel="Meine Module"
          beschreibung={
            laden && meineKurse.length === 0
              ? "Wird geladen…"
              : meineEdit
                ? "Tippe das rote Minus, um ein Modul zu verlassen"
                : `${meineKurse.length} belegte Module`
          }
          icon="book"
          aktion={
            meineKurse.length > 0 ? (
              <Pressable
                onPress={() => setMeineEdit((v) => !v)}
                hitSlop={8}
                style={[styles.editKnopf, meineEdit ? styles.editKnopfAktiv : null]}
              >
                <Ionicons
                  name={meineEdit ? "checkmark" : "create-outline"}
                  size={20}
                  color="#fff"
                />
              </Pressable>
            ) : undefined
          }
        >
          {meineKurse.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {laden
                  ? "Lädt…"
                  : "Noch keine Module belegt. Füge welche unten in der Moduldatenbank oder über „Profil bearbeiten“ hinzu."}
              </Text>
            </View>
          ) : (
            meineKurse.map((kurs) => {
              const teilnehmerText = kurs.anzahlTeilnehmer
                ? ` · ${kurs.anzahlTeilnehmer} Teilnehmer`
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
                  onPress={() => router.push(`/kurs/${kurs.id}`)}
                  minus={meineEdit}
                  onMinus={() => toggleBelegt(kurs.id)}
                />
              );
            })
          )}
        </SammelKarte>

        <SammelKarte
          titel="Moduldatenbank"
          beschreibung={
            sucheIstAktiv
              ? `${gefilterterKatalog.length} von ${katalog.length} Treffern`
              : `${katalog.length} Module in deinem Studiengang`
          }
          icon="albums"
        >
          <SuchLeiste
            value={suche}
            onChangeText={setSuche}
            onClear={() => setSuche("")}
          />

          {gefilterterKatalog.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {laden ? "Lädt…" : "Keine passenden Module gefunden."}
              </Text>
            </View>
          ) : (
            gefilterterKatalog.map((modul) => (
              <KompakterEintrag
                key={modul.id}
                titel={modul.name}
                beschreibung={
                  modul.ects != null
                    ? `Nr. ${modul.nummer} · ${modul.ects} ECTS`
                    : `Nr. ${modul.nummer}`
                }
                icon="albums"
                onPress={() => router.push(`/kurs/${modul.id}`)}
                belegt={belegteIds.has(modul.id)}
                onToggleBelegt={() => toggleBelegt(modul.id)}
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

  // NEW: Absolute positioning for the logo
  floatingLogo: {
    position: "absolute",
    top: 10,
    right: 20,
    zIndex: 10,
    elevation: 13,
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

  aktionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
  },

  aktionButtonBelegt: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  headerAktionRechts: {
    marginLeft: 10,
  },
  editKnopf: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLACK,
    justifyContent: "center",
    alignItems: "center",
  },
  editKnopfAktiv: {
    backgroundColor: "#34c759",
  },
  minusKnopf: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
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
});
