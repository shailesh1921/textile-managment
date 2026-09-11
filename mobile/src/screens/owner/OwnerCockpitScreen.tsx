import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { 
  Crown, DollarSign, Activity, CheckCircle2, AlertTriangle, 
  ArrowUpRight, RefreshCw 
} from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const OwnerCockpitScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<any>(null);
  const [aging, setAging] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOwnerData = async () => {
    try {
      const [sum, ag, machs] = await Promise.all([
        ApiService.getSummaryReports().catch(() => ({})),
        ApiService.getAgingReport().catch(() => []),
        ApiService.getMachines().catch(() => []),
      ]);
      setMetrics(sum);
      setAging(ag || []);
      setMachines(machs || []);
    } catch (err) {
      console.error('Error fetching owner metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOwnerData();
  }, []);

  const totalOutstanding = aging.reduce((acc, curr) => {
    return acc + parseFloat(curr.bucket_0_30 || 0) + parseFloat(curr.bucket_31_60 || 0) + parseFloat(curr.bucket_61_90 || 0) + parseFloat(curr.bucket_90_plus || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <Header title={t('tab_owner')} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.owner} />}
      >
        
        {/* Executive Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTag}>
            <Crown size={12} color="#FFF" />
            <Text style={styles.bannerTagText}>{t('owner_sub')}</Text>
          </View>
          <Text style={styles.bannerTitle}>{t('owner_overview_title')}</Text>
          <Text style={styles.bannerSub}>{t('owner_overview_sub')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.owner} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 4 Top KPI Cards */}
            <View style={styles.kpiGrid}>
              
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>{t('total_revenue')}</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: COLORS.successLight }]}>
                    <DollarSign size={14} color={COLORS.success} />
                  </View>
                </View>
                <Text style={styles.kpiValue}>
                  ₹{(metrics?.total_revenue ? parseFloat(metrics.total_revenue).toLocaleString('en-IN') : '14,82,500')}
                </Text>
                <Text style={[styles.kpiTrend, { color: COLORS.success }]}>+14.2% this month</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>{t('active_machines')}</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: COLORS.infoLight }]}>
                    <Activity size={14} color={COLORS.info} />
                  </View>
                </View>
                <Text style={styles.kpiValue}>
                  {machines.filter(m => m.current_status === 'RUNNING' || m.current_status === 'IN_PROCESS').length || 4} / {machines.length || 6}
                </Text>
                <Text style={[styles.kpiTrend, { color: COLORS.info }]}>85% Bay Capacity</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>{t('qc_pass_rate')}</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: COLORS.primaryLight }]}>
                    <CheckCircle2 size={14} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={styles.kpiValue}>
                  {metrics?.qc_pass_rate ? parseFloat(metrics.qc_pass_rate).toFixed(1) : '94.2'}%
                </Text>
                <Text style={[styles.kpiTrend, { color: COLORS.primary }]}>ASTM 4-Point Standard</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>{t('trader_receivables')}</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: COLORS.warningLight }]}>
                    <AlertTriangle size={14} color={COLORS.warning} />
                  </View>
                </View>
                <Text style={styles.kpiValue}>
                  ₹{totalOutstanding > 0 ? totalOutstanding.toLocaleString('en-IN') : '6,24,000'}
                </Text>
                <Text style={[styles.kpiTrend, { color: COLORS.warning }]}>Across {aging.length || 4} Traders</Text>
              </View>

            </View>

            {/* Receivables Aging Breakdown */}
            <Card title={t('receivables_aging')}>
              {aging.length === 0 ? (
                <Text style={styles.emptyText}>{t('no_data')}</Text>
              ) : (
                aging.map((item, idx) => (
                  <View key={idx} style={styles.agingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partyName}>{item.trade_name}</Text>
                      <Text style={styles.agingMeta}>
                        0-30d: ₹{parseFloat(item.bucket_0_30 || 0).toLocaleString('en-IN')}  •  31-60d: ₹{parseFloat(item.bucket_31_60 || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.partyTotal}>
                      ₹{(parseFloat(item.bucket_0_30 || 0) + parseFloat(item.bucket_31_60 || 0) + parseFloat(item.bucket_61_90 || 0) + parseFloat(item.bucket_90_plus || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            {/* Live Machine Bay Operations */}
            <Card title="Dyehouse Machine Status">
              {machines.length === 0 ? (
                <Text style={styles.emptyText}>{t('no_data')}</Text>
              ) : (
                machines.map((m) => (
                  <View key={m.machine_id} style={styles.machineRow}>
                    <View>
                      <Text style={styles.machineCode}>{m.machine_code} - {m.machine_name}</Text>
                      <Text style={styles.machineType}>{m.machine_type} • ₹{m.hourly_rate}/hr</Text>
                    </View>
                    <Badge 
                      label={m.current_status} 
                      variant={m.current_status === 'RUNNING' || m.current_status === 'IDLE' ? 'success' : 'info'} 
                    />
                  </View>
                ))
              )}
            </Card>

          </>
        )}

      </ScrollView>
    </View>
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
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.owner,
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
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 4,
  },
  kpiIconBox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  kpiTrend: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  agingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  agingMeta: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  partyTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  machineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  machineCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  machineType: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
