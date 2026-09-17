import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { 
  Mic, MicOff, Sparkles, X, Send, Activity, 
  Database, RefreshCw, Volume2, CheckCircle2, ChevronRight 
} from 'lucide-react-native';
import { ApiService } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Badge } from './Badge';

interface AIVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AIVoiceAssistantModal: React.FC<AIVoiceAssistantModalProps> = ({
  visible,
  onClose,
}) => {
  const { lang: globalLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'hi' | 'gu' | 'en'>((globalLang as any) || 'hi');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [showSql, setShowSql] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const quickChips = {
    hi: [
      "लॉट 1 का स्टेटस क्या है?",
      "गोदाम में कितना ग्रे कपड़ा है?",
      "मशीन फ्लोर की स्थिति बताओ",
      "क्या कोई विलंबित बैच है?"
    ],
    gu: [
      "લોટ 1 નું સ્ટેટસ શું છે?",
      "ગોડાઉનમાં કેટલું ગ્રે કાપડ છે?",
      "કઈ મશીનો અત્યારે ચાલુ છે?",
      "કોઈ બેચમાં પ્રોબ્લેમ છે?"
    ],
    en: [
      "What is the status of Lot 1?",
      "How much greige stock is left?",
      "Show active machines",
      "Any delayed batches?"
    ]
  };

  const handleSend = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    const userMsg = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await ApiService.queryVoiceAssistant({
        query: q,
        language: selectedLang
      });

      const botMsg = {
        sender: 'bot',
        text: res.voice_text,
        displayCard: res.display_card,
        sql: res.sql_executed,
        lang: res.applied_language
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: selectedLang === 'hi' 
            ? 'क्षमा करें, डेटाबेस क्वेरी करने में समस्या आई।'
            : selectedLang === 'gu'
            ? 'માફ કરશો, ડેટાબેઝ ક્વેરી કરવામાં ભૂલ આવી છે.'
            : 'Error querying production database.',
          isError: true 
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleRunDiagnostics = async () => {
    setLoading(true);
    const userMsg = {
      sender: 'user',
      text: selectedLang === 'hi' ? '🚨 कारखाने के अलर्ट्स और डायग्नोस्टिक्स चेक करो' : selectedLang === 'gu' ? '🚨 મિલ એલર્ટ્સ ચેક કરો' : '🚨 Run Proactive Mill Diagnostics'
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await ApiService.getAIDiagnostics();
      const voiceTxt = res.voice_responses?.[selectedLang] || res.display_card?.subtitle || 'Diagnostics complete';
      
      const botMsg = {
        sender: 'bot',
        text: voiceTxt,
        displayCard: res.display_card,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Sparkles size={16} color="#FBBF24" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.title}>VastraAI Copilot</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE DB</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>वस्त्र-AI / વસ્ત્ર-AI Operations Copilot</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Language Switch Chips */}
              <View style={styles.langPills}>
                {(['en', 'hi', 'gu'] as const).map(l => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setSelectedLang(l)}
                    style={[styles.langBtn, selectedLang === l && styles.langBtnActive]}
                  >
                    <Text style={[styles.langText, selectedLang === l && styles.langTextActive]}>
                      {l === 'en' ? 'EN' : l === 'hi' ? 'HI' : 'GU'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Mic size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedLang === 'hi' 
                    ? 'पूछिए: "लॉट 1 का स्टेटस क्या है?"'
                    : selectedLang === 'gu'
                    ? 'પૂછો: "કઈ મશીન અત્યારે ચાલુ છે?"'
                    : 'Ask anything about production floor'}
                </Text>
                <Text style={styles.emptySub}>
                  {selectedLang === 'hi'
                    ? 'कारखाने के कर्मचारी सीधे बोलकर या टैप करके लॉट, मशीन, ग्रे कपड़ा व पेमेंट्स की जानकारी ले सकते हैं।'
                    : selectedLang === 'gu'
                    ? 'કારીગરો બોલીને કે ટેપ કરીને લોટ, જેટ્સ, ગ્રે સ્ટોક જાણી શકે છે.'
                    : 'Ground-level shop floor operators can query batches, greige stock, stenter loads, and receivables in real time.'}
                </Text>

                {/* Quick Chips */}
                <View style={styles.chipsGrid}>
                  {quickChips[selectedLang].map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.chip}
                      onPress={() => handleSend(prompt)}
                    >
                      <Text style={styles.chipText}>💬 {prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Proactive Button */}
                <TouchableOpacity
                  style={styles.diagBtn}
                  onPress={handleRunDiagnostics}
                >
                  <Activity size={14} color="#FFF" />
                  <Text style={styles.diagBtnText}>
                    {selectedLang === 'hi' ? '🚨 अलर्ट्स व विलंबित बैच चेक करें' : selectedLang === 'gu' ? '🚨 મિલ એલર્ટ્સ ચેક કરો' : '🚨 Run Proactive Mill Health Diagnostics'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {messages.map((msg, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.msgRow, 
                  msg.sender === 'user' ? styles.userRow : styles.botRow
                ]}
              >
                {msg.sender === 'user' ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={styles.botCard}>
                    <View style={styles.botHeader}>
                      <View style={styles.sparkleIcon}>
                        <Sparkles size={13} color={COLORS.primary} />
                      </View>
                      <Text style={styles.botText}>{msg.text}</Text>
                    </View>

                    {/* Display Card */}
                    {msg.displayCard && (
                      <View style={styles.displayCardBox}>
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{msg.displayCard.title}</Text>
                            {msg.displayCard.subtitle && (
                              <Text style={styles.cardSubtitle}>{msg.displayCard.subtitle}</Text>
                            )}
                          </View>
                          {msg.displayCard.status && (
                            <Badge 
                              label={msg.displayCard.status} 
                              variant={msg.displayCard.badgeVariant || 'info'} 
                            />
                          )}
                        </View>

                        {/* Metrics Grid */}
                        {msg.displayCard.metrics && (
                          <View style={styles.metricsGrid}>
                            {msg.displayCard.metrics.map((m: any, mIdx: number) => (
                              <View key={mIdx} style={styles.metricBox}>
                                <Text style={styles.metricLabel}>{m.label}</Text>
                                <Text style={styles.metricValue}>{m.value}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* List Items */}
                        {msg.displayCard.list && (
                          <View style={styles.listBox}>
                            {msg.displayCard.list.map((item: any, iIdx: number) => (
                              <View key={iIdx} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.itemName}>{item.name}</Text>
                                  <Text style={styles.itemSub}>{item.sub}</Text>
                                </View>
                                <Text style={styles.itemStatus}>{item.status}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Grounded SQL Toggle */}
                    {msg.sql && (
                      <TouchableOpacity 
                        style={styles.sqlToggle}
                        onPress={() => setShowSql(!showSql)}
                      >
                        <Database size={11} color={COLORS.textMuted} />
                        <Text style={styles.sqlToggleText}>
                          {showSql ? 'Hide SQL' : 'Inspect Grounded SQL'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showSql && msg.sql && (
                      <View style={styles.sqlBox}>
                        <Text style={styles.sqlText}>{msg.sql}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  {selectedLang === 'hi' ? 'डेटाबेस से उत्तर प्राप्त हो रहा है...' : selectedLang === 'gu' ? 'ડેટાબેઝ ક્વેરી ચાલે છે...' : 'Executing grounded query on production DB...'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Input Footer */}
          <View style={styles.footer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder={
                  selectedLang === 'hi'
                    ? 'पूछिए (जैसे: लॉट 1, मशीन फ्लोर)...'
                    : selectedLang === 'gu'
                    ? 'પૂછો (જેમ કે: લોટ 1, મશીનો)...'
                    : 'Ask anything in Hindi, Gujarati or English...'
                }
                placeholderTextColor={COLORS.textMuted}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!query.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => handleSend()}
                disabled={!query.trim() || loading}
              >
                <Send size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '88%',
    display: 'flex',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 9,
    color: '#94A3B8',
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34D399',
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  langBtnActive: {
    backgroundColor: '#FFF',
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  langTextActive: {
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: 4,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  chipsGrid: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  diagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  diagBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  msgRow: {
    marginBottom: SPACING.md,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  botRow: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderTopRightRadius: 2,
    maxWidth: '85%',
  },
  userText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  botCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: 2,
    padding: SPACING.md,
    maxWidth: '96%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  sparkleIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  botText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  displayCardBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  listBox: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  itemStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  sqlToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sqlToggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  sqlBox: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  sqlText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#34D399',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 12,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    padding: 11,
    borderRadius: RADIUS.md,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
