// src/ui/TabIcon.tsx
import * as React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  focused: boolean;
  scale?: number; // visual normalization factor (0.85~1.05)
};

export function TabIcon({ source, focused, scale = 1 }: Props) {
  return (
    <Image
      source={source}
      style={[
        styles.icon,
        { transform: [{ scale }] },
        !focused && styles.inactive,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
  inactive: {
    opacity: 0.7,
  },
});
