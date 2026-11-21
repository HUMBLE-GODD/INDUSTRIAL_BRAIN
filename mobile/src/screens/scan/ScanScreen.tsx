import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { DEMO_EQUIPMENT } from '../../data/equipment';

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const [equipmentId, setEquipmentId] = useState('');
  const [lookupError, setLookupError] = useState('');

  const lookupEquipment = () => {
    const normalizedId = equipmentId.trim().toUpperCase();
    const equipment = DEMO_EQUIPMENT.find((item) => item.id === normalizedId);

    if (!equipment) {
      setLookupError(normalizedId ? `No equipment found for “${normalizedId}”.` : 'Enter an equipment ID to continue.');
      return;
    }

    setLookupError('');
    Keyboard.dismiss();
    navigation.navigate('EquipmentDetail', { equipmentId: equipment.id, name: equipment.name });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>QR Scanner</Text>
        <Text style={styles.subtitle}>Local demo lookup · use a canonical equipment ID</Text>

        {/* Camera scanning is not configured in this client yet. */}
        <Card style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Camera scanning unavailable</Text>
          <Text style={styles.cameraHint}>Enter an equipment ID below to open its record.</Text>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </Card>

        <Text style={styles.lookupLabel}>Manual lookup</Text>
        <View style={styles.lookupRow}>
          <TextInput
            accessibilityLabel="Equipment ID"
            style={styles.lookupInput}
            placeholder="e.g. EQ-001"
            placeholderTextColor={colors.textMuted}
            value={equipmentId}
            onChangeText={(value) => {
              setEquipmentId(value);
              if (lookupError) setLookupError('');
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={lookupEquipment}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Look up equipment"
            style={styles.lookupButton}
            activeOpacity={0.75}
            onPress={lookupEquipment}
          >
            <Text style={styles.lookupButtonText}>Look up</Text>
          </TouchableOpacity>
        </View>
        {lookupError ? <Text accessibilityRole="alert" style={styles.lookupError}>{lookupError}</Text> : null}

        <Text style={styles.instructions}>
          Try EQ-001 through EQ-005. Asset labels such as P-101 are shown in equipment details.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  cameraPlaceholder: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    position: 'relative',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  cameraText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  cameraHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  scanFrame: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  lookupLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  lookupRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lookupInput: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  lookupButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  lookupButtonText: {
    ...typography.button,
    color: colors.background,
  },
  lookupError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
  },
});
