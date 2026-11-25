import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { ApiClient } from '../../api/client';
import { EquipmentSummary } from '../../api/types';

function getHealthColor(health: number): string {
  if (health < 40) return colors.danger;
  if (health < 60) return '#f97316'; // orange
  if (health < 80) return colors.warning;
  return colors.success;
}

export default function EquipmentListScreen() {
  const navigation = useNavigation<any>();
  const [equipmentList, setEquipmentList] = useState<EquipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high' | 'maintenance'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    try {
      setError(null);
      const data = await ApiClient.getEquipmentList();
      setEquipmentList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load equipment list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEquipment();
  };

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (selectedFilter === 'critical') {
        return item.criticality === 'critical' || item.status === 'critical';
      }
      if (selectedFilter === 'high') {
        return item.criticality === 'high';
      }
      if (selectedFilter === 'maintenance') {
        return item.status === 'maintenance';
      }
      return true;
    });
  }, [equipmentList, searchQuery, selectedFilter]);

  const renderItem = ({ item }: { item: EquipmentSummary }) => {
    const healthColor = getHealthColor(item.health_score);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('EquipmentDetail', {
            equipmentId: item.id,
            name: item.name,
          })
        }
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.equipmentId}>{item.id}</Text>
              <Badge severity={item.criticality} />
            </View>
            <Text style={styles.equipmentName}>{item.name}</Text>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{item.type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Health</Text>
              <Text style={[styles.detailValue, { color: healthColor, fontWeight: '700' }]}>
                {item.health_score}%
              </Text>
            </View>
          </View>

          {/* Health Bar */}
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${item.health_score}%`, backgroundColor: healthColor },
              ]}
            />
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.statusPill}>Status: {item.status.toUpperCase()}</Text>
            <Text style={styles.viewDetailsText}>View Asset →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner onRetry={fetchEquipment} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Equipment Assets</Text>
          <Text style={styles.assetCountBadge}>
            {equipmentList.length} ASSETS
          </Text>
        </View>
        <Text style={styles.subtitle}>
          Monitored fleet status, telemetry, and supplier risk
        </Text>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by ID (e.g. EQ-001), name, location..."
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {[
            { label: 'All Assets', key: 'all' as const },
            { label: 'Critical', key: 'critical' as const },
            { label: 'High Risk', key: 'high' as const },
            { label: 'In Maintenance', key: 'maintenance' as const },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                selectedFilter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading equipment catalog..." />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEquipment}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredEquipment.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Equipment Found"
          message={
            searchQuery
              ? `No monitored assets match "${searchQuery}".`
              : 'No equipment matches the selected filter.'
          }
        />
      ) : (
        <FlatList
          data={filteredEquipment}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  assetCountBadge: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  searchRow: {
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodySmall,
    color: colors.text,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  filterChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.md,
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
  detailItem: {
    flex: 1,
  },
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusPill: {
    ...typography.caption,
    color: colors.textMuted,
  },
  viewDetailsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background,
  },
});
