// src/ui/GestureRoot.web.tsx
import * as React from 'react';
import { ViewProps } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const GestureRoot: React.FC<ViewProps> = ({ children, style, ...p }) => (
  <GestureHandlerRootView style={[{ flex: 1 }, style]} {...p}>
    {children}
  </GestureHandlerRootView>
);

