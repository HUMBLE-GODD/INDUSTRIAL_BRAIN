import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { ApiError } from '../../lib/api/client';
import { colors, spacing, typography } from '../../theme';
import { useSession } from '../../auth/SessionContext';

export default function AuthScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password, createAccount);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Sign-in failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>INDUSTRIAL OPERATIONS</Text>
            <Text style={styles.title}>Industrial Brain</Text>
            <Text style={styles.subtitle}>Sign in to sync field and equipment data.</Text>
            <DataModeNotice />
          </View>

          <Card style={styles.card}>
            <Text style={styles.formTitle}>{createAccount ? 'Create account' : 'Sign in'}</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@company.com"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={createAccount ? 'new-password' : 'current-password'}
              placeholder={createAccount ? 'At least 8 characters' : 'Password'}
              placeholderTextColor={colors.textMuted}
              returnKeyType="go"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy}
              onPress={submit}
              style={[styles.submit, busy && styles.disabled]}
            >
              {busy ? <ActivityIndicator color={colors.background} /> : (
                <Text style={styles.submitText}>{createAccount ? 'Create account' : 'Sign in'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setCreateAccount((value) => !value);
                setError('');
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {createAccount ? 'Already have an account? Sign in' : 'New to Industrial Brain? Create an account'}
              </Text>
            </TouchableOpacity>
          </Card>
          <Text style={styles.sessionNote}>Your bearer token is stored locally and expires according to the API session policy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingBottom: spacing.huge },
  header: { marginBottom: spacing.xl },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  card: { padding: spacing.xl },
  formTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    minHeight: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  error: { ...typography.bodySmall, color: colors.danger, marginBottom: spacing.md },
  submit: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.sm },
  submitText: { ...typography.button, color: colors.background },
  disabled: { opacity: 0.6 },
  switchButton: { alignItems: 'center', paddingTop: spacing.lg },
  switchText: { ...typography.bodySmall, color: colors.primary, textAlign: 'center' },
  sessionNote: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
