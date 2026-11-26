import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { config } from '../../api/config';
import { TokenStorage } from '../../api/storage';

export default function SettingsScreen() {
  const { user, logout, isOffline, toggleOfflineMode } = useAuth();
  const [backendUrl, setBackendUrl] = useState(config.getBaseUrl());
  const [editingUrl, setEditingUrl] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveUrl = async () => {
    try {
      const cleanUrl = backendUrl.trim().replace(/\/+$/, '');
      config.setCustomBaseUrl(cleanUrl);
      await TokenStorage.saveCustomUrl(cleanUrl);
      setEditingUrl(false);
      setSavedNotice('Backend URL saved successfully.');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      Alert.alert('Error', 'Failed to save custom backend URL.');
    }
  };

  const handleResetUrl = async () => {
    config.setCustomBaseUrl(null);
    await TokenStorage.saveCustomUrl(null);
    setBackendUrl(config.getBaseUrl());
    setEditingUrl(false);
    setSavedNotice('Reset to default API URL.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Technician Settings</Text>
          <Text style={styles.subtitle}>Profile, network connectivity, and storage</Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'SB'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Surbhi (Lead Field Tech)'}</Text>
            <Text style={styles.userRole}>
              {(user?.role || 'technician').toUpperCase()} • Plant Reliability
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'surbhi.field@industrialbrain.io'}</Text>
          </View>
        </Card>

        {savedNotice && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>✓ {savedNotice}</Text>
          </View>
        )}

        {/* Network & Backend Configuration */}
        <Text style={styles.sectionTitle}>Backend API Configuration</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingLabel}>Offline / Fixture Mode</Text>
              <Text style={styles.settingDesc}>
                Use contract-compliant local mock fixtures without a backend
              </Text>
            </View>
            <Switch
              value={isOffline}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.urlSection}>
            <Text style={styles.settingLabel}>Target Backend URL</Text>
            <Text style={styles.settingDesc}>
              Configured for Tatvik & Prathmesh API endpoints (FastAPI /api/v1)
            </Text>

            {editingUrl ? (
              <View style={styles.urlInputBlock}>
                <TextInput
                  style={styles.urlInput}
                  value={backendUrl}
                  onChangeText={setBackendUrl}
                  placeholder="http://localhost:8000"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.urlActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingUrl(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.urlDisplayRow}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {backendUrl}
                </Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditingUrl(true)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.resetLink} onPress={handleResetUrl}>
              <Text style={styles.resetLinkText}>Reset to default URL</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Session Management */}
        <Text style={styles.sectionTitle}>Account Session</Text>
        <Card style={styles.sectionCard}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>Log Out of Field Portal</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.footerInfo}>
          Industrial Brain Mobile Field App v1.0.0{'\n'}
          Contract: Tatvik (Auth/Equipment) • Prathmesh (Decision Services)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.background,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
  },
  userRole: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noticeBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  settingDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  urlSection: {},
  urlDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  editBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  editBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  urlInputBlock: {
    marginTop: spacing.sm,
  },
  urlInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: colors.text,
  },
  urlActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  saveBtnText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
  resetLink: {
    marginTop: spacing.sm,
  },
  resetLinkText: {
    fontSize: 10,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.danger,
    fontWeight: '700',
  },
  footerInfo: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
