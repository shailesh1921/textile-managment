import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style }) => {
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: COLORS.successLight, text: COLORS.success };
      case 'warning': return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'danger': return { bg: COLORS.dangerLight, text: COLORS.danger };
      case 'info': return { bg: COLORS.infoLight, text: COLORS.info };
      default: return { bg: COLORS.borderLight, text: COLORS.textSecondary };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
