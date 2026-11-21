import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';

type MenuItem = {
  icon: string;
  label: string;
  detail?: string;
  onPress?: () => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function SettingsScreen() {
  const showUnavailable = (feature: string) => {
    Alert.alert(feature, `${feature} is not available yet.`);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', detail: 'amit@industrialbrain.io' },
        { icon: '🔑', label: 'Change Password', detail: 'Unavailable', onPress: () => showUnavailable('Password management') },
        { icon: '🏭', label: 'Organization', detail: 'EPIC Industries' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', label: 'Push Notifications', detail: 'Unavailable', onPress: () => showUnavailable('Push notifications') },
        { icon: '🌙', label: 'Dark Mode', detail: 'Always on' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: '📥', label: 'Offline Data', detail: 'Not available' },
        { icon: '🔄', label: 'Force Sync', detail: 'Unavailable', onPress: () => showUnavailable('Sync') },
        { icon: '🗑️', label: 'Clear Cache', detail: 'Unavailable', onPress: () => showUnavailable('Cache management') },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'ℹ️', label: 'Version', detail: '1.0.0' },
        { icon: '📄', label: 'Terms of Service', detail: 'Unavailable', onPress: () => showUnavailable('Terms of Service') },
        { icon: '🛡️', label: 'Privacy Policy', detail: 'Unavailable', onPress: () => showUnavailable('Privacy Policy') },
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
              {section.items.map((item, ii) => {
                const rowStyle = [styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder];
                const content = (
                  <>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.detail ? <Text style={styles.menuDetail}>{item.detail}</Text> : null}
                  </>
                );

                return item.onPress ? (
                  <TouchableOpacity
                    key={ii}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label}, ${item.detail}`}
                    activeOpacity={0.75}
                    onPress={item.onPress}
                    style={rowStyle}
                  >
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View key={ii} style={rowStyle}>
                    {content}
                  </View>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => Alert.alert('Log Out', 'Sign-in is not enabled in this app yet.')}
          style={styles.logoutButton}
        >
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
