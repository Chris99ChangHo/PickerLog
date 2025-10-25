// src/ui/Button.tsx

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from './theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  /** 버튼의 스타일 종류: 'solid'(기본값) 또는 'outline' */
  variant?: 'solid' | 'outline';
  /** 버튼 비활성화 여부 */
  disabled?: boolean; 
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'solid', disabled = false }) => {
  const currentVariant = disabled ? 'solid' : 'outline';
  const isSolid = currentVariant === 'solid';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled} 
      style={({ pressed }) => [
        styles.button,
        isSolid ? styles.solid : styles.outline,
        disabled && styles.disabled, 
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, isSolid ? styles.solidText : styles.outlineText]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  solid: {
    backgroundColor: colors.brand,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  solidText: {
    color: 'white',
  },
  outlineText: {
    color: colors.brand,
  },
  disabled: {
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.7,
  },
});