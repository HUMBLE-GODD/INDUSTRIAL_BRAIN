import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../api/client';
import { EquipmentSummary } from '../../api/types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentSummary[]>([]);

  useEffect(() => {
    ApiClient.getEquipmentList().then(setEquipmentList).catch(() => {});
  }, []);

  const totalAssets = equipmentList.length || 5;
  const criticalCount = equipmentList.filter((e) => e.criticality === 'critical' || e.status === 'critical').length || 1;
  const avgHealth = equipmentList.length
    ? Math.round(equipmentList.reduce((acc, e) => acc + e.health_score, 0) / equipmentList.length)
    : 64;

  const stats = [
    { label: 'Monitored Assets', value: String(totalAssets), color: colors.primary },
    { label: 'Fleet Health', value: `${avgHealth}%`, color: colors.success },
    { label: 'Critical Assets', value: String(criticalCount), color: colors.danger },
    { label: 'Open Alerts', value: '4', color: colors.warning },
  ];

  const recentAlerts = [
    {
      id: '1',
      equipmentId: 'EQ-001',
      title: 'Centrifugal Pump P-101 — High Vibration (4.8 mm/s)',
      severity: 'critical' as const,
      time: '12 min ago',
    },
    {
      id: '2',
      equipmentId: 'EQ-005',
      title: 'Boiler BLR-501 — Relief Valve Seat Weepage Risk',
      severity: 'high' as const,
      time: '45 min ago',
    },
    {
      id: '3',
      equipmentId: 'EQ-002',
      title: 'Heat Exchanger HX-202 — Low-Rated Gasket Warning',
      severity: 'medium' as const,
      time: '2 hrs ago',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Technician'} 👋
          </Text>
          <Text style={styles.title}>Industrial Brain</Text>
          <Text style={styles.subtitle}>Field Operations & Asset Health Portal</Text>
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

        {/* Quick Field Actions */}
        <Text style={styles.sectionTitle}>Field Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ScanTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionEmoji}>📷</Text>
            <Text style={styles.actionTitle}>Scan Asset QR</Text>
            <Text style={styles.actionSub}>Instant camera lookup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('EquipmentTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionEmoji}>🔧</Text>
            <Text style={styles.actionTitle}>Asset Catalog</Text>
            <Text style={styles.actionSub}>Browse all 5 equipment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('QueryTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionEmoji}>🤖</Text>
            <Text style={styles.actionTitle}>Ask AI</Text>
            <Text style={styles.actionSub}>GraphRAG reasoning</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts Feed */}
        <View style={styles.alertsHeader}>
          <Text style={styles.sectionTitle}>Active Equipment Alerts</Text>
        </View>

        {recentAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('EquipmentTab', {
                screen: 'EquipmentDetail',
                params: { equipmentId: alert.equipmentId },
              })
            }
          >
            <Card style={styles.alertCard}>
              <View style={styles.alertRow}>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertTime}>
                    {alert.equipmentId} • {alert.time}
                  </Text>
                </View>
                <Badge severity={alert.severity} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
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
  greeting: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  alertTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  alertTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
