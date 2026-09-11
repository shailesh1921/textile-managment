import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { CheckSquare, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const QualityControlScreen = () => {
  const { t } = useLanguage();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQCQueue = async () => {
    try {
      const data: any = await ApiService.getQCQueue();
      setQueue(data || []);
    } catch (err) {
      console.error('Error fetching QC queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQCQueue();
  }, []);

  const handleQuickApprove = async (lot: any) => {
    try {
      await ApiService.submitQCInspection({
        lot_id: lot.lot_id,
        meters_inspected: 100,
        total_defect_points: 8,
        overall_grade: 'GRADE_A',
        inspection_result: 'PASSED',
        remarks: 'Passed ASTM 4-Point inspection standards.',
      });
      Alert.alert('QC Approved', `Lot ${lot.lot_no} passed QC audit (Grade A).`);
      fetchQCQueue();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('tab_qc')} />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.lot_id}_${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQCQueue(); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('no_data')}</Text>}
          renderItem={({ item }) => (
            <Card style={styles.qcCard}>
              <View style={styles.qcHeader}>
                <View>
                  <Text style={styles.lotNo}>{item.lot_no}</Text>
                  <Text style={styles.barcodeText}>{item.barcode_value}</Text>
                </View>
                <Badge label={item.current_status || 'READY_FOR_QC'} variant="warning" />
              </View>

              <Text style={styles.partyText}>Customer: {item.customer_name || 'Trader Merchant'}</Text>
              <Text style={styles.qualityStandard}>Standard: ASTM D5430 (≤28 pts / 100 sq. m)</Text>

              <View style={styles.buttonRow}>
                <Button
                  title="Approve (Grade A)"
                  onPress={() => handleQuickApprove(item)}
                  icon={<ShieldCheck size={14} color="#FFF" />}
                  variant="success"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  qcCard: {
    marginBottom: SPACING.md,
  },
  qcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotNo: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  barcodeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  partyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  qualityStandard: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  buttonRow: {
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
