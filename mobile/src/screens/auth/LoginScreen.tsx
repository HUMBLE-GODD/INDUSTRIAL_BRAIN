import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';

export default function LoginScreen() {
  const { login, isOffline, toggleOfflineMode } = useAuth();
  const [email, setEmail] = useState('surbhi.field@industrialbrain.io');
  const [password, setPassword] = useState('techdemo123');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    if (!targetEmail.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!targetPassword.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login({
        email: targetEmail.trim(),
        password: targetPassword,
      });
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to authenticate. Check your credentials or network connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoTechnicianLogin = () => {
    setEmail('surbhi.field@industrialbrain.io');
    setPassword('techdemo123');
    handleLogin('surbhi.field@industrialbrain.io', 'techdemo123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>FIELD TECHNICIAN WORKFLOW</Text>
              </View>
              {isOffline && (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>OFFLINE MODE</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>Industrial Brain</Text>
            <Text style={styles.subtitle}>
              Asset lookup, sensor telemetry, and field observations
            </Text>
          </View>

          {/* Login Card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Technician Sign In</Text>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Work Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="technician@company.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={() => handleLogin()}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In to Field Portal</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK DEMO</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoTechnicianLogin}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.demoButtonText}>⚡ Sign In as Demo Technician (Surbhi)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offlineToggleRow}
              onPress={toggleOfflineMode}
              activeOpacity={0.7}
            >
              <Text style={styles.offlineToggleLabel}>
                {isOffline ? '🟢 Switch to Live API' : '📡 Toggle Offline / Mock Fixtures'}
              </Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.footerNote}>
            Industrial Brain • Secure JWT Auth Contract • Expo 57
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  platformBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  offlineBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  offlineBadgeText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '700',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.xl,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    letterSpacing: 1,
  },
  demoButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  demoButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  offlineToggleRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  offlineToggleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
