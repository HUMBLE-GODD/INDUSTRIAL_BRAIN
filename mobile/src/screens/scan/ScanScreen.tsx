import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { ManualLookupInput } from '../../components/ui/ManualLookupInput';
import { OfflineBanner } from '../../components/ui/OfflineBanner';

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Reset scan state when screen regains focus
  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      setScanFeedback(null);
    }
  }, [isFocused]);

  const parseScannedData = (data: string): string => {
    const raw = data.trim();

    // Check if JSON payload (e.g. { "equipment_id": "EQ-001" })
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.equipment_id) return String(parsed.equipment_id).toUpperCase();
        if (parsed.id) return String(parsed.id).toUpperCase();
      } catch {
        // Not valid JSON, continue with string extraction
      }
    }

    // Check if URL (e.g. https://.../equipment/EQ-001 or ...?id=EQ-001)
    const urlMatch = raw.match(/\/equipment\/([A-Za-z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }

    // Clean any prefix like "EQ:" or "ID:"
    return raw.replace(/^(eq:|id:)/i, '').trim().toUpperCase();
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    const parsedId = parseScannedData(data);
    setScanFeedback(`Found Asset: ${parsedId}`);

    // Navigate to EquipmentDetail screen
    setTimeout(() => {
      navigation.navigate('EquipmentDetail', {
        equipmentId: parsedId,
      });
    }, 400);
  };

  const handleManualLookup = (equipmentId: string) => {
    navigation.navigate('EquipmentDetail', {
      equipmentId: equipmentId.trim().toUpperCase(),
    });
  };

  const isCameraAvailable = Platform.OS !== 'web' && permission?.granted;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Asset QR Scanner</Text>
          <Text style={styles.subtitle}>
            Point camera at equipment QR code or enter equipment ID manually
          </Text>
        </View>

        {/* Camera Scanner Viewport or Fallback */}
        <Card style={styles.cameraCard}>
          {isCameraAvailable && isFocused ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />

              {/* Target Scan Reticle Overlay */}
              <View style={styles.overlay}>
                <View style={styles.scanReticle}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.reticleInstruction}>
                  Align equipment QR code inside box
                </Text>
              </View>

              {scanFeedback && (
                <View style={styles.feedbackBadge}>
                  <Text style={styles.feedbackText}>{scanFeedback}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.permissionDeniedBox}>
              <Text style={styles.cameraDeniedIcon}>📷</Text>
              <Text style={styles.cameraDeniedTitle}>
                {permission?.granted === false
                  ? 'Camera Permission Denied'
                  : 'Camera Scanner Unavailable'}
              </Text>
              <Text style={styles.cameraDeniedText}>
                {permission?.granted === false
                  ? 'Camera access was declined. You can still look up any equipment asset by entering its ID below.'
                  : 'Grant camera permission to enable real-time QR scanning on the plant floor.'}
              </Text>

              {permission && !permission.granted && (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permissionButtonText}>Request Camera Access</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => {
              setScanned(false);
              setScanFeedback(null);
            }}
          >
            <Text style={styles.rescanButtonText}>Scan Another Asset</Text>
          </TouchableOpacity>
        )}

        {/* Always Accessible Manual Lookup Form */}
        <Card style={styles.manualLookupCard}>
          <ManualLookupInput
            onLookup={handleManualLookup}
            placeholder="Type ID (e.g. EQ-001)"
          />
        </Card>

        <View style={styles.infoFooter}>
          <Text style={styles.infoFooterText}>
            ℹ️ Monitored plant equipment IDs: EQ-001, EQ-002, EQ-003, EQ-004, EQ-005.
          </Text>
        </View>
      </ScrollView>
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
  header: {
    marginBottom: spacing.lg,
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
  cameraCard: {
    height: 320,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.lg,
    padding: 0,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanReticle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  reticleInstruction: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  feedbackBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: '700',
  },
  permissionDeniedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cameraDeniedIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  cameraDeniedTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cameraDeniedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '700',
  },
  rescanButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rescanButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  manualLookupCard: {
    padding: spacing.lg,
  },
  infoFooter: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  infoFooterText: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
