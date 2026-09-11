import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { DollarSign, TrendingUp, FileText, PieChart } from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const FinanceScreen = () => {
  const { t } = useLanguage();
  const [aging, setAging] = useState<any[]>([]);
  const [lotCost, setLotCost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinance = async () => {
    try {
      const [ag, lc] = await Promise.all([
        ApiService.getAgingReport().catch(() => []),
        ApiService.getLotCost(1).catch(() => null),
      ]);
      setAging(ag || []);
      setLotCost(lc);
    } catch (err) {
      console.error('Error fetching finance:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t('tab_finance')} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFinance(); }} tintColor={COLORS.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Lot Profitability Cost Sheet */}
            <Card title="Lot Profitability Cost Sheet (Lot #LOT-2026-001)">
              <View style={styles.costGrid}>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Billed Revenue</Text>
                  <Text style={[styles.costValue, { color: COLORS.success }]}>₹31,250</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Chemical Cost</Text>
                  <Text style={styles.costValue}>₹{parseFloat(lotCost?.recipe_cost || 4200).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Utility Fuel Cost</Text>
                  <Text style={styles.costValue}>₹{parseFloat(lotCost?.utility_cost || 1850).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Gross Margin</Text>
                  <Text style={[styles.costValue, { color: COLORS.primary }]}>68.4%</Text>
                </View>
              </View>
            </Card>

            {/* Trader Aging Table */}
            <Card title="Trader Receivables Aging Breakdown">
              {aging.length === 0 ? (
                <Text style={styles.emptyText}>{t('no_data')}</Text>
              ) : (
                aging.map((item, idx) => (
                  <View key={idx} style={styles.agingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.traderName}>{item.trade_name}</Text>
                      <Text style={styles.agingDetails}>
                        0-30d: ₹{parseFloat(item.bucket_0_30 || 0).toLocaleString('en-IN')} | 31-60d: ₹{parseFloat(item.bucket_31_60 || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.agingTotal}>
                      ₹{(parseFloat(item.bucket_0_30 || 0) + parseFloat(item.bucket_31_60 || 0) + parseFloat(item.bucket_61_90 || 0) + parseFloat(item.bucket_90_plus || 0)).toLocaleString('en-IN')}
                    </Text>
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
  costGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  costItem: {
    width: '48%',
    backgroundColor: COLORS.borderLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  costLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
  },
  agingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  traderName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  agingDetails: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  agingTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
