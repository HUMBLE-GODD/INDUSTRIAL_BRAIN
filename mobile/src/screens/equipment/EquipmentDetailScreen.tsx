import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DEMO_EQUIPMENT } from '../../data/equipment';

type RouteParams = {
  EquipmentDetail: { equipmentId: string; name: string };
};

export default function EquipmentDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetail'>>();
  const { equipmentId, name } = route.params;
  const equipment = DEMO_EQUIPMENT.find((item) => item.id === equipmentId);
  const healthColor = equipment
    ? equipment.demoHealthScore < 40
      ? colors.danger
      : equipment.demoHealthScore < 70
        ? colors.warning
        : colors.success
    : colors.textMuted;

  const equipmentInfo = [
    ['Equipment ID', equipment?.id ?? equipmentId],
    ['Asset Tag', equipment?.tag ?? name],
    ['Type', equipment?.type ?? 'Not available'],
    ['Location', equipment?.location ?? 'Not available'],
    ['Manufacturer', equipment?.manufacturer ?? 'Not available'],
    ['Model', equipment?.model ?? 'Not available'],
    ['Installed', equipment?.installDate ?? 'Not available'],
    ['Status', equipment?.status === 'maintenance' ? 'Maintenance' : equipment?.status === 'operational' ? 'Operational' : 'Not available'],
    ['Criticality', equipment?.criticality ? equipment.criticality[0].toUpperCase() + equipment.criticality.slice(1) : 'Not available'],
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.healthCard}>
          <Text style={styles.healthLabel}>Demo Health Score</Text>
          <Text style={[styles.healthValue, { color: healthColor }]}>
            {equipment ? `${equipment.demoHealthScore}%` : 'N/A'}
          </Text>
          <View style={styles.healthBarBg}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${equipment?.demoHealthScore ?? 0}%`,
                  backgroundColor: healthColor,
                },
              ]}
            />
          </View>
          <Text style={styles.demoNote}>Illustrative local value, not an API measurement</Text>
        </Card>

        <Text style={styles.sectionTitle}>Equipment Info</Text>
        <Card style={styles.infoCard}>
          {equipmentInfo.map(([label, value], i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>Seeded Components</Text>
        <View style={styles.tagsRow}>
          {equipment?.components.length ? equipment.components.map((component) => (
            <View key={component} style={styles.tag}>
              <Text style={styles.tagText}>{component}</Text>
            </View>
          )) : <Text style={styles.noData}>No seeded component links available.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Linked Failure Modes</Text>
        {equipment?.failureModes.length ? equipment.failureModes.map((failureMode) => (
          <Card key={failureMode.name} style={styles.failureCard}>
            <View style={styles.failureHeader}>
              <Text style={styles.failureMode}>{failureMode.name}</Text>
              <Badge severity={failureMode.severity} />
            </View>
            <Text style={styles.failureDetail}>Linked from the local seed component relationships.</Text>
          </Card>
        )) : <Text style={styles.noData}>No seeded failure links available.</Text>}
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
  demoNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
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
  noData: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
});
