import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

type Equipment = {
  id: string;
  name: string;
  type: string;
  location: string;
  health: number;
  status: 'critical' | 'high' | 'medium' | 'low';
};

const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'P-101', name: 'Centrifugal Pump P-101', type: 'Pump', location: 'Unit-1', health: 34, status: 'critical' },
  { id: 'C-205', name: 'Compressor C-205', type: 'Compressor', location: 'Unit-2', health: 52, status: 'high' },
  { id: 'M-301', name: 'Electric Motor M-301', type: 'Motor', location: 'Unit-1', health: 71, status: 'medium' },
  { id: 'HX-102', name: 'Heat Exchanger HX-102', type: 'Heat Exchanger', location: 'Unit-3', health: 88, status: 'low' },
  { id: 'CB-401', name: 'Conveyor Belt CB-401', type: 'Conveyor', location: 'Utility', health: 95, status: 'low' },
  { id: 'P-103', name: 'Centrifugal Pump P-103', type: 'Pump', location: 'Tank Farm', health: 63, status: 'medium' },
];

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
            <Badge severity={item.status} />
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
            <Text style={styles.detailLabel}>Health</Text>
            <Text style={[styles.detailValue, { color: getHealthColor(item.health) }]}>
              {item.health}%
            </Text>
          </View>
        </View>

        {/* Health Bar */}
        <View style={styles.healthBarBackground}>
          <View
            style={[
              styles.healthBarFill,
              { width: `${item.health}%`, backgroundColor: getHealthColor(item.health) },
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
        <Text style={styles.subtitle}>{MOCK_EQUIPMENT.length} assets monitored</Text>
      </View>
      <FlatList
        data={MOCK_EQUIPMENT}
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
