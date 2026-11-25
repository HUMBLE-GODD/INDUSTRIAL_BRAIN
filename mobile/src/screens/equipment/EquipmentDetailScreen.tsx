import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { ObservationModal } from '../../components/ui/ObservationModal';
import { ApiClient } from '../../api/client';
import {
  EquipmentDetail,
  MaintenanceRecord,
  ObservationResponse,
} from '../../api/types';

type RouteParams = {
  EquipmentDetail: { equipmentId: string; name?: string };
};

export default function EquipmentDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetail'>>();
  const navigation = useNavigation<any>();
  const equipmentId = route.params?.equipmentId || 'EQ-001';

  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observationModalVisible, setObservationModalVisible] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);
      const [detailData, obsData] = await Promise.all([
        ApiClient.getEquipmentDetail(equipmentId),
        ApiClient.getObservations(equipmentId),
      ]);
      setEquipment(detailData);
      setObservations(obsData);
    } catch (err: any) {
      setError(err.message || `Unable to load details for ${equipmentId}.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleAskAI = () => {
    if (!equipment) return;
    navigation.navigate('QueryTab', {
      screen: 'Query',
      params: {
        initialQuestion: `What are the failure risks and component issues for ${equipment.id} (${equipment.name})?`,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message={`Loading telemetry & history for ${equipmentId}...`} />
      </SafeAreaView>
    );
  }

  if (error || !equipment) {
    return (
      <SafeAreaView style={styles.container}>
        <OfflineBanner onRetry={fetchDetail} />
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Asset Not Available</Text>
          <Text style={styles.errorSubtitle}>
            {error || `Equipment "${equipmentId}" could not be retrieved from the contract.`}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDetail}>
            <Text style={styles.retryButtonText}>Retry Lookup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const health = equipment.health_score ?? 50;
  const healthColor =
    health < 40 ? colors.danger : health < 70 ? colors.warning : colors.success;

  const latestMetric = equipment.metrics && equipment.metrics.length > 0 ? equipment.metrics[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <OfflineBanner onRetry={fetchDetail} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Asset Title Bar */}
        <View style={styles.assetHeader}>
          <View style={styles.idRow}>
            <Text style={styles.equipmentId}>{equipment.id}</Text>
            <Badge severity={equipment.criticality} />
          </View>
          <Text style={styles.equipmentName}>{equipment.name}</Text>
          <Text style={styles.equipmentMeta}>
            {equipment.type} • {equipment.location}
          </Text>
        </View>

        {/* Primary Action Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.observeButton}
            onPress={() => setObservationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.observeButtonText}>+ Submit Observation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.askAiButton}
            onPress={handleAskAI}
            activeOpacity={0.8}
          >
            <Text style={styles.askAiButtonText}>🤖 Ask AI</Text>
          </TouchableOpacity>
        </View>

        {/* Health & RUL Card */}
        <Card style={styles.healthCard}>
          <Text style={styles.cardHeaderSmall}>CONDITION & REMAINING USEFUL LIFE</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthMetricBlock}>
              <Text style={[styles.healthValue, { color: healthColor }]}>{health}%</Text>
              <Text style={styles.healthLabel}>HEALTH SCORE</Text>
            </View>

            <View style={styles.rulMetricBlock}>
              <Text style={styles.rulValue}>{equipment.rul_cycles ?? 'N/A'}</Text>
              <Text style={styles.rulLabel}>ESTIMATED RUL (CYCLES)</Text>
            </View>
          </View>

          <View style={styles.healthBarBg}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${health}%`, backgroundColor: healthColor },
              ]}
            />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Operating Status:</Text>
            <Text style={[styles.statusValue, { color: healthColor }]}>
              {equipment.status.toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Latest Sensor Telemetry */}
        {latestMetric && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Sensor Telemetry</Text>
            <Card style={styles.telemetryCard}>
              <View style={styles.telemetryTimestampRow}>
                <Text style={styles.telemetryTimestamp}>
                  Timestamp: {new Date(latestMetric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {latestMetric.anomaly_score !== undefined && (
                  <View
                    style={[
                      styles.anomalyBadge,
                      latestMetric.anomaly_score > 0.6 && styles.anomalyBadgeHigh,
                    ]}
                  >
                    <Text
                      style={[
                        styles.anomalyText,
                        latestMetric.anomaly_score > 0.6 && styles.anomalyTextHigh,
                      ]}
                    >
                      ANOMALY SCORE: {(latestMetric.anomaly_score * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.sensorGrid}>
                {Object.entries(latestMetric.sensor_data).map(([key, val]) => (
                  <View key={key} style={styles.sensorItem}>
                    <Text style={styles.sensorKey}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.sensorVal}>{String(val)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Linked Supplier / Failure Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Supplier & Failure Risks</Text>
          {equipment.linked_risks && equipment.linked_risks.length > 0 ? (
            equipment.linked_risks.map((risk, idx) => (
              <Card key={idx} style={styles.riskCard}>
                <View style={styles.riskHeader}>
                  <View style={styles.riskTitleBlock}>
                    <Text style={styles.riskSupplier}>
                      SUPPLIER: {risk.supplier.toUpperCase()}
                      {risk.rating !== undefined && ` (Rating: ${risk.rating}/5.0)`}
                    </Text>
                    <Text style={styles.riskFailureMode}>{risk.failure_mode}</Text>
                  </View>
                  <Badge severity={risk.severity} />
                </View>

                <Text style={styles.riskDetails}>{risk.details}</Text>

                {risk.relationship_path && (
                  <View style={styles.pathBox}>
                    <Text style={styles.pathLabel}>GRAPH EVIDENCE TRAVERSAL:</Text>
                    <Text style={styles.pathCode}>{risk.relationship_path}</Text>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                No high-risk supplier dependencies identified in the knowledge graph.
              </Text>
            </Card>
          )}
        </View>

        {/* Components Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Components</Text>
          <View style={styles.componentsGrid}>
            {equipment.components?.map((comp, idx) => {
              const isWarning = comp.status === 'wear_detected' || comp.status === 'critical';
              return (
                <View
                  key={idx}
                  style={[
                    styles.componentChip,
                    isWarning && styles.componentChipWarning,
                  ]}
                >
                  <Text style={styles.componentName}>{comp.name}</Text>
                  <Text style={styles.componentSupplier}>{comp.supplier}</Text>
                  <Text
                    style={[
                      styles.componentStatus,
                      isWarning && { color: colors.warning },
                    ]}
                  >
                    {comp.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Compliance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance & Regulatory Status</Text>
          <Card style={styles.complianceCard}>
            <View style={styles.complianceHeaderRow}>
              <Text style={styles.complianceScoreLabel}>COMPLIANCE HEALTH</Text>
              <Text style={styles.complianceScoreVal}>
                {equipment.compliance_summary?.score ?? 90}%
              </Text>
            </View>

            {equipment.compliance_summary?.regulations?.map((reg, idx) => (
              <View key={idx} style={styles.regRow}>
                <View style={styles.regInfo}>
                  <Text style={styles.regName}>{reg.regulation_name}</Text>
                  {reg.last_audit_date && (
                    <Text style={styles.regAudit}>
                      Last Audited: {reg.last_audit_date}
                    </Text>
                  )}
                  {reg.gaps && <Text style={styles.regGaps}>Notice: {reg.gaps}</Text>}
                </View>
                <Badge
                  severity={
                    reg.status === 'compliant'
                      ? 'low'
                      : reg.status === 'pending_audit'
                      ? 'medium'
                      : 'critical'
                  }
                />
              </View>
            ))}
          </Card>
        </View>

        {/* Field Observations */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Field Observations</Text>
            <TouchableOpacity
              onPress={() => setObservationModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addObsLink}>+ New</Text>
            </TouchableOpacity>
          </View>

          {observations.length > 0 ? (
            observations.map((obs) => (
              <Card key={obs.id} style={styles.obsCard}>
                <View style={styles.obsHeader}>
                  <View style={styles.obsIdBlock}>
                    <Text style={styles.obsId}>{obs.id}</Text>
                    <Text style={styles.obsDate}>
                      {new Date(obs.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.obsBadges}>
                    <Badge severity={obs.severity} />
                    <View style={styles.obsStatusPill}>
                      <Text style={styles.obsStatusText}>{obs.status}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.obsCategory}>CATEGORY: {obs.category.toUpperCase()}</Text>
                <Text style={styles.obsNote}>{obs.note}</Text>
                {obs.technician_name && (
                  <Text style={styles.obsTech}>Logged by: {obs.technician_name}</Text>
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                No observations recorded yet for this equipment. Tap "+ Submit Observation" to file one.
              </Text>
            </Card>
          )}
        </View>

        {/* Maintenance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance History</Text>
          {equipment.maintenance_history?.map((record: MaintenanceRecord) => (
            <Card key={record.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyType}>{record.type.toUpperCase()}</Text>
                  <Text style={styles.historyDate}>{record.date}</Text>
                </View>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{record.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.historyDescription}>{record.description}</Text>
              {record.parts_used && (
                <Text style={styles.historyParts}>Parts: {record.parts_used}</Text>
              )}
              {record.downtime_hours !== undefined && (
                <Text style={styles.historyDowntime}>
                  Downtime: {record.downtime_hours} hrs
                </Text>
              )}
            </Card>
          ))}
        </View>

        {/* General Asset Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Specification</Text>
          <Card style={styles.specCard}>
            {[
              ['Manufacturer', equipment.manufacturer || 'N/A'],
              ['Model Number', equipment.model || 'N/A'],
              ['Installation Date', equipment.install_date || 'N/A'],
              ['Plant Facility', equipment.location],
              ['Criticality Tier', equipment.criticality.toUpperCase()],
            ].map(([label, val], i) => (
              <View key={i} style={styles.specRow}>
                <Text style={styles.specLabel}>{label}</Text>
                <Text style={styles.specVal}>{val}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Observation Modal */}
      <ObservationModal
        visible={observationModalVisible}
        onClose={() => setObservationModalVisible(false)}
        equipmentId={equipment.id}
        onObservationCreated={(newObs) => {
          setObservations((prev) => [newObs, ...prev]);
        }}
      />
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
  assetHeader: {
    marginBottom: spacing.lg,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  equipmentId: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  equipmentName: {
    ...typography.h1,
    color: colors.text,
    marginTop: 2,
  },
  equipmentMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  observeButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  observeButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '700',
  },
  askAiButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiButtonText: {
    ...typography.button,
    color: colors.text,
    fontWeight: '600',
  },
  healthCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  cardHeaderSmall: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  healthMetricBlock: {},
  healthValue: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  healthLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rulMetricBlock: {
    alignItems: 'flex-end',
  },
  rulValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  rulLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  healthBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusValue: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  addObsLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  telemetryCard: {
    padding: spacing.lg,
  },
  telemetryTimestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  telemetryTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  anomalyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  anomalyBadgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  anomalyText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  anomalyTextHigh: {
    color: colors.danger,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sensorItem: {
    width: '46%',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sensorKey: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  sensorVal: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  riskCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  riskTitleBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  riskSupplier: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  riskFailureMode: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  riskDetails: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  pathBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pathLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 2,
  },
  pathCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: colors.textSecondary,
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  componentChip: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  componentChipWarning: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  componentName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  componentSupplier: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  componentStatus: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginTop: 4,
  },
  complianceCard: {
    padding: spacing.lg,
  },
  complianceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  complianceScoreLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  complianceScoreVal: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
  },
  regRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  regInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  regName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  regAudit: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  regGaps: {
    ...typography.caption,
    color: colors.warning,
    marginTop: 2,
  },
  obsCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  obsIdBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  obsId: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  obsDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  obsBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  obsStatusPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  obsStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  obsCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  obsNote: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 18,
    marginVertical: 4,
  },
  obsTech: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  historyCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  historyType: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  historyDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  completedBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 10,
  },
  historyDescription: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 18,
  },
  historyParts: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  historyDowntime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  specCard: {
    padding: spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  specVal: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyCardText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
