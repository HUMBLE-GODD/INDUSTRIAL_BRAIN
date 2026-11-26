import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { API_IS_CONFIGURED } from '../../lib/api/client';
import { colors, spacing, typography } from '../../theme';

export function DataModeNotice() {
  return (
    <View style={[styles.container, API_IS_CONFIGURED ? styles.live : styles.fixture]}>
      <Text style={[styles.label, { color: API_IS_CONFIGURED ? colors.success : colors.warning }]}>
        {API_IS_CONFIGURED ? 'LIVE API' : 'FIXTURE MODE'}
      </Text>
      <Text style={styles.detail}>
        {API_IS_CONFIGURED
          ? 'Shared API data · changes sync with the web app'
          : 'Local sample data · set EXPO_PUBLIC_API_URL to enable shared sync'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  live: {
    backgroundColor: '#00E67612',
    borderColor: '#00E67655',
  },
  fixture: {
    backgroundColor: '#FFD60012',
    borderColor: '#FFD60055',
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
