import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

type RouteParams = {
  EquipmentDetail: { equipmentId: string; name: string };
};

export default function EquipmentDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetail'>>();
  const { equipmentId, name } = route.params;

  // Mock data for this equipment
  const equipment = {
    id: equipmentId,
    name,
    type: 'Centrifugal Pump',
    location: 'Unit-1',
    manufacturer: 'Siemens',
    installDate: '2019-06-15',
    criticality: 'Critical',
    health: 34,
    rul: 18,
    lastMaintenance: '2024-12-10',
    components: ['Bearing', 'Seal', 'Impeller', 'Motor Coupling'],
    recentFailures: [
      { date: '2024-11-28', mode: 'Bearing failure', downtime: '8 hrs' },
      { date: '2024-08-15', mode: 'Seal leak', downtime: '4 hrs' },
    ],
  };

  const healthColor = equipment.health < 40 ? colors.danger : equipment.health < 70 ? colors.warning : colors.success;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Health Score */}
        <Card style={styles.healthCard}>
          <Text style={styles.healthLabel}>Health Score</Text>
          <Text style={[styles.healthValue, { color: healthColor }]}>{equipment.health}%</Text>
          <View style={styles.healthBarBg}>
            <View style={[styles.healthBarFill, { width: `${equipment.health}%`, backgroundColor: healthColor }]} />
          </View>
          <Text style={styles.rulText}>
            Estimated RUL: <Text style={{ color: colors.warning, fontWeight: '700' }}>{equipment.rul} cycles</Text>
          </Text>
        </Card>

        {/* Details */}
        <Text style={styles.sectionTitle}>Equipment Info</Text>
        <Card style={styles.infoCard}>
          {[
            ['ID', equipment.id],
            ['Type', equipment.type],
            ['Location', equipment.location],
            ['Manufacturer', equipment.manufacturer],
            ['Installed', equipment.installDate],
            ['Criticality', equipment.criticality],
            ['Last Maintenance', equipment.lastMaintenance],
          ].map(([label, value], i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        {/* Components */}
        <Text style={styles.sectionTitle}>Components</Text>
        <View style={styles.tagsRow}>
          {equipment.components.map((comp, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{comp}</Text>
            </View>
          ))}
        </View>

        {/* Recent Failures */}
        <Text style={styles.sectionTitle}>Recent Failures</Text>
        {equipment.recentFailures.map((failure, i) => (
          <Card key={i} style={styles.failureCard}>
            <View style={styles.failureHeader}>
              <Text style={styles.failureMode}>{failure.mode}</Text>
              <Badge severity="critical" />
            </View>
            <Text style={styles.failureDetail}>Date: {failure.date}  •  Downtime: {failure.downtime}</Text>
          </Card>
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
  healthCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  healthLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  healthValue: {
    fontSize: 56,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  healthBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rulText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoCard: {
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  failureCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  failureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  failureMode: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  failureDetail: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
