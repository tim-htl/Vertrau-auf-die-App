import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  Image,
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
    <View style={[stile.bildPlatzhalter, stile.neuSoftInset, { width: size, height: size }]}>
      <Ionicons
        name="person"
        size={size * 0.5}
        color="#C7C7CC"
        style={{ marginTop: size * 0.08 }}
      />
    </View>
  );
}

function InfoZeile({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={stile.infoZeile}>
      <Text style={stile.infoLabel}>{label}</Text>
      <Text style={stile.infoWert}>{wert || "—"}</Text>
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
            <View key={i} style={[stile.tag, stile.neuSoft]}>
              {mitIcons && (
                <Ionicons
                  name={hobbyIcon(item) as IconName}
                  size={12}
                  color={TEXT}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={stile.tagText}>{item}</Text>
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
  const bildAbstand = 4; // Bilder enger zusammen
  const vertikalerPadding = 26; // Mehr Abstand oben und unten
  const verfuegbarFuerBilder = cardHoehe - (vertikalerPadding * 2);
  
  const bildKante = Math.min(
    bildSpalteBreite, 
    (verfuegbarFuerBilder - (bildAbstand * (anzahlBilder - 1))) / anzahlBilder
  );

  return (
    <View style={[stile.karteAussen, { width: cardBreite, height: cardHoehe }]}>
      <View style={[stile.karteSchatten, { width: cardBreite, height: cardHoehe }]}>
        <View style={stile.karteClip}>
          <BlurView
            pointerEvents="none"
            tint="light"
            intensity={62}
            style={[stile.glasPanel, { left: stripLinksAbstand, width: glasBreite }]}
          >
            <View style={stile.glasWeiss} />
          </BlurView>

          <View style={[stile.zeile, { paddingHorizontal: seitenPadding, gap: spaltenGap }]}>
            <View
              style={{
                width: bildSpalteBreite,
                paddingVertical: vertikalerPadding, // Neuer Abstand
                justifyContent: "space-between", 
                alignItems: "center",
              }}
            >
              {bilder.slice(0, anzahlBilder).map((bild, i) =>
                bild ? (
                  <View
                    key={i}
                    style={[stile.bildRahmen, stile.neuSoft, { width: bildKante, height: bildKante }]}
                  >
                    <Image source={{ uri: bild }} style={stile.bild} />
                  </View>
                ) : (
                  <View
                    key={i}
                    style={[stile.bildRahmen, stile.neuSoft, { width: bildKante, height: bildKante }]}
                  >
                    <BildPlatzhalter size={bildKante} />
                  </View>
                )
              )}
            </View>

            <View style={[stile.infoSpalte, { width: infoSpalteBreite }]}>
              <Text style={stile.nameText} numberOfLines={1}>
                {name}
              </Text>
              <Text style={stile.alterText}>{alter} Jahre</Text>

              <View style={stile.trennerOben} />

              <InfoZeile label="Bio" wert={bio || "—"} />
              <InfoZeile label="Uni" wert={uni} />
              <InfoZeile label="Studiengang" wert={studiengang} />
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
    paddingTop: 4,
  },
  bildRahmen: {
    backgroundColor: "rgba(255,255,255,0.36)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.64)",
    borderRadius: 16,
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