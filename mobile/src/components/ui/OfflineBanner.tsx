import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  const { isOffline, isSessionExpired, dismissSessionExpired, logout, toggleOfflineMode } = useAuth();

  if (isSessionExpired) {
    return (
      <View style={[styles.banner, styles.sessionBanner]}>
        <View style={styles.textContainer}>
          <Text style={styles.sessionTitle}>🔒 Session Expired</Text>
          <Text style={styles.sessionSubtitle}>Your login token has expired. Please sign in again.</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={logout}>
          <Text style={styles.actionBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isOffline) {
    return (
      <View style={[styles.banner, styles.offlineBanner]}>
        <View style={styles.textContainer}>
          <Text style={styles.offlineTitle}>📡 Offline / Fixture Mode Active</Text>
          <Text style={styles.offlineSubtitle}>
            Showing contract-compliant local equipment data & cached results.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            toggleOfflineMode();
            if (onRetry) onRetry();
          }}
        >
          <Text style={styles.actionBtnText}>Go Online</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  sessionBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderBottomColor: colors.danger,
  },
  offlineBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderBottomColor: colors.warning,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  sessionTitle: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '700',
  },
  sessionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  offlineTitle: {
    ...typography.bodySmall,
    color: colors.warning,
    fontWeight: '700',
  },
  offlineSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionBtnText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
