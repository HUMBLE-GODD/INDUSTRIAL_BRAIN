import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { API_IS_CONFIGURED } from '../../lib/api/client';
import { useSession } from '../../auth/SessionContext';

type MenuItem = {
  icon: string;
  label: string;
  detail?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function SettingsScreen() {
  const { user, token, signOut } = useSession();
  const menuSections: MenuSection[] = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', detail: user?.email ?? (token ? 'Signed in' : 'No API session') },
        { icon: '🪪', label: 'Role', detail: user?.role ?? (token ? 'Authenticated' : 'Fixture mode') },
        { icon: '🔑', label: 'Change Password', detail: 'Unavailable' },
        { icon: '🏭', label: 'Organization', detail: 'API account' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', label: 'Push Notifications', detail: 'Unavailable' },
        { icon: '🌙', label: 'Dark Mode', detail: 'Always on' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: '📥', label: 'Data source', detail: API_IS_CONFIGURED ? 'Live API' : 'Local fixtures' },
        { icon: '🔄', label: 'Sync equipment', detail: API_IS_CONFIGURED ? 'Pull down on Equipment or Home' : 'Configure API URL' },
        { icon: '🗑️', label: 'Clear Cache', detail: 'Unavailable' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'ℹ️', label: 'Version', detail: '1.0.0' },
        { icon: '📄', label: 'Terms of Service', detail: 'Unavailable' },
        { icon: '🛡️', label: 'Privacy Policy', detail: 'Unavailable' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email ? user.email.slice(0, 2).toUpperCase() : 'IB'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.email ?? (token ? 'Signed in' : 'Local demo')}</Text>
            <Text style={styles.userRole}>{user?.role ? `${user.role} · API session` : API_IS_CONFIGURED ? 'Sign in to sync data' : 'Fixture mode'}</Text>
          </View>
        </Card>
        <DataModeNotice />

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, ii) => {
                const rowStyle = [styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder];
                const content = (
                  <>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.detail ? <Text style={styles.menuDetail}>{item.detail}</Text> : null}
                  </>
                );

                return (
                  <View key={ii} style={rowStyle}>
                    {content}
                  </View>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Logout */}
        {token ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>🚪  Sign out</Text>
          </TouchableOpacity>
        ) : null}
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xxl,
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
    ...typography.h2,
    color: colors.background,
    fontWeight: '700',
  },
  userInfo: {},
  userName: {
    ...typography.h3,
    color: colors.text,
  },
  userRole: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  menuDetail: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.button,
    color: colors.danger,
  },
});
