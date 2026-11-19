import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius } from '../../theme';

type Severity = 'critical' | 'high' | 'medium' | 'low';

type BadgeProps = {
  severity: Severity;
  label?: string;
};

const SEVERITY_CONFIG: Record<Severity, { bg: string; text: string; label: string }> = {
  critical: { bg: '#FF174420', text: colors.critical, label: 'Critical' },
  high: { bg: '#FF6D0020', text: colors.high, label: 'High' },
  medium: { bg: '#FFD60020', text: colors.medium, label: 'Medium' },
  low: { bg: '#00E67620', text: colors.low, label: 'OK' },
};

export function Badge({ severity, label }: BadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>{label || config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
