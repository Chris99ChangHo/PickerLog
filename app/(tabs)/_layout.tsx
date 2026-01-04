// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { View, Image, StyleSheet } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "../../src/ui/theme";

// 1. 아이콘 컴포넌트를 외부로 분리 (린트 경고 해결 & 성능 최적화)
interface TabIconProps {
  focused: boolean;
  source: ImageSourcePropType;
}

const TabIcon = ({ focused, source }: TabIconProps) => (
  <View style={[styles.tabItem, focused && styles.tabItemActive]}>
    <Image
      source={source}
      style={[styles.icon, !focused && styles.iconInactive]}
      resizeMode="contain"
    />
  </View>
);

const makeTabIcon = (source: ImageSourcePropType) => ({ focused }: { focused: boolean }) =>
  <TabIcon focused={focused} source={source} />;

const entryIcon = makeTabIcon(require('../../assets/PickerLog-Entry.png'));
const calendarIcon = makeTabIcon(require('../../assets/PickerLog-Calendar.png'));
const statsIcon = makeTabIcon(require('../../assets/PickerLog-Stats.png'));
const infoIcon = makeTabIcon(require('../../assets/PickerLog-Info.png'));

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
      <Tabs.Screen
        name="entry"
        options={{
          title: "Entry",
          tabBarIcon: entryIcon,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: calendarIcon,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistics",
          tabBarIcon: statsIcon,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: infoIcon,
        }}
      />
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
