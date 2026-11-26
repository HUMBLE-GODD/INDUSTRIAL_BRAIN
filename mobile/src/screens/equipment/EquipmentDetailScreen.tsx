import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RetryState } from '../../components/ui/RetryState';
import { API_IS_CONFIGURED, ApiError, complianceApi, equipmentApi, graphApi } from '../../lib/api/client';
import type {
  ComplianceGap,
  EquipmentRiskPath,
  ComplianceGapResponse,
  EquipmentHistoryEvent,
  EquipmentHistoryPage,
  EquipmentRcaResponse,
  EquipmentResponse,
  ObservationResponse,
  ObservationSeverity,
} from '../../lib/api/types';
import { DEMO_EQUIPMENT_RECORDS, type EquipmentViewRecord } from '../../data/equipment';

type RouteParams = {
  EquipmentDetail: { equipmentId: string; name: string };
};

const SEVERITIES: ObservationSeverity[] = ['low', 'medium', 'high', 'critical'];

function severityFor(value: string): ObservationSeverity {
  const normalized = value.toLowerCase();
  return SEVERITIES.includes(normalized as ObservationSeverity) ? normalized as ObservationSeverity : 'medium';
}

function labelCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function EquipmentDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetail'>>();
  const { equipmentId, name } = route.params;
  const [equipment, setEquipment] = useState<EquipmentViewRecord | null>(null);
  const [detailError, setDetailError] = useState('');
  const [history, setHistory] = useState<EquipmentHistoryEvent[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [graphContext, setGraphContext] = useState<EquipmentRcaResponse | null>(null);
  const [graphError, setGraphError] = useState('');
  const [graphLoading, setGraphLoading] = useState(API_IS_CONFIGURED);
  const [compliance, setCompliance] = useState<ComplianceGapResponse | null>(null);
  const [complianceError, setComplianceError] = useState('');
  const [complianceLoading, setComplianceLoading] = useState(API_IS_CONFIGURED);
  const [loading, setLoading] = useState(API_IS_CONFIGURED);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('inspection');
  const [severity, setSeverity] = useState<ObservationSeverity>('medium');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [observationError, setObservationError] = useState('');
  const [observationSuccess, setObservationSuccess] = useState<ObservationResponse | null>(null);
  const requestActive = useRef(false);
  const hasEquipment = useRef(false);

  const loadData = useCallback(async (pullToRefresh = false) => {
    if (requestActive.current) return;
    if (!API_IS_CONFIGURED) {
      const fixture = DEMO_EQUIPMENT_RECORDS.find((item) => item.id === equipmentId);
      setEquipment(fixture ?? null);
      hasEquipment.current = Boolean(fixture);
      setDetailError(fixture ? '' : `No local fixture was found for “${equipmentId}”.`);
      setHistory([]);
      setHistoryTotal(0);
      setHistoryPage(1);
      setHistoryPages(1);
      setHistoryError('');
      setGraphContext(null);
      setGraphError('');
      setGraphLoading(false);
      setCompliance(null);
      setComplianceError('');
      setComplianceLoading(false);
      setLoading(false);
      return;
    }

    requestActive.current = true;
    if (pullToRefresh) setRefreshing(true);
    else if (!hasEquipment.current) setLoading(true);
    setGraphLoading(true);
    setComplianceLoading(true);
    setDetailError('');
    setHistoryError('');
    setGraphError('');
    setComplianceError('');
    const [equipmentResult, historyResult, graphResult, complianceResult] = await Promise.allSettled([
      equipmentApi.get(equipmentId),
      equipmentApi.history(equipmentId, { page: 1, page_size: 100 }),
      graphApi.equipmentRca(equipmentId),
      complianceApi.gaps(equipmentId),
    ]);

    if (equipmentResult.status === 'fulfilled') {
      setEquipment(equipmentResult.value as EquipmentResponse);
      hasEquipment.current = true;
    } else {
      const cause = equipmentResult.reason;
      hasEquipment.current = false;
      setDetailError(cause instanceof ApiError ? cause.message : 'Equipment details could not be loaded. Please retry.');
    }

    if (historyResult.status === 'fulfilled') {
      const page = historyResult.value as EquipmentHistoryPage;
      setHistory(page.items);
      setHistoryTotal(page.total);
      setHistoryPage(page.page);
      setHistoryPages(page.pages);
    } else {
      const cause = historyResult.reason;
      setHistoryError(cause instanceof ApiError ? cause.message : 'History could not be loaded. Please retry.');
    }

    if (graphResult.status === 'fulfilled') {
      setGraphContext(graphResult.value);
    } else {
      const cause = graphResult.reason;
      setGraphContext(null);
      if (!(cause instanceof ApiError && cause.status === 404)) {
        setGraphError(cause instanceof ApiError ? cause.message : 'Knowledge graph context could not be loaded. Please retry.');
      }
    }
    if (complianceResult.status === 'fulfilled') {
      setCompliance(complianceResult.value);
    } else {
      const cause = complianceResult.reason;
      setCompliance(null);
      setComplianceError(cause instanceof ApiError ? cause.message : 'Compliance context could not be loaded. Please retry.');
    }

    requestActive.current = false;
    setLoading(false);
    setRefreshing(false);
    setGraphLoading(false);
    setComplianceLoading(false);
  }, [equipmentId]);

  useFocusEffect(useCallback(() => {
    void loadData();
  }, [loadData]));

  const loadMoreHistory = async () => {
    if (!API_IS_CONFIGURED || loadingMore || historyPage >= historyPages) return;
    setLoadingMore(true);
    setHistoryError('');
    try {
      const page = await equipmentApi.history(equipmentId, { page: historyPage + 1, page_size: 100 });
      setHistory((current) => [...current, ...page.items]);
      setHistoryPage(page.page);
      setHistoryPages(page.pages);
      setHistoryTotal(page.total);
    } catch (cause) {
      setHistoryError(cause instanceof ApiError ? cause.message : 'More history could not be loaded. Please retry.');
    } finally {
      setLoadingMore(false);
    }
  };

  const submitObservation = async () => {
    if (!API_IS_CONFIGURED || !equipment) return;
    if (!category.trim() || !note.trim()) {
      setObservationError('Enter a category and observation note.');
      return;
    }
    setSubmitting(true);
    setObservationError('');
    setObservationSuccess(null);
    try {
      const createdObservation = await equipmentApi.submitObservation({
        equipment_id: equipmentId,
        category: category.trim(),
        severity,
        note: note.trim(),
      });
      setObservationSuccess(createdObservation);
      setNote('');
      try {
        const page = await equipmentApi.history(equipmentId, { page: 1, page_size: 100 });
        setHistory(page.items);
        setHistoryTotal(page.total);
        setHistoryPage(page.page);
        setHistoryPages(page.pages);
        setHistoryError('');
      } catch (cause) {
        setHistoryError(cause instanceof ApiError ? cause.message : 'The observation was submitted, but history could not be refreshed.');
      }
    } catch (cause) {
      setObservationError(cause instanceof ApiError ? cause.message : 'The observation could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !equipment) return <LoadingSpinner message="Loading equipment and history…" />;
  if (!equipment) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <DataModeNotice />
          <RetryState title="Equipment unavailable" message={detailError || 'The equipment record could not be loaded.'} onRetry={() => void loadData()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const equipmentInfo: [string, string][] = [
    ['Equipment ID', equipment.id],
    ['Asset Tag', equipment.tag ?? name],
    ['Type', equipment.type],
    ['Location', equipment.location],
    ['Manufacturer', equipment.manufacturer ?? 'Not available'],
    ['Model', equipment.model ?? 'Not available'],
    ['Installed', formatDate(equipment.install_date)],
    ['Status', labelCase(equipment.status)],
    ['Criticality', labelCase(equipment.criticality)],
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadData(true)} tintColor={colors.primary} />
        }
      >
        <DataModeNotice />
        {detailError ? <RetryState compact title="Equipment sync paused" message={detailError} onRetry={() => void loadData(true)} /> : null}

        {equipment.demoHealthScore !== undefined ? (
          <Card style={styles.healthCard}>
            <Text style={styles.healthLabel}>Demo Health Score</Text>
            <Text style={[styles.healthValue, { color: getHealthColor(equipment.demoHealthScore) }]}>
              {equipment.demoHealthScore}%
            </Text>
            <View style={styles.healthBarBg}>
              <View style={[styles.healthBarFill, { width: `${equipment.demoHealthScore}%`, backgroundColor: getHealthColor(equipment.demoHealthScore) }]} />
            </View>
            <Text style={styles.demoNote}>Illustrative fixture value, not an API measurement</Text>
          </Card>
        ) : (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryName}>{equipment.name}</Text>
            <View style={styles.summaryBadges}>
              <Badge severity={severityFor(equipment.criticality)} label={`Criticality · ${labelCase(equipment.criticality)}`} />
              <Badge severity={equipment.status.toLowerCase() === 'operational' ? 'low' : 'high'} label={labelCase(equipment.status)} />
            </View>
            <Text style={styles.demoNote}>Equipment status and criticality from the API</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Equipment Info</Text>
        <Card style={styles.infoCard}>
          {equipmentInfo.map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>{API_IS_CONFIGURED ? 'Knowledge Graph & Supplier Risk' : 'Fixture Graph Links'}</Text>
        {!API_IS_CONFIGURED ? (
          <>
            {equipment.components?.length ? (
              <View style={styles.tagsRow}>
                {equipment.components.map((component) => (
                  <View key={component} style={styles.tag}><Text style={styles.tagText}>{component}</Text></View>
                ))}
              </View>
            ) : <Text style={styles.noData}>No seeded component links available.</Text>}
            {equipment.failureModes?.map((failureMode) => (
              <Card key={failureMode.name} style={styles.failureCard}>
                <View style={styles.failureHeader}>
                  <Text style={styles.failureMode}>{failureMode.name}</Text>
                  <Badge severity={failureMode.severity} />
                </View>
                <Text style={styles.failureDetail}>Illustrative fixture relationship. Supplier evidence requires the live graph API.</Text>
              </Card>
            ))}
          </>
        ) : graphLoading && !graphContext ? (
          <ActivityIndicator color={colors.primary} style={styles.sectionLoading} />
        ) : graphError ? (
          <RetryState compact title="Graph context unavailable" message={graphError} onRetry={() => void loadData(true)} />
        ) : graphContext ? (
          <>
            <Text style={styles.contextNote}>{graphContext.evidence_note}</Text>
            {graphContext.component_risk_paths.length ? graphContext.component_risk_paths.map((path, index) => (
              <GraphRiskCard key={path.component_id ?? `${path.component_name}-${index}`} path={path} />
            )) : (
              <EmptyState icon="🔗" title="No linked graph risks" message="This equipment has no component, supplier, or failure-mode paths in the knowledge graph." />
            )}
          </>
        ) : (
          <EmptyState icon="🔗" title="No graph record" message="The equipment is not linked in the knowledge graph yet." />
        )}

        <Text style={styles.sectionTitle}>Compliance Context</Text>
        {!API_IS_CONFIGURED ? (
          <Card style={styles.formCard}>
            <Text style={styles.formHelp}>Compliance assessments come from the live rule-based API and are unavailable in fixture mode.</Text>
          </Card>
        ) : complianceLoading && !compliance ? (
          <ActivityIndicator color={colors.primary} style={styles.sectionLoading} />
        ) : complianceError ? (
          <RetryState compact title="Compliance context unavailable" message={complianceError} onRetry={() => void loadData(true)} />
        ) : compliance ? (
          <>
            <Card style={styles.complianceSummary}>
              <Text style={styles.complianceMethod}>Method: {labelCase(compliance.method)}</Text>
              <View style={styles.complianceCounts}>
                <ComplianceCount label="Checked" value={compliance.summary.total_checked} />
                <ComplianceCount label="Compliant" value={compliance.summary.compliant_count} />
                <ComplianceCount label="Non-compliant" value={compliance.summary.non_compliant_count} />
                <ComplianceCount label="Pending audit" value={compliance.summary.pending_audit_count} />
              </View>
              <Text style={styles.complianceGenerated}>Evaluated {formatDateTime(compliance.generated_at)}</Text>
              {compliance.note ? <Text style={styles.contextNote}>{compliance.note}</Text> : null}
              {compliance.summary.total_checked > 0 && compliance.gaps.length === 0 ? (
                <Text style={styles.compliantMessage}>No open compliance gaps or pending audits are reported for this equipment.</Text>
              ) : null}
            </Card>
            {compliance.gaps.map((gap) => <ComplianceGapCard key={`${gap.regulation}-${gap.status}`} gap={gap} />)}
          </>
        ) : (
          <EmptyState icon="✓" title="No compliance records" message="The API did not return a compliance summary for this equipment." />
        )}

        <View style={styles.historyHeading}>
          <Text style={styles.sectionTitle}>Equipment History</Text>
          {API_IS_CONFIGURED ? <Text style={styles.historyCount}>{history.length} of {historyTotal}</Text> : null}
        </View>
        {historyError ? (
          <RetryState compact title="History unavailable" message={historyError} onRetry={() => void loadData(true)} />
        ) : !API_IS_CONFIGURED ? (
          <EmptyState icon="🕘" title="No fixture history" message="History is available in live API mode." />
        ) : history.length ? history.map((event) => (
          <HistoryCard key={`${event.event_type}-${event.id}`} event={event} />
        )) : (
          <EmptyState icon="🕘" title="No history yet" message="Maintenance, telemetry, and field observations will appear here." />
        )}
        {API_IS_CONFIGURED && historyPage < historyPages ? (
          <TouchableOpacity accessibilityRole="button" disabled={loadingMore} onPress={loadMoreHistory} style={styles.loadMoreButton}>
            {loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.loadMoreText}>Load more history</Text>}
          </TouchableOpacity>
        ) : null}

        {API_IS_CONFIGURED ? (
          <>
            <Text style={styles.sectionTitle}>Field Observation</Text>
            <Card style={styles.formCard}>
              <Text style={styles.formHelp}>This records a field observation only; it does not create a work order.</Text>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                accessibilityLabel="Observation category"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={80}
                placeholder="inspection"
                placeholderTextColor={colors.textMuted}
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Severity</Text>
              <View style={styles.severityRow}>
                {SEVERITIES.map((option) => {
                  const selected = severity === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSeverity(option)}
                      style={[styles.severityChoice, selected && styles.severitySelected]}
                    >
                      <Text style={[styles.severityText, selected && styles.severityTextSelected]}>{labelCase(option)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.inputLabel}>Observation</Text>
              <TextInput
                accessibilityLabel="Observation note"
                multiline
                maxLength={5000}
                placeholder="Describe what you observed…"
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
                style={[styles.input, styles.noteInput]}
              />
              {observationError ? <Text accessibilityRole="alert" style={styles.formError}>{observationError}</Text> : null}
              {observationSuccess ? (
                <View accessibilityLiveRegion="polite" style={styles.formSuccessBox}>
                  <Text style={styles.formSuccess}>Observation recorded successfully</Text>
                  <Text style={styles.successDetail}>API ID: {observationSuccess.id}</Text>
                  <Text style={styles.successDetail}>Status: {labelCase(observationSuccess.status)}</Text>
                  <Text style={styles.successDetail}>No work order was created.</Text>
                </View>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                disabled={submitting}
                onPress={submitObservation}
                style={[styles.submitButton, submitting && styles.disabled]}
              >
                {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.submitText}>Submit observation</Text>}
              </TouchableOpacity>
            </Card>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Field Observation</Text>
            <Card style={styles.formCard}>
              <Text style={styles.formHelp}>Observation submission is available in live API mode. Configure EXPO_PUBLIC_API_URL and sign in to sync a field note.</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getHealthColor(health: number): string {
  if (health < 40) return colors.danger;
  if (health < 60) return colors.warning;
  if (health < 80) return colors.info;
  return colors.success;
}

function HistoryCard({ event }: { event: EquipmentHistoryEvent }) {
  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyTop}>
        <Text style={styles.historyType}>{labelCase(event.event_type)}</Text>
        {event.severity ? <Badge severity={severityFor(event.severity)} /> : null}
      </View>
      <Text style={styles.historyTitle}>{event.title}</Text>
      <Text style={styles.historyDescription}>{event.description}</Text>
      <View style={styles.historyFooter}>
        <Text style={styles.historyDate}>{formatDateTime(event.occurred_at)}</Text>
        {event.status ? <Text style={styles.historyStatus}>{labelCase(event.status)}</Text> : null}
      </View>
    </Card>
  );
}

function GraphRiskCard({ path }: { path: EquipmentRiskPath }) {
  const supplier = path.supplier;
  return (
    <Card style={styles.riskPathCard}>
      <Text style={styles.graphComponent}>{path.component_name || 'Component'}</Text>
      {path.component_type ? <Text style={styles.graphMeta}>{labelCase(path.component_type)}</Text> : null}
      {supplier?.name ? (
        <Text style={styles.graphSupplier}>
          Supplier: {supplier.name}
          {supplier.rating != null ? ` · Rating ${supplier.rating}/5` : ''}
          {supplier.country ? ` · ${supplier.country}` : ''}
        </Text>
      ) : <Text style={styles.graphMeta}>No supplier linked</Text>}
      {path.risk_links.length ? path.risk_links.map((failure, index) => (
        <View key={failure.failure_mode_id ?? `${failure.name}-${index}`} style={styles.riskLink}>
          <View style={styles.failureHeader}>
            <Text style={styles.failureMode}>{failure.name || 'Failure mode'}</Text>
            {failure.severity ? <Badge severity={severityFor(failure.severity)} /> : null}
          </View>
          {failure.description ? <Text style={styles.failureDetail}>{failure.description}</Text> : null}
        </View>
      )) : <Text style={styles.graphMeta}>No failure modes linked to this component</Text>}
    </Card>
  );
}

function ComplianceCount({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.complianceCount}>
      <Text style={styles.complianceValue}>{value}</Text>
      <Text style={styles.complianceLabel}>{label}</Text>
    </View>
  );
}

function ComplianceGapCard({ gap }: { gap: ComplianceGap }) {
  return (
    <Card style={styles.complianceGapCard}>
      <View style={styles.complianceGapHeader}>
        <View style={styles.complianceGapTitle}>
          <Text style={styles.complianceRegulation}>{gap.regulation}</Text>
          <Text style={styles.graphMeta}>{labelCase(gap.status)}</Text>
        </View>
        <Badge severity={severityFor(gap.risk_level)} label={`${labelCase(gap.risk_level)} risk`} />
      </View>
      <Text style={styles.complianceGapText}>{gap.gap_description || 'No gap description supplied.'}</Text>
      {gap.due_date ? <Text style={styles.graphMeta}>Due: {formatDate(gap.due_date)}{gap.days_overdue ? ` · ${gap.days_overdue} days overdue` : ''}</Text> : null}
      <Text style={styles.complianceAction}>Recommended action: {gap.recommended_action}</Text>
      <Text style={styles.graphMeta}>{gap.rule_applied}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge },
  healthCard: { padding: spacing.xl, alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
  summaryCard: { padding: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.xxl },
  summaryName: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  summaryBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  healthLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  healthValue: { fontSize: 56, fontWeight: '700', marginBottom: spacing.md },
  healthBarBg: { height: 6, width: '100%', backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.md },
  healthBarFill: { height: '100%', borderRadius: 3 },
  demoNote: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  infoCard: { padding: spacing.lg, marginBottom: spacing.xxl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.bodySmall, color: colors.text, fontWeight: '500', flex: 1.2, textAlign: 'right' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  tagText: { ...typography.caption, color: colors.primary, fontWeight: '500' },
  failureCard: { padding: spacing.lg, marginBottom: spacing.sm },
  failureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  failureMode: { ...typography.body, color: colors.text, fontWeight: '600' },
  failureDetail: { ...typography.caption, color: colors.textMuted },
  noData: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.xxl },
  sectionLoading: { marginVertical: spacing.xl },
  contextNote: { ...typography.caption, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.md },
  graphMeta: { ...typography.caption, color: colors.textMuted, marginTop: 3 },
  graphComponent: { ...typography.body, color: colors.text, fontWeight: '700' },
  graphSupplier: { ...typography.bodySmall, color: colors.primary, fontWeight: '600', marginTop: spacing.sm },
  riskPathCard: { padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.warning },
  riskLink: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  complianceSummary: { padding: spacing.lg, marginBottom: spacing.md },
  complianceMethod: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  complianceCounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  complianceCount: { minWidth: '46%', flexGrow: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md },
  complianceValue: { ...typography.h3, color: colors.primary },
  complianceLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  complianceGenerated: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  compliantMessage: { ...typography.bodySmall, color: colors.success, marginTop: spacing.md },
  complianceGapCard: { padding: spacing.lg, marginBottom: spacing.md },
  complianceGapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  complianceGapTitle: { flex: 1 },
  complianceRegulation: { ...typography.body, color: colors.text, fontWeight: '600' },
  complianceGapText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  complianceAction: { ...typography.bodySmall, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  historyHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyCount: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  historyCard: { padding: spacing.lg, marginBottom: spacing.sm },
  historyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  historyType: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  historyTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
  historyDescription: { ...typography.bodySmall, color: colors.textSecondary },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  historyDate: { ...typography.caption, color: colors.textMuted },
  historyStatus: { ...typography.caption, color: colors.textMuted },
  loadMoreButton: { alignItems: 'center', padding: spacing.lg },
  loadMoreText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  formCard: { padding: spacing.lg, marginBottom: spacing.xxl },
  formHelp: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  input: { minHeight: 46, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.md, ...typography.bodySmall, color: colors.text, marginBottom: spacing.md },
  noteInput: { minHeight: 108, paddingTop: spacing.md },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  severityChoice: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  severitySelected: { borderColor: colors.primary, backgroundColor: '#00E5FF18' },
  severityText: { ...typography.caption, color: colors.textSecondary },
  severityTextSelected: { color: colors.primary, fontWeight: '700' },
  formError: { ...typography.bodySmall, color: colors.danger, marginBottom: spacing.md },
  formSuccessBox: { backgroundColor: '#00E67612', borderColor: '#00E67655', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  formSuccess: { ...typography.bodySmall, color: colors.success, fontWeight: '700' },
  successDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  submitButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary, marginTop: spacing.xs },
  submitText: { ...typography.button, color: colors.background },
  disabled: { opacity: 0.6 },
});
