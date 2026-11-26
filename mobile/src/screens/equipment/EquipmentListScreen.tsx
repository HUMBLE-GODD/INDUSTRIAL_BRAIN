import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RetryState } from '../../components/ui/RetryState';
import { API_IS_CONFIGURED, ApiError, equipmentApi } from '../../lib/api/client';
import type { EquipmentResponse } from '../../lib/api/types';
import { DEMO_EQUIPMENT_RECORDS, type EquipmentViewRecord } from '../../data/equipment';

function severityFor(value: string): 'critical' | 'high' | 'medium' | 'low' {
  const severity = value.toLowerCase();
  return severity === 'critical' || severity === 'high' || severity === 'low' ? severity : 'medium';
}

function statusLabel(status: string): string {
  return status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getHealthColor(health: number): string {
  if (health < 40) return colors.danger;
  if (health < 60) return colors.warning;
  if (health < 80) return colors.info;
  return colors.success;
}

export default function EquipmentListScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<EquipmentViewRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(API_IS_CONFIGURED);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestActive = useRef(false);
  const hasLoaded = useRef(false);

  const loadEquipment = useCallback(async (pullToRefresh = false) => {
    if (requestActive.current) return;
    if (!API_IS_CONFIGURED) {
      setItems(DEMO_EQUIPMENT_RECORDS);
      setTotal(DEMO_EQUIPMENT_RECORDS.length);
      setLoading(false);
      setError('');
      hasLoaded.current = true;
      return;
    }

    requestActive.current = true;
    if (pullToRefresh) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);
    setError('');
    try {
      const page = await equipmentApi.list({ page_size: 100 });
      setItems(page.items as EquipmentResponse[]);
      setTotal(page.total);
      hasLoaded.current = true;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Equipment could not be loaded. Please try again.');
    } finally {
      requestActive.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadEquipment();
  }, [loadEquipment]));

  const renderItem = ({ item }: { item: EquipmentViewRecord }) => {
    const health = item.demoHealthScore;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id, name: item.name })}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.equipmentId}>{item.id}</Text>
              <Badge severity={severityFor(item.criticality)} label={statusLabel(item.status)} />
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
              <Text style={styles.detailLabel}>{health === undefined ? 'Criticality' : 'Demo health'}</Text>
              <Text style={[styles.detailValue, health !== undefined && { color: getHealthColor(health) }]}>
                {health === undefined ? statusLabel(item.criticality) : `${health}%`}
              </Text>
            </View>
          </View>

          {health !== undefined ? (
            <View style={styles.healthBarBackground}>
              <View style={[styles.healthBarFill, { width: `${health}%`, backgroundColor: getHealthColor(health) }]} />
            </View>
          ) : null}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipment</Text>
        <Text style={styles.subtitle}>
          {API_IS_CONFIGURED ? `Shared inventory · ${total} assets` : `${total} local sample assets · scores are illustrative`}
        </Text>
        <DataModeNotice />
      </View>

      {loading ? <LoadingSpinner message="Loading equipment…" /> : error && items.length === 0 ? (
        <RetryState title="Equipment unavailable" message={error} onRetry={() => void loadEquipment()} />
      ) : (
        <>
          {error ? <RetryState compact title="Sync paused" message={error} onRetry={() => void loadEquipment(true)} /> : null}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void loadEquipment(true)} tintColor={colors.primary} />
            }
            ListEmptyComponent={<EmptyState icon="⚙️" title="No equipment found" message="The API returned an empty equipment inventory." />}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.huge },
  emptyList: { flexGrow: 1 },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { marginBottom: spacing.md },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  equipmentId: { ...typography.caption, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
  equipmentName: { ...typography.body, color: colors.text, fontWeight: '600' },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  detailItem: { flexShrink: 1, marginRight: spacing.sm },
  detailLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  detailValue: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  healthBarBackground: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: 2 },
});
