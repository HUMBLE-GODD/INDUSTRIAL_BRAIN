import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../../components/ui/Card';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { API_IS_CONFIGURED, ApiError, equipmentApi } from '../../lib/api/client';
import { DEMO_EQUIPMENT_RECORDS } from '../../data/equipment';

function normalizeEquipmentId(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  const canonical = raw.match(/\bEQ-\d+\b/i)?.[0];
  if (canonical) return canonical.toUpperCase();
  try {
    const candidate = new URL(raw).pathname.split('/').filter(Boolean).pop();
    if (candidate && /^[a-z0-9_-]{1,128}$/i.test(candidate)) return decodeURIComponent(candidate).toUpperCase();
  } catch {
    // Not a URL; treat this as a manually entered equipment ID.
  }
  return raw.toUpperCase();
}

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [equipmentId, setEquipmentId] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const lookupActive = useRef(false);

  const lookupEquipment = async (rawValue: string) => {
    if (lookupActive.current) return;
    const normalizedId = normalizeEquipmentId(rawValue);
    if (!normalizedId) {
      setLookupError('Enter or scan a canonical equipment ID to continue.');
      return;
    }

    lookupActive.current = true;
    setLookupBusy(true);
    setLookupError('');
    Keyboard.dismiss();
    try {
      if (API_IS_CONFIGURED) {
        const equipment = await equipmentApi.get(normalizedId);
        navigation.navigate('EquipmentDetail', { equipmentId: equipment.id, name: equipment.name });
      } else {
        const fixture = DEMO_EQUIPMENT_RECORDS.find((item) => item.id === normalizedId);
        if (!fixture) throw new ApiError(`No local fixture was found for “${normalizedId}”.`, 404);
        navigation.navigate('EquipmentDetail', { equipmentId: fixture.id, name: fixture.name });
      }
    } catch (cause) {
      setLookupError(cause instanceof ApiError
        ? cause.message
        : `Equipment “${normalizedId}” could not be opened. Check the ID and try again.`);
    } finally {
      lookupActive.current = false;
      setLookupBusy(false);
    }
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (lookupActive.current || lookupBusy) return;
    const scannedId = normalizeEquipmentId(result.data);
    setEquipmentId(scannedId);
    void lookupEquipment(scannedId);
  };

  const cameraAvailable = Platform.OS !== 'web';
  const cameraCanRun = Boolean(permission?.granted && isFocused && !lookupBusy);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>QR Scanner</Text>
        <Text style={styles.subtitle}>
          {API_IS_CONFIGURED ? 'Scan an asset label to open its shared API record.' : 'Scan or enter an ID from the local sample records.'}
        </Text>
        <DataModeNotice />

        <Card style={styles.cameraCard}>
          <View style={styles.cameraViewport}>
            {cameraAvailable ? (
              !permission ? (
                <View style={styles.cameraMessage}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.cameraHint}>Checking camera permission…</Text>
                </View>
              ) : permission.granted ? (
                cameraError ? (
                  <View style={styles.cameraMessage}>
                    <Text style={styles.cameraText}>Camera unavailable</Text>
                    <Text style={styles.cameraHint}>{cameraError} Use manual ID lookup below.</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => setCameraError('')} style={styles.permissionButton}>
                      <Text style={styles.permissionButtonText}>Try camera again</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {isFocused ? (
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        active={cameraCanRun}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={cameraCanRun ? onBarcodeScanned : undefined}
                        onMountError={(event) => setCameraError(event.message || 'Camera could not start.')}
                      />
                    ) : null}
                    <View pointerEvents="none" style={styles.scanFrame}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    {!isFocused || lookupBusy ? (
                      <View style={styles.cameraMessage}>
                        {lookupBusy ? <ActivityIndicator color={colors.primary} /> : null}
                        <Text style={styles.cameraHint}>{lookupBusy ? 'Opening equipment…' : 'Scanner paused'}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.cameraOverlayHint}>Point the camera at the QR label</Text>
                  </>
                )
              ) : (
                <View style={styles.cameraMessage}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cameraText}>Camera permission required</Text>
                  <Text style={styles.cameraHint}>
                    {permission.canAskAgain ? 'Allow camera access to scan asset QR codes.' : 'Camera access is disabled. Open system settings to allow access.'}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => permission.canAskAgain ? void requestPermission() : void Linking.openSettings()}
                    style={styles.permissionButton}
                  >
                    <Text style={styles.permissionButtonText}>{permission.canAskAgain ? 'Allow camera' : 'Open settings'}</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.cameraMessage}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.cameraText}>Camera scanning unavailable on Expo Web</Text>
                <Text style={styles.cameraHint}>Use the mobile iOS or Android app to scan QR codes, or enter the equipment ID below.</Text>
              </View>
            )}
          </View>
        </Card>

        <Text style={styles.lookupLabel}>Manual lookup</Text>
        <View style={styles.lookupRow}>
          <TextInput
            accessibilityLabel="Equipment ID"
            style={styles.lookupInput}
            placeholder="e.g. EQ-101"
            placeholderTextColor={colors.textMuted}
            value={equipmentId}
            onChangeText={(value) => {
              setEquipmentId(value);
              if (lookupError) setLookupError('');
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => void lookupEquipment(equipmentId)}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Look up equipment"
            disabled={lookupBusy}
            style={[styles.lookupButton, lookupBusy && styles.disabled]}
            activeOpacity={0.75}
            onPress={() => void lookupEquipment(equipmentId)}
          >
            {lookupBusy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.lookupButtonText}>Look up</Text>}
          </TouchableOpacity>
        </View>
        {lookupError ? <Text accessibilityRole="alert" style={styles.lookupError}>{lookupError}</Text> : null}
        <Text style={styles.instructions}>
          {API_IS_CONFIGURED
            ? 'Scanned IDs are verified through your signed-in API session before opening the live record.'
            : 'Try EQ-001 through EQ-005. Fixture data is local and will not sync observations.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  cameraCard: { padding: spacing.sm, marginTop: spacing.lg, overflow: 'hidden' },
  cameraViewport: { height: 300, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cameraMessage: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  cameraIcon: { fontSize: 42, marginBottom: spacing.md },
  cameraText: { ...typography.h3, color: colors.textSecondary, textAlign: 'center' },
  cameraHint: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.md },
  scanFrame: { position: 'absolute', width: 210, height: 210 },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraOverlayHint: { position: 'absolute', bottom: spacing.md, color: colors.text, backgroundColor: '#0A0E1ACC', overflow: 'hidden', borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, ...typography.caption },
  permissionButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.md },
  permissionButtonText: { ...typography.button, color: colors.background },
  lookupLabel: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.sm },
  lookupRow: { flexDirection: 'row', gap: spacing.sm },
  lookupInput: { flex: 1, minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.md, ...typography.body, color: colors.text },
  lookupButton: { minHeight: 48, minWidth: 84, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: 10 },
  lookupButtonText: { ...typography.button, color: colors.background },
  lookupError: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  instructions: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  disabled: { opacity: 0.6 },
});
