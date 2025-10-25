// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/ui/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: "#9AA2A9",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.border },
        tabBarShowLabel: false,
      }}
    >
      {/* Entry 탭 */}
      <Tabs.Screen
        name="entry"
        options={{
          title: "Entry",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color: color }}>✏️</Text>
          ),
        }}
      />
      {/* Calendar 탭 */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color: color }}>📅</Text>
          ),
        }}
      />
      {/* Stats 탭 */}
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color: color }}>📊</Text>
          ),
        }}
      />
      
      {/* index 스크린은 탭 메뉴에 표시하지 않음 */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}