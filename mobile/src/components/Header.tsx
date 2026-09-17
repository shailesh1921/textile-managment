import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Crown, ShieldCheck, UserCheck, ChevronDown, Check, LogOut, Mic, Sparkles } from 'lucide-react-native';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { useAuth, UserRole } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { AIVoiceAssistantModal } from './AIVoiceAssistantModal';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const insets = useSafeAreaInsets();
  const { lang, setLang, t } = useLanguage();
  const { user, activeRole, setActiveRole, logout } = useAuth();
  
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const getRoleInfo = () => {
    switch (activeRole) {
      case 'OWNER':
        return { label: t('owner_title'), icon: Crown, color: COLORS.owner, bg: COLORS.ownerLight };
      case 'STAFF':
        return { label: t('staff_title'), icon: UserCheck, color: COLORS.staff, bg: COLORS.staffLight };
      default:
        return { label: t('admin_title'), icon: ShieldCheck, color: COLORS.primary, bg: COLORS.primaryLight };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  const getLangLabel = () => {
    if (lang === 'hi') return 'HI (हिंदी)';
    if (lang === 'gu') return 'GU (ગુજરાતી)';
    return 'EN (English)';
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      
      {/* Top Row: Brand Logo + Controls */}
      <View style={styles.topRow}>
        
        {/* Brand Left */}
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>S</Text>
          </View>
          <View>
            <Text style={styles.brandName}>{t('mill_name')}</Text>
            {title && <Text style={styles.headerSubtitle}>{title}</Text>}
          </View>
        </View>

        {/* Right Controls: Language & Role Badge */}
        <View style={styles.controlsRow}>
          
          {/* AI Voice Assistant Button */}
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.8}
          >
            <Sparkles size={11} color="#FBBF24" />
            <Mic size={13} color="#FFF" />
          </TouchableOpacity>

          {/* Language Switch Button */}
          <TouchableOpacity 
            style={styles.langButton}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.8}
          >
            <Globe size={13} color={COLORS.primary} />
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Role Pill Button */}
          <TouchableOpacity 
            style={[styles.rolePill, { backgroundColor: roleInfo.bg }]}
            onPress={() => setRoleModalVisible(true)}
            activeOpacity={0.8}
          >
            <RoleIcon size={13} color={roleInfo.color} />
            <Text style={[styles.rolePillText, { color: roleInfo.color }]}>
              {activeRole === 'OWNER' ? '👑' : activeRole === 'STAFF' ? '👷‍♂️' : '⚙️'}
            </Text>
            <ChevronDown size={12} color={roleInfo.color} />
          </TouchableOpacity>

        </View>

      </View>

      {/* Role Switcher Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRoleModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('switch_workspace')}</Text>

            <TouchableOpacity 
              style={[styles.modalItem, activeRole === 'OWNER' && styles.modalItemActive]}
              onPress={() => { setActiveRole('OWNER'); setRoleModalVisible(false); }}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.roleBadgeIcon, { backgroundColor: COLORS.owner }]}>
                  <Crown size={14} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.itemTitle}>{t('owner_title')}</Text>
                  <Text style={styles.itemSub}>{t('owner_sub')}</Text>
                </View>
              </View>
              {activeRole === 'OWNER' && <Check size={16} color={COLORS.owner} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, activeRole === 'ADMIN' && styles.modalItemActive]}
              onPress={() => { setActiveRole('ADMIN'); setRoleModalVisible(false); }}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.roleBadgeIcon, { backgroundColor: COLORS.primary }]}>
                  <ShieldCheck size={14} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.itemTitle}>{t('admin_title')}</Text>
                  <Text style={styles.itemSub}>{t('admin_sub')}</Text>
                </View>
              </View>
              {activeRole === 'ADMIN' && <Check size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, activeRole === 'STAFF' && styles.modalItemActive]}
              onPress={() => { setActiveRole('STAFF'); setRoleModalVisible(false); }}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.roleBadgeIcon, { backgroundColor: COLORS.staff }]}>
                  <UserCheck size={14} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.itemTitle}>{t('staff_title')}</Text>
                  <Text style={styles.itemSub}>{t('staff_sub')}</Text>
                </View>
              </View>
              {activeRole === 'STAFF' && <Check size={16} color={COLORS.staff} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => { setRoleModalVisible(false); logout(); }}
            >
              <LogOut size={14} color={COLORS.danger} />
              <Text style={styles.logoutText}>{t('sign_out')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Language Switcher Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language / ભાષા / भाषा</Text>

            <TouchableOpacity 
              style={[styles.modalItem, lang === 'en' && styles.modalItemActive]}
              onPress={() => { setLang('en'); setLangModalVisible(false); }}
            >
              <Text style={styles.itemTitle}>🇬🇧 English (Main)</Text>
              {lang === 'en' && <Check size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, lang === 'hi' && styles.modalItemActive]}
              onPress={() => { setLang('hi'); setLangModalVisible(false); }}
            >
              <Text style={styles.itemTitle}>🇮🇳 हिंदी (Hindi)</Text>
              {lang === 'hi' && <Check size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, lang === 'gu' && styles.modalItemActive]}
              onPress={() => { setLang('gu'); setLangModalVisible(false); }}
            >
              <Text style={styles.itemTitle}>🇮🇳 ગુજરાતી (Gujarati)</Text>
              {lang === 'gu' && <Check size={16} color={COLORS.primary} />}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* VastraAI Voice Assistant Modal */}
      <AIVoiceAssistantModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#0F172A',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.borderLight,
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  modalItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  roleBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
