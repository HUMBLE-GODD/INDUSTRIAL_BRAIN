import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface ManualLookupInputProps {
  onLookup: (equipmentId: string) => void;
  initialValue?: string;
  placeholder?: string;
}

const COMMON_ASSETS = ['EQ-001', 'EQ-002', 'EQ-003', 'EQ-004', 'EQ-005'];

export const ManualLookupInput: React.FC<ManualLookupInputProps> = ({
  onLookup,
  initialValue = '',
  placeholder = 'Enter Asset ID (e.g. EQ-001)',
}) => {
  const [equipmentId, setEquipmentId] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (targetId?: string) => {
    const idToUse = (targetId || equipmentId).trim().toUpperCase();
    if (!idToUse) {
      setError('Please enter a valid Equipment ID.');
      return;
    }
    setError(null);
    onLookup(idToUse);
  };

  const handleChipPress = (chipId: string) => {
    setEquipmentId(chipId);
    setError(null);
    handleSubmit(chipId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Manual Equipment ID Lookup</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, !!error && styles.inputError]}
          value={equipmentId}
          onChangeText={(val) => {
            setEquipmentId(val);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => handleSubmit()}
        />
        <TouchableOpacity
          style={styles.lookupButton}
          onPress={() => handleSubmit()}
          activeOpacity={0.8}
        >
          <Text style={styles.lookupButtonText}>Lookup</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Suggested Asset Chips */}
      <View style={styles.chipsSection}>
        <Text style={styles.chipsLabel}>Quick Select:</Text>
        <View style={styles.chipsRow}>
          {COMMON_ASSETS.map((asset) => (
            <TouchableOpacity
              key={asset}
              style={[
                styles.chip,
                equipmentId.toUpperCase() === asset && styles.chipActive,
              ]}
              onPress={() => handleChipPress(asset)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  equipmentId.toUpperCase() === asset && styles.chipTextActive,
                ]}
              >
                {asset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  lookupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  lookupButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  chipsSection: {
    marginTop: spacing.sm,
  },
  chipsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  chipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
