import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_BAR_HEIGHT = 50;
const PILL_WIDTH = 46;
const PILL_HEIGHT = 30;

const icons: Record<string, IconName> = {
  personen: "people-outline",
  treffen: "calendar-outline",
  kurse: "book-outline",
  chat: "chatbubble-outline",
  profil: "person-outline",
};

const activeIcons: Record<string, IconName> = {
  personen: "people",
  treffen: "calendar",
  kurse: "book",
  chat: "chatbubble",
  profil: "person",
};

function BlurTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  const tabWidth = barWidth / state.routes.length;

  useEffect(() => {
    if (!tabWidth) return;

    Animated.spring(translateX, {
      toValue: state.index * tabWidth + (tabWidth - PILL_WIDTH) / 2,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, translateX]);

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
      onLayout={(event) => {
        setBarWidth(event.nativeEvent.layout.width);
      }}
    >
      <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />

      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      )}

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const iconName = focused
            ? activeIcons[route.name] ?? "ellipse"
            : icons[route.name] ?? "ellipse-outline";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? "#0A84FF" : "rgba(255,255,255,0.78)"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BlurTabBar {...props} />}
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerBackground: () => (
          <BlurView
            tint="light"
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen name="personen" options={{ title: "Personen" }} />
      <Tabs.Screen name="treffen" options={{ title: "Treffen" }} />
      <Tabs.Screen name="kurse" options={{ title: "Kurse" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(20,20,20,0.35)",
    overflow: "hidden",
  },

  tabRow: {
    flex: 1,
    flexDirection: "row",
  },

  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },

  activePill: {
    position: "absolute",
    top: 11,
    left: 0,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: "rgba(10,132,255,0.16)",
  },
});