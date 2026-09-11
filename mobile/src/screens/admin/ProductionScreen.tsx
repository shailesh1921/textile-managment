import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Modal, Alert 
} from 'react-native';
import { Activity, Flame, Plus, Zap, Check } from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const ProductionScreen = () => {
  const { t } = useLanguage();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Utility modal
  const [utilityModalVisible, setUtilityModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [utilityForm, setUtilityForm] = useState({
    utility_type: 'ELECTRICITY_KWH',
    quantity: '',
    unit_cost: '8.50',
    shift: 'A',
  });

  const fetchBatches = async () => {
    try {
      const data: any = await ApiService.getBatches();
      setBatches(data || []);
    } catch (err) {
      console.error('Error fetching production batches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleLogUtility = async () => {
    if (!utilityForm.quantity) {
      Alert.alert('Required', 'Please enter fuel / utility consumption quantity.');
      return;
    }
    try {
      await ApiService.addUtilityLog(selectedBatch.batch_id, {
        utility_type: utilityForm.utility_type,
        quantity: parseFloat(utilityForm.quantity),
        unit_cost: parseFloat(utilityForm.unit_cost),
        shift: utilityForm.shift,
      });
      setUtilityModalVisible(false);
      Alert.alert('Success', 'Shift utility consumption recorded!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('tab_production')} />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item.batch_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBatches(); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('no_data')}</Text>}
          renderItem={({ item }) => (
            <Card style={styles.batchCard}>
              <View style={styles.batchHeader}>
                <View>
                  <Text style={styles.batchNo}>{item.batch_no}</Text>
                  <Text style={styles.lotText}>{item.lot_no} ({item.barcode_value})</Text>
                </View>
                <Badge 
                  label={item.status} 
                  variant={item.status === 'COMPLETED' ? 'success' : item.status === 'IN_PROCESS' ? 'info' : 'warning'} 
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaItem}>Machine: <Text style={{ fontWeight: '700', color: COLORS.text }}>{item.machine_name}</Text></Text>
                <Text style={styles.metaItem}>Process: <Text style={{ fontWeight: '700', color: COLORS.text }}>{item.process_name}</Text></Text>
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="Log Utility Fuel"
                  onPress={() => { setSelectedBatch(item); setUtilityModalVisible(true); }}
                  icon={<Zap size={14} color={COLORS.primary} />}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        />
      )}

      {/* Utility Modal */}
      <Modal
        visible={utilityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUtilityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Log Batch Utility Consumption</Text>
            <Text style={styles.modalSub}>Batch #{selectedBatch?.batch_no} • Shift Fuel Readings</Text>

            <Select
              label="Utility Type"
              value={utilityForm.utility_type}
              options={[
                { label: 'Electricity (kWh)', value: 'ELECTRICITY_KWH' },
                { label: 'Steam (KG)', value: 'STEAM_KG' },
                { label: 'Natural Gas (m³)', value: 'GAS_M3' },
                { label: 'Coal (KG)', value: 'COAL_KG' },
              ]}
              onSelect={(val) => setUtilityForm({ ...utilityForm, utility_type: val })}
            />

            <Input
              label="Quantity Consumed"
              value={utilityForm.quantity}
              onChangeText={(text) => setUtilityForm({ ...utilityForm, quantity: text })}
              placeholder="e.g. 150"
              keyboardType="numeric"
            />

            <Input
              label="Unit Cost (₹)"
              value={utilityForm.unit_cost}
              onChangeText={(text) => setUtilityForm({ ...utilityForm, unit_cost: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setUtilityModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Record Fuel Log"
                onPress={handleLogUtility}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  batchCard: {
    marginBottom: SPACING.md,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchNo: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  lotText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionRow: {
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
