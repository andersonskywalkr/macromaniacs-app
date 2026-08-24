import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const { tokens } = useTheme();
  const badgeColor = color ?? tokens.primary;

  return (
    <View
      accessible
      accessibilityRole="text"
      style={[styles.base, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}
    >
      <Text style={[styles.label, { color: badgeColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '600',
    fontSize: 12,
  },
});
