import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { RetryState } from '../../components/ui/RetryState';
import { API_IS_CONFIGURED, ApiError, equipmentApi } from '../../lib/api/client';
import { DEMO_EQUIPMENT } from '../../data/equipment';

type InventoryCounts = { total: number | null; operational: number | null; maintenance: number | null };

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [counts, setCounts] = useState<InventoryCounts>(API_IS_CONFIGURED
    ? { total: null, operational: null, maintenance: null }
    : {
      total: DEMO_EQUIPMENT.length,
      operational: DEMO_EQUIPMENT.filter((item) => item.status === 'operational').length,
      maintenance: DEMO_EQUIPMENT.filter((item) => item.status === 'maintenance').length,
    });
  const [loading, setLoading] = useState(API_IS_CONFIGURED);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const requestActive = useRef(false);

  const refreshInventory = useCallback(async (pullToRefresh = false) => {
    if (requestActive.current) return;
    if (!API_IS_CONFIGURED) {
      setCounts({
        total: DEMO_EQUIPMENT.length,
        operational: DEMO_EQUIPMENT.filter((item) => item.status === 'operational').length,
        maintenance: DEMO_EQUIPMENT.filter((item) => item.status === 'maintenance').length,
      });
      setInventoryError('');
      return;
    }
    requestActive.current = true;
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);
    setInventoryError('');
    try {
      const firstPage = await equipmentApi.list({ page: 1, page_size: 100 });
      const allItems = [...firstPage.items];
      for (let page = 2; page <= firstPage.pages; page += 1) {
        const nextPage = await equipmentApi.list({ page, page_size: 100 });
        allItems.push(...nextPage.items);
      }
      setCounts({
        total: firstPage.total,
        operational: allItems.filter((item) => item.status.toLowerCase() === 'operational').length,
        maintenance: allItems.filter((item) => item.status.toLowerCase().includes('maintenance')).length,
      });
    } catch (cause) {
      setInventoryError(cause instanceof ApiError ? cause.message : 'The equipment summary could not be refreshed.');
    } finally {
      requestActive.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refreshInventory();
  }, [refreshInventory]));

  const stats = [
    { label: API_IS_CONFIGURED ? 'Shared Equipment' : 'Fixture Equipment', value: counts.total?.toString() ?? '—', color: colors.primary },
    { label: 'Operational', value: counts.operational?.toString() ?? '—', color: colors.success },
    { label: 'In Maintenance', value: counts.maintenance?.toString() ?? '—', color: colors.warning },
    { label: 'Demo Alerts', value: '5', color: colors.danger },
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshInventory(true)} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Evening 👋</Text>
          <Text style={styles.title}>Industrial Brain</Text>
          <Text style={styles.demoNote}>{API_IS_CONFIGURED ? 'Equipment counts use the shared API inventory' : 'Equipment identities mirror the local graph seed'}</Text>
          <DataModeNotice />
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
        {loading ? <ActivityIndicator color={colors.primary} style={styles.inventoryLoading} /> : null}
        {inventoryError ? <RetryState compact title="Inventory summary unavailable" message={inventoryError} onRetry={() => void refreshInventory(true)} /> : null}

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
  inventoryLoading: {
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
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
