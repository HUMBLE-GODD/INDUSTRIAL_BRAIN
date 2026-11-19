import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function HomeScreen() {
  const stats = [
    { label: 'Total Equipment', value: '50', color: colors.primary },
    { label: 'Active Alerts', value: '7', color: colors.danger },
    { label: 'Health Score', value: '78%', color: colors.success },
    { label: 'Pending Tasks', value: '12', color: colors.warning },
  ];

  const recentAlerts = [
    { id: '1', title: 'Pump P-101 — Bearing Vibration High', severity: 'critical' as const, time: '5 min ago' },
    { id: '2', title: 'Compressor C-205 — Overheating Warning', severity: 'high' as const, time: '23 min ago' },
    { id: '3', title: 'Motor M-301 — Scheduled Maintenance Due', severity: 'medium' as const, time: '1 hr ago' },
    { id: '4', title: 'Heat Exchanger HX-102 — Inspection Passed', severity: 'low' as const, time: '3 hrs ago' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Evening 👋</Text>
          <Text style={styles.title}>Industrial Brain</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Recent Alerts */}
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {recentAlerts.map((alert) => (
          <Card key={alert.id} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
              <Badge severity={alert.severity} />
            </View>
          </Card>
        ))}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Card style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📷</Text>
            <Text style={styles.actionLabel}>Scan QR</Text>
          </Card>
          <Card style={styles.actionCard}>
            <Text style={styles.actionEmoji}>🤖</Text>
            <Text style={styles.actionLabel}>Ask AI</Text>
          </Card>
          <Card style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionLabel}>Work Orders</Text>
          </Card>
        </View>
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
    marginBottom: spacing.xxl,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  alertCard: {
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  alertTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  alertTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  actionCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
