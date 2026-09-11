import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { 
  FileText, Activity, CheckSquare, Truck, UserCheck, 
  CheckCircle2, Plus, QrCode, Scan 
} from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { QRScannerModal } from '../../components/QRScannerModal';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const StaffEntryScreen = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'inward' | 'batch' | 'qc' | 'dispatch'>('inward');
  const [parties, setParties] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);

  // Forms
  const [inwardForm, setInwardForm] = useState({
    party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50',
  });

  const [batchForm, setBatchForm] = useState({
    lot_id: '', machine_id: '', shift: 'A', weight_kg: '',
  });

  const [qcForm, setQcForm] = useState({
    lot_id: '', meters_inspected: '100', total_defect_points: '12', remarks: 'Good surface quality',
  });

  const [dispatchForm, setDispatchForm] = useState({
    lot_id: '', total_rolls: '10', total_meters: '1050', finished_kg: '185',
  });

  const fetchMasterData = async () => {
    try {
      const [p, f, m, l] = await Promise.all([
        ApiService.getParties().catch(() => []),
        ApiService.getFabrics().catch(() => []),
        ApiService.getMachines().catch(() => []),
        ApiService.getLots().catch(() => []),
      ]);
      setParties(p || []);
      setFabrics(f || []);
      setMachines(m || []);
      setLots(l || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleInwardSubmit = async () => {
    if (!inwardForm.party_id || !inwardForm.fabric_id || !inwardForm.ordered_meters) {
      Alert.alert('Required Fields', 'Please select customer, fabric and enter received meters.');
      return;
    }
    setLoading(true);
    try {
      const party = parties.find(p => p.party_id === parseInt(inwardForm.party_id));
      const res: any = await ApiService.createJobOrder({
        party_id: parseInt(inwardForm.party_id),
        party_name: party?.trade_name || 'Trader',
        fabric_id: parseInt(inwardForm.fabric_id),
        challan_no: inwardForm.challan_no || `CH-${Date.now().toString().slice(-4)}`,
        ordered_meters: parseFloat(inwardForm.ordered_meters),
        rate_per_meter: parseFloat(inwardForm.rate_per_meter),
      });
      setSuccessMsg(`✓ Inward Order #${res?.job_order_no || 'Created'} successfully!`);
      setInwardForm({ party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50' });
      fetchMasterData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!batchForm.lot_id || !batchForm.machine_id || !batchForm.weight_kg) {
      Alert.alert('Required Fields', 'Please select lot, machine, and enter fabric weight in KG.');
      return;
    }
    setLoading(true);
    try {
      await ApiService.createBatch({
        lot_id: parseInt(batchForm.lot_id),
        machine_id: parseInt(batchForm.machine_id),
        shift: batchForm.shift,
        fabric_weight_kg: parseFloat(batchForm.weight_kg),
      });
      setSuccessMsg('✓ Production Batch execution logged successfully!');
      setBatchForm({ lot_id: '', machine_id: '', shift: 'A', weight_kg: '' });
      fetchMasterData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQcSubmit = async () => {
    if (!qcForm.lot_id || !qcForm.total_defect_points) {
      Alert.alert('Required Fields', 'Please select lot and enter defect points.');
      return;
    }
    setLoading(true);
    try {
      const points = parseInt(qcForm.total_defect_points);
      const pass = points <= 28;
      await ApiService.submitQCInspection({
        lot_id: parseInt(qcForm.lot_id),
        meters_inspected: parseFloat(qcForm.meters_inspected),
        total_defect_points: points,
        overall_grade: pass ? 'GRADE_A' : 'GRADE_B',
        inspection_result: pass ? 'PASSED' : 'REPROCESS',
        remarks: qcForm.remarks,
      });
      setSuccessMsg(`✓ QC Inspection: Result is ${pass ? 'PASSED (Grade A)' : 'REPROCESS'}`);
      setQcForm({ lot_id: '', meters_inspected: '100', total_defect_points: '12', remarks: '' });
      fetchMasterData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSubmit = async () => {
    if (!dispatchForm.lot_id || !dispatchForm.total_meters) {
      Alert.alert('Required Fields', 'Please select finished lot and enter finished meters.');
      return;
    }
    setLoading(true);
    try {
      await ApiService.createPackingList({
        lot_id: parseInt(dispatchForm.lot_id),
        total_rolls: parseInt(dispatchForm.total_rolls),
        total_meters: parseFloat(dispatchForm.total_meters),
        total_kg: parseFloat(dispatchForm.finished_kg),
      });
      setSuccessMsg('✓ Packing List created and marked ready for Dispatch!');
      setDispatchForm({ lot_id: '', total_rolls: '10', total_meters: '1050', finished_kg: '185' });
      fetchMasterData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = (scannedData: string) => {
    // Check if scanned code matches a Lot No or contains lot info
    const matchedLot = lots.find(l => 
      l.lot_no === scannedData || 
      l.barcode_value === scannedData || 
      scannedData.includes(l.lot_no)
    );
    if (matchedLot) {
      if (activeTab === 'batch') setBatchForm(prev => ({ ...prev, lot_id: String(matchedLot.lot_id) }));
      if (activeTab === 'qc') setQcForm(prev => ({ ...prev, lot_id: String(matchedLot.lot_id) }));
      if (activeTab === 'dispatch') setDispatchForm(prev => ({ ...prev, lot_id: String(matchedLot.lot_id) }));
      Alert.alert('QR Scanned', `Matched Lot: ${matchedLot.lot_no} (${matchedLot.current_status})`);
    } else {
      Alert.alert('Scanned QR Code', `Raw Data: ${scannedData}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title={t('tab_staff')} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Banner with Scan QR button */}
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
            <View style={styles.bannerTag}>
              <UserCheck size={12} color="#FFF" />
              <Text style={styles.bannerTagText}>{t('staff_title')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.scanBtn}
              onPress={() => setScannerVisible(true)}
            >
              <Scan size={14} color="#064E3B" />
              <Text style={styles.scanBtnText}>Scan Lot QR</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerTitle}>{t('staff_banner_title')}</Text>
          <Text style={styles.bannerSub}>{t('staff_banner_sub')}</Text>
        </View>

        <QRScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScan={handleScanQR}
          title="Scan Lot / Roll Traveler QR"
          subtitle="Point camera at the QR code printed on the physical lot card"
        />

        {successMsg ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={14} color={COLORS.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* 4 Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { id: 'inward', label: t('tab_inward_greige'), icon: FileText },
            { id: 'batch', label: t('tab_load_batch'), icon: Activity },
            { id: 'qc', label: t('tab_qc_inspect'), icon: CheckSquare },
            { id: 'dispatch', label: t('tab_packing_dispatch'), icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => { setActiveTab(tab.id as any); setSuccessMsg(''); }}
              >
                <Icon size={14} color={active ? '#FFF' : COLORS.textSecondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Form Containers */}
        {activeTab === 'inward' && (
          <Card title={t('tab_inward_greige')}>
            <Select
              label={t('customer_trader')}
              value={inwardForm.party_id}
              options={[{ label: t('select_customer'), value: '' }, ...parties.map(p => ({ label: `${p.trade_name} (${p.city || 'Surat'})`, value: p.party_id }))]}
              onSelect={(val) => setInwardForm({ ...inwardForm, party_id: val })}
            />
            <Select
              label={t('fabric_quality')}
              value={inwardForm.fabric_id}
              options={[{ label: t('select_fabric'), value: '' }, ...fabrics.map(f => ({ label: `${f.fabric_name} (${f.fabric_category})`, value: f.fabric_id }))]}
              onSelect={(val) => setInwardForm({ ...inwardForm, fabric_id: val })}
            />
            <Input
              label={t('challan_no')}
              value={inwardForm.challan_no}
              onChangeText={(text) => setInwardForm({ ...inwardForm, challan_no: text })}
              placeholder="e.g. CH-8921"
            />
            <Input
              label={t('received_meters')}
              value={inwardForm.ordered_meters}
              onChangeText={(text) => setInwardForm({ ...inwardForm, ordered_meters: text })}
              placeholder="e.g. 2500"
              keyboardType="numeric"
            />
            <Input
              label={t('job_rate')}
              value={inwardForm.rate_per_meter}
              onChangeText={(text) => setInwardForm({ ...inwardForm, rate_per_meter: text })}
              keyboardType="numeric"
            />
            <Button
              title={t('submit_inward')}
              onPress={handleInwardSubmit}
              loading={loading}
              variant="success"
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

        {activeTab === 'batch' && (
          <Card title={t('tab_load_batch')}>
            <Select
              label={t('select_lot')}
              value={batchForm.lot_id}
              options={[{ label: `-- ${t('select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
              onSelect={(val) => setBatchForm({ ...batchForm, lot_id: val })}
            />
            <Select
              label={t('select_machine')}
              value={batchForm.machine_id}
              options={[{ label: `-- ${t('select_machine')} --`, value: '' }, ...machines.map(m => ({ label: `${m.machine_name} (${m.machine_type})`, value: m.machine_id }))]}
              onSelect={(val) => setBatchForm({ ...batchForm, machine_id: val })}
            />
            <Select
              label={t('shift')}
              value={batchForm.shift}
              options={[
                { label: t('shift_a'), value: 'A' },
                { label: t('shift_b'), value: 'B' },
                { label: t('shift_c'), value: 'C' },
              ]}
              onSelect={(val) => setBatchForm({ ...batchForm, shift: val })}
            />
            <Input
              label={t('fabric_weight_kg')}
              value={batchForm.weight_kg}
              onChangeText={(text) => setBatchForm({ ...batchForm, weight_kg: text })}
              placeholder="e.g. 350.5"
              keyboardType="numeric"
            />
            <Button
              title={t('submit_batch')}
              onPress={handleBatchSubmit}
              loading={loading}
              variant="success"
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

        {activeTab === 'qc' && (
          <Card title={t('tab_qc_inspect')}>
            <Select
              label={t('select_lot')}
              value={qcForm.lot_id}
              options={[{ label: `-- ${t('select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} - ${l.current_status}`, value: l.lot_id }))]}
              onSelect={(val) => setQcForm({ ...qcForm, lot_id: val })}
            />
            <Input
              label={t('meters_inspected')}
              value={qcForm.meters_inspected}
              onChangeText={(text) => setQcForm({ ...qcForm, meters_inspected: text })}
              keyboardType="numeric"
            />
            <Input
              label={t('defect_points')}
              value={qcForm.total_defect_points}
              onChangeText={(text) => setQcForm({ ...qcForm, total_defect_points: text })}
              placeholder="e.g. 14"
              keyboardType="numeric"
            />
            <Input
              label={t('inspector_remarks')}
              value={qcForm.remarks}
              onChangeText={(text) => setQcForm({ ...qcForm, remarks: text })}
            />
            <Button
              title={t('submit_qc')}
              onPress={handleQcSubmit}
              loading={loading}
              variant="success"
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

        {activeTab === 'dispatch' && (
          <Card title={t('tab_packing_dispatch')}>
            <Select
              label={t('select_lot')}
              value={dispatchForm.lot_id}
              options={[{ label: `-- ${t('select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
              onSelect={(val) => setDispatchForm({ ...dispatchForm, lot_id: val })}
            />
            <Input
              label={t('total_rolls')}
              value={dispatchForm.total_rolls}
              onChangeText={(text) => setDispatchForm({ ...dispatchForm, total_rolls: text })}
              keyboardType="numeric"
            />
            <Input
              label={t('finished_meters')}
              value={dispatchForm.total_meters}
              onChangeText={(text) => setDispatchForm({ ...dispatchForm, total_meters: text })}
              keyboardType="numeric"
            />
            <Input
              label={t('finished_kg')}
              value={dispatchForm.finished_kg}
              onChangeText={(text) => setDispatchForm({ ...dispatchForm, finished_kg: text })}
              keyboardType="numeric"
            />
            <Button
              title={t('submit_dispatch')}
              onPress={handleDispatchSubmit}
              loading={loading}
              variant="success"
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#064E3B',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.staff,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bannerTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A7F3D0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  scanBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064E3B',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  bannerSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    flex: 1,
  },
  tabScroll: {
    marginBottom: SPACING.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.staff,
    borderColor: COLORS.staff,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
});
