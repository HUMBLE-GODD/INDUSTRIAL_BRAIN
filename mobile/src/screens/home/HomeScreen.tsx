import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const stats = [
    { label: 'Demo Equipment', value: '5', color: colors.primary },
    { label: 'Demo Alerts', value: '5', color: colors.danger },
    { label: 'Demo Health', value: '75%', color: colors.success },
    { label: 'In Maintenance', value: '1', color: colors.warning },
  ];

  const recentAlerts = [
    { id: 'EQ-001', title: 'Pump P-101 — Bearing Overheating', severity: 'critical' as const, time: 'Local sample' },
    { id: 'EQ-002', title: 'Heat Exchanger HX-202 — Seal Leakage', severity: 'high' as const, time: 'Local sample' },
    { id: 'EQ-003', title: 'Compressor C-305 — Valve Sticking', severity: 'medium' as const, time: 'Local sample' },
    { id: 'EQ-004', title: 'Conveyor CB-410 — Belt Slippage', severity: 'low' as const, time: 'Local sample' },
    { id: 'EQ-005', title: 'Boiler BLR-501 — Pressure Buildup', severity: 'critical' as const, time: 'Local sample' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Evening 👋</Text>
          <Text style={styles.title}>Industrial Brain</Text>
          <Text style={styles.demoNote}>Local demo data · equipment identities mirror the graph seed</Text>
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
        <Text style={styles.sectionTitle}>Demo Alerts</Text>
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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open QR scanner"
            activeOpacity={0.75}
            onPress={() => navigation.getParent()?.navigate('ScanTab')}
            style={styles.actionTouchTarget}
          >
            <Card style={styles.actionCard}>
              <Text style={styles.actionEmoji}>📷</Text>
              <Text style={styles.actionLabel}>Scan QR</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open Ask AI"
            activeOpacity={0.75}
            onPress={() => navigation.getParent()?.navigate('QueryTab')}
            style={styles.actionTouchTarget}
          >
            <Card style={styles.actionCard}>
              <Text style={styles.actionEmoji}>🤖</Text>
              <Text style={styles.actionLabel}>Ask AI</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Work orders are not available yet"
            activeOpacity={0.75}
            onPress={() => Alert.alert('Work Orders', 'Work orders are not available yet.')}
            style={styles.actionTouchTarget}
          >
            <Card style={styles.actionCard}>
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionLabel}>Work Orders</Text>
            </Card>
          </TouchableOpacity>
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
  demoNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
  actionTouchTarget: {
    flex: 1,
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
