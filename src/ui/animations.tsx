import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';

export const FadeOnFocus: React.FC<{ style?: ViewStyle; children: React.ReactNode }> = ({ style, children }) => {
  const opacity = React.useMemo(() => new Animated.Value(0), []);

  useFocusEffect(
    React.useCallback(() => {
      opacity.setValue(0);
      const anim = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true });
      anim.start();
      return () => anim.stop();
    }, [opacity])
  );

  return <Animated.View style={[styles.container, { opacity }, style]}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FadeOnFocus;
