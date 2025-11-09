// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { View, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from "../../src/ui/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: "#9AA2A9",
        tabBarActiveBackgroundColor: colors.brandSoft,
        tabBarInactiveBackgroundColor: colors.card,
        tabBarItemStyle: { borderRadius: 14, marginHorizontal: 8, marginVertical: 4 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarShowLabel: false,
      }}
    >
      {/* Entry */}
      <Tabs.Screen
        name="entry"
        options={{
          title: "Entry",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Image
                source={require('../../assets/PickerLog-Entry.png')}
                style={[styles.icon, !focused && styles.iconInactive]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      {/* Calendar */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Image
                source={require('../../assets/PickerLog-Calendar.png')}
                style={[styles.icon, !focused && styles.iconInactive]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      {/* Stats */}
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistics",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Image
                source={require('../../assets/PickerLog-Stats.png')}
                style={[styles.icon, !focused && styles.iconInactive]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />

      {/* Info (last) */}
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Image
                source={require('../../assets/PickerLog-Info.png')}
                style={[styles.icon, !focused && styles.iconInactive]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />

      {/* index screen hidden from tab menu */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabItemActive: {},
  icon: {
    width: 30,
    height: 30,
  },
  iconInactive: {
    opacity: 0.7,
  },
});








