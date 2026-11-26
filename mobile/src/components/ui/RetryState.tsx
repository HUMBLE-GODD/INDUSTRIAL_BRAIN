import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type RetryStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  busy?: boolean;
  compact?: boolean;
};

export function RetryState({ title, message, onRetry, busy = false, compact = false }: RetryStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onRetry} style={styles.button}>
        {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Retry</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.xl,
    margin: spacing.lg,
  },
  compact: { marginHorizontal: 0, marginTop: spacing.sm, padding: spacing.lg },
  title: { ...typography.body, color: colors.text, fontWeight: '600', textAlign: 'center' },
  message: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  button: { minHeight: 40, justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  buttonText: { ...typography.button, color: colors.background },
});
