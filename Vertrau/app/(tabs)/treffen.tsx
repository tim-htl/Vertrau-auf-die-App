import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_AKTIVITAETEN, type Aktivitaet } from "../../data/aktivitaeten";
import { ladeUserAktivitaeten } from "../../data/userAktivitaeten";

// ─── Profilbild-Platzhalter (Apple-Stil) ──────────────────────────────────────

function ProfilPlatzhalter({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.profilRahmen,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.profilGrau,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Ionicons
          name="person"
          size={size * 0.55}
          color="#fff"
          style={{ marginTop: size * 0.1 }}
        />
      </View>
    </View>
  );
}

// ─── Einzelne Aktivitätskarte ─────────────────────────────────────────────────

export function AktivitaetKarte({
  item,
  verfuegbareHoehe,
  topInset,
  onPress,
}: {
  item: Aktivitaet;
  verfuegbareHoehe: number;
  topInset: number;
  onPress?: () => void;
}) {
  const { width } = useWindowDimensions();
  const bildHoehe = verfuegbareHoehe * 0.75;
  const infoHoehe = verfuegbareHoehe * 0.25;

  // Profilbilder: gleichmäßig zentriert berechnen
  const maxTeilnehmer = Math.min(item.teilnehmer.length, 4);
  const seitenAbstand = 24;
  const luecke = 14;
  const profilGroesse = Math.min(
    (width - seitenAbstand * 2 - luecke * (maxTeilnehmer - 1)) / maxTeilnehmer,
    72
  );

  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? { onPress, activeOpacity: 0.9 }
    : {};

  return (
    <Wrapper style={{ height: verfuegbareHoehe }} {...wrapperProps}>
      {/* Hintergrundbild (75%) */}
      <View style={{ height: bildHoehe, overflow: "hidden" }}>
        <Image
          source={{ uri: item.hintergrundbild }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Profilbilder – mit Abstand zur Statusleiste */}
        <View
          style={[
            styles.teilnehmerReihe,
            { gap: luecke, paddingHorizontal: seitenAbstand, paddingTop: topInset + 12 },
          ]}
        >
          {item.teilnehmer.slice(0, 4).map((t) =>
            t.bild ? (
              <View
                key={t.id}
                style={[
                  styles.profilRahmen,
                  {
                    width: profilGroesse,
                    height: profilGroesse,
                    borderRadius: profilGroesse / 2,
                  },
                ]}
              >
                <Image
                  source={{ uri: t.bild }}
                  style={{
                    width: profilGroesse,
                    height: profilGroesse,
                    borderRadius: profilGroesse / 2,
                  }}
                />
              </View>
            ) : (
              <ProfilPlatzhalter key={t.id} size={profilGroesse} />
            )
          )}
        </View>
      </View>

      {/* Info-Bereich (25%) */}
      <View style={[styles.infoBereich, { height: infoHoehe }]}>
        <Text style={styles.titel} numberOfLines={1}>
          {item.titel}
        </Text>
        <View style={styles.ortReihe}>
          <Ionicons name="location" size={14} color="#e74c3c" />
          <Text style={styles.ort} numberOfLines={1}>
            {item.ort}
          </Text>
        </View>
        <Text style={styles.beschreibung}>{item.beschreibung}</Text>
      </View>
    </Wrapper>
  );
}

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function TreffenScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userAktivitaeten, setUserAktivitaeten] = useState<Aktivitaet[]>([]);

  useFocusEffect(
    useCallback(() => {
      let abgebrochen = false;
      (async () => {
        const liste = await ladeUserAktivitaeten();
        if (!abgebrochen) setUserAktivitaeten(liste);
      })();
      return () => {
        abgebrochen = true;
      };
    }, [])
  );

  const alleAktivitaeten: Aktivitaet[] = [
    ...userAktivitaeten,
    ...DEMO_AKTIVITAETEN,
  ];

  const TAB_BAR_HOEHE = 49;
  // Verfügbare Höhe: Bildschirm minus Tab-Bar und unterer Safe-Area-Bereich.
  // Kein Abzug für insets.top – das Bild läuft bewusst bis ganz oben (wie Instagram).
  const verfuegbareHoehe = height - TAB_BAR_HOEHE - insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={alleAktivitaeten}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AktivitaetKarte
            item={item}
            verfuegbareHoehe={verfuegbareHoehe}
            topInset={insets.top}
            onPress={() =>
              router.push({
                pathname: "/aktivitaet/[id]",
                params: { id: item.id, modus: "teilnehmen" },
              })
            }
          />
        )}
        pagingEnabled
        snapToInterval={verfuegbareHoehe}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: verfuegbareHoehe,
          offset: verfuegbareHoehe * index,
          index,
        })}
      />

      {/* Floating Action Button: Treffen erstellen */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push("/aktivitaet/neu")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  teilnehmerReihe: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  profilRahmen: {
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  profilGrau: {
    backgroundColor: "#b0b0b8",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  infoBereich: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  titel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  ortReihe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ort: {
    fontSize: 13,
    color: "#888",
    flexShrink: 1,
  },
  beschreibung: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    flexShrink: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
