import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, QrCode, Flashlight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Button } from './Button';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onScan,
  title = 'Scan Lot / Taka QR Code',
  subtitle = 'Align the QR code within the frame to scan',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
    setTimeout(() => {
      setScanned(false);
      onClose();
    }, 400);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.scannerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <QrCode size={20} color={COLORS.primary} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Camera View Area */}
          <View style={styles.cameraBox}>
            {!permission ? (
              <View style={styles.centerMsg}>
                <Text style={styles.msgText}>Requesting camera permission...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.centerMsg}>
                <Text style={styles.msgText}>Camera permission is required to scan QR codes</Text>
                <Button title="Grant Permission" onPress={requestPermission} style={{ marginTop: SPACING.md }} />
              </View>
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torch}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'ean13', 'code128', 'code39', 'upc_a'],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Reticle / Viewfinder Frame */}
                <View style={styles.reticleOverlay}>
                  <View style={styles.reticleFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                </View>

                {/* Torch Toggle */}
                <TouchableOpacity 
                  style={[styles.torchBtn, torch && styles.torchBtnActive]} 
                  onPress={() => setTorch(!torch)}
                >
                  <Flashlight size={18} color={torch ? '#FFF' : '#0F172A'} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <Button 
              title="Close Scanner" 
              variant="outline" 
              onPress={onClose} 
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  scannerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
  },
  cameraBox: {
    width: '100%',
    height: 320,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 8,
  },
  torchBtn: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 10,
    borderRadius: RADIUS.full,
  },
  torchBtnActive: {
    backgroundColor: COLORS.primary,
  },
  centerMsg: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  msgText: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
});
