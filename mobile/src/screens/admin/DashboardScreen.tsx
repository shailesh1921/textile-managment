import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { 
  LayoutDashboard, Activity, CheckSquare, Package, 
  TrendingUp, ArrowRight 
} from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const DashboardScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [sum, bts] = await Promise.all([
        ApiService.getSummaryReports().catch(() => ({})),
        ApiService.getBatches().catch(() => []),
      ]);
      setMetrics(sum);
      setBatches(bts || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t('tab_dashboard')} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Quick Metrics */}
            <View style={styles.grid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Monthly Output</Text>
                <Text style={styles.statValue}>31,000 m</Text>
                <Text style={styles.statSub}>+12.4% vs last mo</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>QC Pass Rate</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {metrics?.qc_pass_rate ? parseFloat(metrics.qc_pass_rate).toFixed(1) : '94.2'}%
                </Text>
                <Text style={styles.statSub}>ASTM D5430 Standard</Text>
              </View>
            </View>

            {/* Active Floor Batches */}
            <Card title="Active Machine Batches">
              {batches.length === 0 ? (
                <Text style={styles.emptyText}>{t('no_data')}</Text>
              ) : (
                batches.slice(0, 6).map((b) => (
                  <View key={b.batch_id} style={styles.batchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.batchNo}>{b.batch_no}</Text>
                      <Text style={styles.batchMeta}>{b.lot_no} • {b.machine_name} • {b.process_name}</Text>
                    </View>
                    <Badge 
                      label={b.status} 
                      variant={b.status === 'COMPLETED' ? 'success' : b.status === 'IN_PROCESS' ? 'info' : 'warning'} 
                    />
                  </View>
                ))
              )}
            </Card>

            {/* Quick Modules Navigation */}
            <Card title="Operations Modules">
              <View style={styles.modulesGrid}>
                {[
                  { name: 'Job Orders', screen: 'Jobs', icon: Activity, color: '#3B82F6' },
                  { name: 'Production', screen: 'Production', icon: TrendingUp, color: '#10B981' },
                  { name: 'Quality QC', screen: 'QC', icon: CheckSquare, color: '#6B4EFF' },
                  { name: 'Finance', screen: 'Finance', icon: Package, color: '#F59E0B' },
                ].map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <TouchableOpacity
                      key={mod.name}
                      style={styles.moduleBtn}
                      onPress={() => navigation.navigate(mod.screen)}
                    >
                      <View style={[styles.modIconBox, { backgroundColor: `${mod.color}15` }]}>
                        <Icon size={18} color={mod.color} />
                      </View>
                      <Text style={styles.modName}>{mod.name}</Text>
                      <ArrowRight size={12} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  grid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  batchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  batchNo: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  batchMeta: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  moduleBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  modIconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
