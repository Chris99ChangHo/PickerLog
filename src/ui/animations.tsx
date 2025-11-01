import React from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';

export const FadeOnFocus: React.FC<{ style?: ViewStyle; children: React.ReactNode }> = ({ style, children }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      opacity.setValue(0);
      const anim = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true });
      anim.start();
      return () => anim.stop();
    }, [opacity])
  );

  return <Animated.View style={[{ flex: 1, opacity }, style]}>{children}</Animated.View>;
};

export default FadeOnFocus;

