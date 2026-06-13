import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarShowLabel: false,
        
        // 1. The Pill-Shaped Bottom Bar Styling
        tabBarStyle: {
          position: "absolute",
          bottom: 24,           // Lifts the bar off the bottom
          left: 20,             // Margin from left
          right: 20,            // Margin from right
          height: 65,           // Slightly taller for comfortable tapping
          borderRadius: 35,     // Makes it a perfect pill
          backgroundColor: "transparent", 
          borderTopWidth: 0,    // Removes the default top line
          elevation: 0,         // Removes default Android shadows
          // Subtle drop shadow for the pill
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        
        // 2. The Glassy Blur Effect inside the Pill
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 35, overflow: "hidden" }}>
            <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
          </View>
        ),

        // 3. The Glassy Top Header (for screens that show a header)
        headerTransparent: true,
        headerBackground: () => (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="personen"
        options={{
          title: "Personen",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="treffen"
        options={{
          title: "Treffen",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kurse"
        options={{
          title: "Kurse",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          // The header rules from screenOptions apply here automatically
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}