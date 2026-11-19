import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', detail: 'amit@industrialbrain.io' },
        { icon: '🔑', label: 'Change Password', detail: '' },
        { icon: '🏭', label: 'Organization', detail: 'EPIC Industries' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', label: 'Push Notifications', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: '🌙', label: 'Dark Mode', toggle: true, value: darkMode, onToggle: setDarkMode },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: '📥', label: 'Offline Data', detail: '42 MB cached' },
        { icon: '🔄', label: 'Force Sync', detail: '' },
        { icon: '🗑️', label: 'Clear Cache', detail: '' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'ℹ️', label: 'Version', detail: '1.0.0' },
        { icon: '📄', label: 'Terms of Service', detail: '' },
        { icon: '🛡️', label: 'Privacy Policy', detail: '' },
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
            <Text style={styles.avatarText}>AB</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Amit Bhatt</Text>
            <Text style={styles.userRole}>Plant Engineer</Text>
          </View>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item: any, ii) => (
                <TouchableOpacity key={ii} style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: colors.primaryDark }}
                      thumbColor={item.value ? colors.primary : colors.textMuted}
                    />
                  ) : (
                    <Text style={styles.menuDetail}>{item.detail}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪  Log Out</Text>
        </TouchableOpacity>
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
