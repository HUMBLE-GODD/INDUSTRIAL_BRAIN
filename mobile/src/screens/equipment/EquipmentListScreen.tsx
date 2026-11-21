import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DEMO_EQUIPMENT, type Equipment } from '../../data/equipment';

function getHealthColor(health: number): string {
  if (health < 40) return colors.danger;
  if (health < 60) return colors.warning;
  if (health < 80) return colors.info;
  return colors.success;
}

export default function EquipmentListScreen() {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: Equipment }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id, name: item.name })}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.equipmentId}>{item.id}</Text>
            <Badge
              severity={item.criticality}
              label={item.status === 'operational' ? 'Operational' : 'Maintenance'}
            />
          </View>
          <Text style={styles.equipmentName}>{item.name}</Text>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{item.type}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Demo health</Text>
            <Text style={[styles.detailValue, { color: getHealthColor(item.demoHealthScore) }]}>
              {item.demoHealthScore}%
            </Text>
          </View>
        </View>

        {/* Health Bar */}
        <View style={styles.healthBarBackground}>
          <View
            style={[
              styles.healthBarFill,
              { width: `${item.demoHealthScore}%`, backgroundColor: getHealthColor(item.demoHealthScore) },
            ]}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipment</Text>
        <Text style={styles.subtitle}>Local demo data · {DEMO_EQUIPMENT.length} seeded assets · scores are illustrative</Text>
      </View>
      <FlatList
        data={DEMO_EQUIPMENT}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  equipmentId: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  equipmentName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailItem: {},
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  healthBarBackground: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
