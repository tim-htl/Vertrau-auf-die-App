import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { hobbyIcon } from "../data/hobbies";

type IconName = keyof typeof Ionicons.glyphMap;

const CARD_BG = "rgba(255,255,255,0.12)";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const LINE = "rgba(35, 35, 35, 0.12)";
const FUN_PINK = "#FF9A9E";

const FUN_FONT = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif-condensed",
  default: undefined,
});

const BODY_FONT = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: undefined,
});

const FUN_TYPO = {
  display: {
    fontFamily: FUN_FONT,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textTransform: "uppercase",
    color: TEXT,
  },
  subline: {
    fontFamily: FUN_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: MUTED,
  },
  label: {
    fontFamily: FUN_FONT,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
   
    color: MUTED,
  },
  body: {
    fontFamily: BODY_FONT,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "500",
    color: TEXT,
  },
  tag: {
    fontFamily: FUN_FONT,
    fontSize: 11,
    lineHeight: 13.5,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: TEXT,
  },
} as const;

export type PhotoStripCardProps = {
  name: string;
  alter: string | number;
  bio?: string;
  uni: string;
  studiengang: string;
  module: string[];
  hobbies: string[];
  bilder: (string | null)[];
  cardHeight: number;
};

function BildPlatzhalter({ size }: { size: number }) {
  return (
    <View
      style={[
        stile.bildPlatzhalter,
        stile.neuSoftInset,
        { width: size, height: size },
      ]}
    >
      <Ionicons
        name="person"
        size={size * 0.5}
        color={FUN_PINK}
        style={{ marginTop: size * 0.08 }}
      />
    </View>
  );
}

function InfoZeile({
  label,
  wert,
  numberOfLines = 2,
}: {
  label: string;
  wert: string;
  numberOfLines?: number;
}) {
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>
      <Text style={stile.infoWert} numberOfLines={numberOfLines}>
        {wert || "—"}
      </Text>
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
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>

      {items.length > 0 ? (
        <View style={stile.tagReihe}>
          {items.map((item, i) => (
            <View key={`${item}-${i}`} style={[stile.tag, stile.neuSoft]}>
              {mitIcons && (
                <Ionicons
                  name={hobbyIcon(item) as IconName}
                  size={12}
                  color={TEXT}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={stile.tagText} numberOfLines={1}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={stile.infoWert}>—</Text>
      )}
    </View>
  );
}

export function PhotoStripCard({
  name,
  alter,
  bio,
  uni,
  studiengang,
  module,
  hobbies,
  bilder,
  cardHeight,
}: PhotoStripCardProps) {
  const { width } = useWindowDimensions();

  const cardBreite = width;
  const cardHoehe = cardHeight;

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
  const bildAbstand = 4;
  const vertikalerPadding = 26;
  const verfuegbarFuerBilder = cardHoehe - vertikalerPadding * 2;

  const bildKante = Math.min(
    bildSpalteBreite,
    (verfuegbarFuerBilder - bildAbstand * (anzahlBilder - 1)) / anzahlBilder
  );

  return (
    <View style={[stile.karteAussen, { width: cardBreite, height: cardHoehe }]}> 
      <View style={[stile.karteSchatten, { width: cardBreite, height: cardHoehe }]}> 
        <View style={stile.karteClip}>
          <BlurView
            pointerEvents="none"
            tint="light"
            intensity={62}
            style={[
              stile.glasPanel,
              { left: stripLinksAbstand, width: glasBreite },
            ]}
          >
            <View style={stile.glasWeiss} />
          </BlurView>

          <View
            style={[
              stile.zeile,
              { paddingHorizontal: seitenPadding, gap: spaltenGap },
            ]}
          >
            <View
              style={{
                width: bildSpalteBreite,
                paddingVertical: vertikalerPadding,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {bilder.slice(0, anzahlBilder).map((bild, i) =>
                bild ? (
                  <View
                    key={i}
                    style={[
                      stile.bildRahmen,
                      stile.neuSoft,
                      { width: bildKante, height: bildKante },
                    ]}
                  >
                    <Image source={{ uri: bild }} style={stile.bild} />
                  </View>
                ) : (
                  <View
                    key={i}
                    style={[
                      stile.bildRahmen,
                      stile.neuSoft,
                      { width: bildKante, height: bildKante },
                    ]}
                  >
                    <BildPlatzhalter size={bildKante} />
                  </View>
                )
              )}
            </View>

            <View style={[stile.infoSpalte, { width: infoSpalteBreite }]}> 
              <View style={stile.nameBlock}>
                <Text style={stile.nameText} numberOfLines={1}>
                  {name}
                </Text>
                <View style={stile.alterBadge}>
                  <Text style={stile.alterText}>{alter} Jahre</Text>
                </View>
              </View>

              <View style={stile.trennerOben} />

              <InfoZeile label="Bio" wert={bio || "—"} numberOfLines={4} />
              <InfoZeile label="Uni" wert={uni} numberOfLines={1} />
              <InfoZeile label="Studiengang" wert={studiengang} numberOfLines={2} />
              <TagReihe label="Module" items={module} />
              <TagReihe label="Hobbies" items={hobbies} mitIcons />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const stile = StyleSheet.create({
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
    borderRadius: 0,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderColor: "white",
    elevation: 0,
    zIndex: 2,
  },
  glasWeiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  neuSoft: {
    shadowColor: "#D8DDE3",
    shadowOpacity: 0.5,
    shadowRadius: 7,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
  },
  neuSoftInset: {
    shadowColor: "#BFC5CC",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 2,
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
    paddingTop: 6,
  },
  nameBlock: {
    alignItems: "flex-start",
  },
  bildRahmen: {
    backgroundColor: "rgba(255,255,255,0.36)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.64)",
    borderRadius: 18,
  },
  bild: {
    width: "100%",
    height: "100%",
  },
  bildPlatzhalter: {
    backgroundColor: "rgba(255,245,248,0.72)",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  nameText: {
    ...FUN_TYPO.display,
    maxWidth: "100%",
    marginTop: 40,
  },
  alterBadge: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  alterText: {
    ...FUN_TYPO.subline,
    color: TEXT,
    fontSize: 12,
    lineHeight: 16,
   
  },
  trennerOben: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginTop: 30,
    marginBottom: 14,
  },
  infoZeile: {
    marginBottom: 24,
  },
  infoLabel: {
    ...FUN_TYPO.label,
    marginBottom: 5,
  },
  infoWert: {
    ...FUN_TYPO.body,
  },
  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.52)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
  },
  tagText: {
    ...FUN_TYPO.tag,
    flexShrink: 1,
  },
});
