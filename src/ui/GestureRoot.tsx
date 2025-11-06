// src/ui/GestureRoot.tsx (web/default fallback)
import * as React from 'react';
import { View, ViewProps } from 'react-native';

export const GestureRoot: React.FC<ViewProps> = ({ children, style, ...p }) => (
  <View style={[{ flex: 1 }, style]} {...p}>{children}</View>
);
