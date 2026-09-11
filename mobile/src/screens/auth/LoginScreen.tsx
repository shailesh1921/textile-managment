import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableOpacity, Alert, Modal, TextInput 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, User, Server, ChevronRight, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { setApiBaseUrl, api } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(api.defaults.baseURL || 'http://localhost:5005');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    }
  };

  const handleSetDemoUser = (user: string) => {
    setUsername(user);
    setPassword('admin123');
    setError('');
  };

  const handleSaveServerUrl = async () => {
    await setApiBaseUrl(customServerUrl);
    setServerModalVisible(false);
    Alert.alert('Server URL Updated', `API endpoint set to: ${customServerUrl}`);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Background Atmosphere Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.millTitle}>SARV UTTAM FABRICS</Text>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>Sign in to your mill ERP workspace</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Username"
            value={username}
            onChangeText={(text) => { setUsername(text); setError(''); }}
            placeholder="e.g. admin or prod_mgr"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            icon={<ChevronRight size={16} color="#FFF" />}
            style={{ marginTop: SPACING.sm }}
          />

          {/* Demo Logins */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>DEMO MILL ACCOUNTS</Text>
            <View style={styles.demoButtonsRow}>
              {['admin', 'prod_mgr', 'qc1'].map((user) => (
                <TouchableOpacity
                  key={user}
                  style={[styles.demoChip, username === user && styles.demoChipActive]}
                  onPress={() => handleSetDemoUser(user)}
                >
                  <Text style={[styles.demoChipText, username === user && styles.demoChipTextActive]}>
                    {user}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Server Config Button */}
          <TouchableOpacity 
            style={styles.serverConfigBtn}
            onPress={() => setServerModalVisible(true)}
          >
            <Server size={12} color={COLORS.textSecondary} />
            <Text style={styles.serverConfigText}>Server: {api.defaults.baseURL}</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.versionFooter}>v1.2.0 • Surat Textile Management Suite</Text>

      </ScrollView>

      {/* Server Endpoint Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Configure API Endpoint</Text>
            <Text style={styles.modalSub}>
              Enter your backend server address (e.g. localhost, local LAN IP, or Vercel URL):
            </Text>

            <TextInput
              style={styles.serverInput}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.100:5005"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.presetBtn}
                onPress={() => setCustomServerUrl('https://textile-managment.vercel.app')}
              >
                <Text style={styles.presetText}>Use Vercel Cloud</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetBtn}
                onPress={() => setCustomServerUrl('http://localhost:5005')}
              >
                <Text style={styles.presetText}>Use Localhost:5005</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Save & Connect"
              onPress={handleSaveServerUrl}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F1F7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: SPACING.sm,
  },
  logoLetter: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 24,
  },
  millTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  welcomeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
  },
  demoSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  demoChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  demoChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  demoChipTextActive: {
    color: COLORS.primary,
  },
  serverConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.lg,
  },
  serverConfigText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
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
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  serverInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
