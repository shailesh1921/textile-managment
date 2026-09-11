import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { FileText, Layers, QrCode, ChevronRight } from 'lucide-react-native';
import { ApiService } from '../../api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const JobOrdersScreen = () => {
  const { t } = useLanguage();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [takas, setTakas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLots = async () => {
    try {
      const data: any = await ApiService.getLots();
      setLots(data || []);
    } catch (err) {
      console.error('Error fetching lots:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleSelectLot = async (lot: any) => {
    if (selectedLot?.lot_id === lot.lot_id) {
      setSelectedLot(null);
      setTakas([]);
    } else {
      setSelectedLot(lot);
      try {
        const takaData: any = await ApiService.getLotTakas(lot.lot_id);
        setTakas(takaData || []);
      } catch (err) {
        setTakas([]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('tab_jobs')} />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.lot_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLots(); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('no_data')}</Text>}
          renderItem={({ item }) => {
            const isExpanded = selectedLot?.lot_id === item.lot_id;
            return (
              <Card style={styles.lotCard}>
                <TouchableOpacity 
                  style={styles.lotHeader}
                  onPress={() => handleSelectLot(item)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.lotNo}>{item.lot_no}</Text>
                      <Badge 
                        label={item.current_status} 
                        variant={item.current_status === 'COMPLETED' ? 'success' : 'info'} 
                      />
                    </View>
                    <Text style={styles.barcodeText}>Barcode: {item.barcode_value}</Text>
                    <Text style={styles.partyText}>Party ID: {item.customer_party_id || 'Trader'} • Qty: {item.total_meters || '2500'} m</Text>
                  </View>
                  <ChevronRight size={16} color={COLORS.textMuted} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                </TouchableOpacity>

                {/* Expanded Taka List */}
                {isExpanded && (
                  <View style={styles.takaSection}>
                    <Text style={styles.takaHeading}>Roll-Level (Taka) Breakdown</Text>
                    
                    {takas.length === 0 ? (
                      <Text style={styles.noTakaText}>No individual rolls logged yet.</Text>
                    ) : (
                      takas.map((taka, i) => (
                        <View key={i} style={styles.takaRow}>
                          <Text style={styles.takaNo}>Taka #{taka.taka_no}</Text>
                          <Text style={styles.takaMeters}>{taka.meters} m</Text>
                          <Text style={styles.takaWeight}>{taka.weight_kg} kg</Text>
                          <Badge label={taka.grade || 'FRESH'} variant="success" />
                        </View>
                      ))
                    )}

                    <Button
                      title="QR Lot Card Generated"
                      onPress={() => Alert.alert('Lot Traveler QR Card', `Lot ${item.lot_no} is synchronized with barcode ${item.barcode_value}. Ready for scanning on machine floor.`)}
                      icon={<QrCode size={14} color="#FFF" />}
                      size="sm"
                      style={{ marginTop: SPACING.md }}
                    />
                  </View>
                )}
              </Card>
            );
          }}
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
  lotCard: {
    marginBottom: SPACING.md,
  },
  lotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lotNo: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  barcodeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  partyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  takaSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  takaHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  takaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  takaNo: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  takaMeters: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  takaWeight: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noTakaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
