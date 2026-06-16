import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { frageText, type FrageAntwort } from "../data/fragen";
import { hobbyIcon } from "../data/hobbies";

// ─── Ausführliche Profilansicht (AP) ──────────────────────────────────────────
//
// Scrollende Seite über die gesamte Breite:
//   1. Bilder-Carousel (durchswipen wie bei Aktivitäten, bis zu 10 Bilder)
//   2. Name + Alter (Kopf der Seite, wie auf der Karte)
//   3. Frage-Antworten (nur hier sichtbar, nicht in der Kurzansicht)
//   4. Alle Felder der Kurzansicht (Bio, Uni, Studiengang, Module, Hobbies)
//
// Wird doppelt verwendet: person/[id] (fremde Profile) und Profil-Tab
// (eigenes Profil, zweite Pager-Seite).

export type ApProfil = {
  name: string;
  alter: string | number;
  bilder: (string | null)[];
  kurzbeschreibung: string;
  uni: string;
  studiengang: string;
  module: string[];
  hobbies: string[];
  frageAntworten: FrageAntwort[];
};

export type ProfilEditBereich = "bio" | "module" | "hobbies";

// ─── Bilder-Carousel ──────────────────────────────────────────────────────────

function BilderCarousel({
  bilder,
  breite,
  onTouchAktiv,
}: {
  bilder: string[];
  breite: number;
  // Meldet, ob der Finger gerade auf dem Carousel liegt. Der äußere Pager
  // wird dann temporär deaktiviert, damit horizontale Swipes hier
  // das Bild wechseln statt die KP/AP-Seite.
  onTouchAktiv?: (aktiv: boolean) => void;
}) {
  const bildHoehe = Math.round(breite * 1.1);
  const [index, setIndex] = useState(0);

  // Bilder mit toten URIs, z. B. alte file://-Pfade, fliegen via onError raus.
  const [kaputt, setKaputt] = useState<string[]>([]);

  const ladbareBilder = bilder.filter((b) => !kaputt.includes(b));

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const neuerIndex = Math.round(e.nativeEvent.contentOffset.x / breite);
    if (neuerIndex !== index) setIndex(neuerIndex);
  }

  if (ladbareBilder.length === 0) {
    return (
      <View style={[stile.bildPlatzhalter, { width: breite, height: bildHoehe }]}>
        <LinearGradient
          colors={["#EEF0F6", "#D8DDE8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={stile.platzhalterGradient}
        >
          <View
            style={[
              stile.avatarKreis,
              {
                width: breite * 0.42,
                height: breite * 0.42,
                borderRadius: breite * 0.21,
              },
            ]}
          >
            <Ionicons name="person" size={breite * 0.24} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ height: bildHoehe }}>
      <ScrollView
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onTouchStart={() => onTouchAktiv?.(true)}
        onTouchEnd={() => onTouchAktiv?.(false)}
        onTouchCancel={() => onTouchAktiv?.(false)}
        onScrollEndDrag={() => onTouchAktiv?.(false)}
        onMomentumScrollEnd={() => onTouchAktiv?.(false)}
      >
        {ladbareBilder.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width: breite, height: bildHoehe }}
            resizeMode="cover"
            onError={() => setKaputt((k) => (k.includes(uri) ? k : [...k, uri]))}
          />
        ))}
      </ScrollView>

      {ladbareBilder.length > 1 && (
        <View style={stile.dotsReihe}>
          {ladbareBilder.map((_, i) => (
            <View key={i} style={[stile.dot, i === index && stile.dotAktiv]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Bausteine ────────────────────────────────────────────────────────────────

function AntwortKarte({ frageAntwort }: { frageAntwort: FrageAntwort }) {
  return (
    <View style={stile.antwortKarte}>
      <Text style={stile.antwortFrage}>{frageText(frageAntwort.frageId)}</Text>
      <Text style={stile.antwortText}>{frageAntwort.antwort}</Text>
    </View>
  );
}

function InfoBlock({
  label,
  wert,
  onPress,
}: {
  label: string;
  wert: string;
  onPress?: () => void;
}) {
  const inhalt = (
    <>
      <Text style={stile.infoLabel}>{label}</Text>
      <Text style={stile.infoWert}>{wert || "—"}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} style={stile.infoBlock} onPress={onPress}>
        {inhalt}
      </TouchableOpacity>
    );
  }

  return <View style={stile.infoBlock}>{inhalt}</View>;
}

function TagBlock({
  label,
  items,
  mitIcons = false,
  onPress,
}: {
  label: string;
  items: string[];
  // true bei Hobbies: zeigt das Katalog-Icon vor dem Namen
  mitIcons?: boolean;
  onPress?: () => void;
}) {
  const inhalt = (
    <>
      <Text style={stile.infoLabel}>{label}</Text>
      {items.length > 0 ? (
        <View style={stile.tagReihe}>
          {items.map((item, i) => (
            <View key={`${item}-${i}`} style={stile.tag}>
              {mitIcons && (
                <Ionicons name={hobbyIcon(item)} size={13} color="#1a1a1a" style={{ marginRight: 5 }} />
              )}
              <Text style={stile.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={stile.infoWert}>—</Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} style={stile.infoBlock} onPress={onPress}>
        {inhalt}
      </TouchableOpacity>
    );
  }

  return <View style={stile.infoBlock}>{inhalt}</View>;
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function ProfilAusfuehrlich({
  profil,
  breite,
  onCarouselTouch,
  bottomPadding = 0,
  onEditBereich,
}: {
  profil: ApProfil;
  // Breite explizit, damit die AP auch als Pager-Seite korrekt layoutet.
  breite?: number;
  // Durchgereicht ans Carousel — siehe BilderCarousel.onTouchAktiv.
  onCarouselTouch?: (aktiv: boolean) => void;
  bottomPadding?: number;
  // Optional: nur im eigenen Profil aktiv. Fremde Profile bleiben read-only.
  onEditBereich?: (bereich: ProfilEditBereich) => void;
}) {
  const { width } = useWindowDimensions();
  const apBreite = breite ?? width;

  const gefuellteBilder = profil.bilder.filter((b): b is string => !!b);

  return (
    <ScrollView
      style={{ width: apBreite }}
      contentContainerStyle={{ paddingBottom: 32 + bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <BilderCarousel bilder={gefuellteBilder} breite={apBreite} onTouchAktiv={onCarouselTouch} />

      {/* Kopf: Name + Alter */}
      <View style={stile.kopf}>
        <Text style={stile.nameText} numberOfLines={1}>
          {profil.name}
        </Text>
        <Text style={stile.alterText}>{profil.alter} Jahre</Text>
      </View>

      {/* Frage-Antworten — nur in der AP sichtbar */}
      {profil.frageAntworten.length > 0 && (
        <View style={stile.sektion}>
          {profil.frageAntworten.map((fa) => (
            <AntwortKarte key={fa.frageId} frageAntwort={fa} />
          ))}
        </View>
      )}

      {/* Felder der Kurzansicht */}
      <View style={stile.sektion}>
        <InfoBlock
          label="Bio"
          wert={profil.kurzbeschreibung}
          onPress={onEditBereich ? () => onEditBereich("bio") : undefined}
        />

        <InfoBlock label="Uni" wert={profil.uni} />
        <InfoBlock label="Studiengang" wert={profil.studiengang} />

        <TagBlock
          label="Module"
          items={profil.module}
          onPress={onEditBereich ? () => onEditBereich("module") : undefined}
        />

        <TagBlock
          label="Hobbies"
          items={profil.hobbies}
          mitIcons
          onPress={onEditBereich ? () => onEditBereich("hobbies") : undefined}
        />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stile = StyleSheet.create({
  bildPlatzhalter: {
    overflow: "hidden",
  },
  platzhalterGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarKreis: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  dotsReihe: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotAktiv: {
    backgroundColor: "#fff",
  },

  kopf: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  nameText: {
    fontSize: 28,
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

  sektion: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  antwortKarte: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  antwortFrage: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  antwortText: {
    fontSize: 17,
    color: "#1a1a1a",
    lineHeight: 23,
    fontWeight: "500",
  },

  infoBlock: {
    marginBottom: 22,
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
    fontSize: 15,
    color: "#1a1a1a",
    lineHeight: 20,
  },

  tagReihe: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },
});