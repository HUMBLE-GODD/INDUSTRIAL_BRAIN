import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  CreateObservationRequest,
  ObservationCategory,
  ObservationResponse,
  ObservationSeverity,
} from '../../api/types';
import { ApiClient } from '../../api/client';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from './Card';
import { Badge } from './Badge';

interface ObservationModalProps {
  visible: boolean;
  onClose: () => void;
  equipmentId?: string;
  onObservationCreated?: (observation: ObservationResponse) => void;
}

const CATEGORIES: { label: string; value: ObservationCategory }[] = [
  { label: 'Vibration', value: 'vibration' },
  { label: 'Fluid Leak', value: 'leak' },
  { label: 'Thermal / Heat', value: 'thermal' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Mechanical Wear', value: 'mechanical' },
  { label: 'Noise / Acoustic', value: 'noise' },
  { label: 'Corrosion', value: 'corrosion' },
  { label: 'Other', value: 'other' },
];

const SEVERITIES: { label: string; value: ObservationSeverity }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export const ObservationModal: React.FC<ObservationModalProps> = ({
  visible,
  onClose,
  equipmentId: initialEquipmentId = 'EQ-001',
  onObservationCreated,
}) => {
  const [equipmentId, setEquipmentId] = useState(initialEquipmentId);
  const [category, setCategory] = useState<ObservationCategory>('vibration');
  const [severity, setSeverity] = useState<ObservationSeverity>('high');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ObservationResponse | null>(null);

  // Synchronize equipment ID when opened
  React.useEffect(() => {
    if (visible) {
      setEquipmentId(initialEquipmentId || 'EQ-001');
      setResult(null);
      setError(null);
    }
  }, [visible, initialEquipmentId]);

  const handleSubmit = async () => {
    const trimmedId = equipmentId.trim().toUpperCase();
    if (!trimmedId) {
      setError('Equipment ID is required.');
      return;
    }
    if (note.trim().length < 5) {
      setError('Please provide a detailed observation note (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateObservationRequest = {
      equipment_id: trimmedId,
      category,
      severity,
      note: note.trim(),
    };

    try {
      const response = await ApiClient.createObservation(payload);
      setResult(response);
      if (onObservationCreated) {
        onObservationCreated(response);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit observation. Please check connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setNote('');
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Submit Field Observation</Text>
              <Text style={styles.subtitle}>
                Records observation only • Does NOT create a work order
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {result ? (
              // Success Response Card
              <Card style={styles.successCard}>
                <View style={styles.successHeader}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successTitle}>Observation Recorded</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>OBSERVATION ID</Text>
                  <Text style={styles.resultValueHighlight}>{result.id}</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>STATUS</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{result.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>EQUIPMENT</Text>
                  <Text style={styles.resultValue}>{result.equipment_id}</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>SEVERITY & CATEGORY</Text>
                  <View style={styles.badgeRow}>
                    <Badge severity={result.severity} />
                    <Text style={styles.categoryLabel}>{result.category.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>TIMESTAMP</Text>
                  <Text style={styles.resultValue}>{new Date(result.created_at).toLocaleString()}</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>LOGGED NOTE</Text>
                  <Text style={styles.noteBox}>{result.note}</Text>
                </View>

                <View style={styles.successActions}>
                  <TouchableOpacity
                    style={styles.anotherButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.anotherButtonText}>Submit Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              // Observation Form
              <View>
                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                )}

                {/* Equipment ID */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Equipment ID</Text>
                  <TextInput
                    style={styles.input}
                    value={equipmentId}
                    onChangeText={setEquipmentId}
                    placeholder="EQ-001"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Category Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Observation Category</Text>
                  <View style={styles.pillsRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[
                          styles.pill,
                          category === cat.value && styles.pillActive,
                        ]}
                        onPress={() => setCategory(cat.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            category === cat.value && styles.pillTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Severity Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Severity Level</Text>
                  <View style={styles.severityRow}>
                    {SEVERITIES.map((sev) => {
                      const isSelected = severity === sev.value;
                      let activeColor = colors.info;
                      if (sev.value === 'critical') activeColor = colors.danger;
                      if (sev.value === 'high') activeColor = '#f97316';
                      if (sev.value === 'medium') activeColor = colors.warning;
                      if (sev.value === 'low') activeColor = colors.success;

                      return (
                        <TouchableOpacity
                          key={sev.value}
                          style={[
                            styles.severityPill,
                            isSelected && {
                              borderColor: activeColor,
                              backgroundColor: `${activeColor}20`,
                            },
                          ]}
                          onPress={() => setSeverity(sev.value)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.severityText,
                              isSelected && { color: activeColor, fontWeight: '700' },
                            ]}
                          >
                            {sev.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Note Text Input */}
                <View style={styles.fieldGroup}>
                  <View style={styles.noteLabelRow}>
                    <Text style={styles.fieldLabel}>Field Observation Note</Text>
                    <Text style={styles.charCount}>
                      {note.length} / 500 chars (min 5)
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Describe specific symptoms, sound, thermal reading, leakage location, or abnormal physical signs observed on site..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.contractNotice}>
                  <Text style={styles.contractNoticeText}>
                    ℹ️ Tatvik’s Contract: Submitting creates a verified FieldObservation record linked to {equipmentId || 'the asset'}. It notifies engineering and appears in asset history.
                  </Text>
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Field Observation</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    padding: spacing.xl,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  noteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  severityPill: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  severityText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  contractNotice: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contractNoticeText: {
    ...typography.caption,
    color: colors.primary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  successCard: {
    padding: spacing.xl,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    fontSize: 42,
    color: colors.success,
    fontWeight: '700',
  },
  successTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  resultItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  resultValueHighlight: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  resultValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  noteBox: {
    ...typography.bodySmall,
    color: colors.text,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  successActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  anotherButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  anotherButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: '700',
  },
});
