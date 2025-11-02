// src/ui/components.tsx
import React from "react";
import { View, Text, ViewProps } from "react-native";
import { colors, radius, spacing, type as t } from "./theme";

export const Screen: React.FC<ViewProps> = ({ children, style, ...p }) => (
  <View style={[{ flex: 1, backgroundColor: colors.bg }, style]} {...p}>{children}</View>
);
export const Card: React.FC<ViewProps> = ({ children, style, ...p }) => (
  <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, style ]} {...p}>{children}</View>
);
export const SolidCard: React.FC<ViewProps> = ({ children, style, ...p }) => (
  <View style={[{ backgroundColor: colors.brand, borderRadius: radius.lg, padding: spacing.lg }, style ]} {...p}>{children}</View>
);
export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={[t.label, { marginBottom: spacing.xs }]}>{label}</Text>
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm }}>{children}</View>
  </View>
);
export const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={[t.h1, { marginBottom: spacing.md }]}>{children}</Text>
);
