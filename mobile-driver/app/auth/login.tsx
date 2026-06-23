import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Button, Input, SnackBar } from '../../src/components/ui';
import { Colors, Spacing, Typography } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setMotorista = useAuth((s) => s.setMotorista);

  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackErr, setSnackErr] = useState(false);

  const msg = (m: string, err = false) => {
    setSnack(m); setSnackErr(err);
    setTimeout(() => setSnack(''), 3000);
  };

  const handleLogin = async () => {
    if (!telefone || !senha) return msg('Preencha telefone e senha', true);
    setLoading(true);
    try {
      const res = await authApi.login(telefone.replace(/\D/g, ''), senha);
      if (res.ok) {
        setMotorista(res.motorista);
        router.replace('/(auth)/face');
      } else {
        msg(res.msg || 'Telefone ou senha incorretos', true);
      }
    } catch { msg('Sem conexão com o servidor', true); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}><Text style={styles.logoText}>NG</Text></View>
          <Text style={styles.title}>Bem-vindo de volta 👋</Text>
          <Text style={styles.subtitle}>Entre na sua conta de motorista</Text>

          <View style={{ marginTop: 32 }}>
            <Input label="Telefone" placeholder="(47) 99999-9999" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.grey} />} />
            <Input label="Senha" placeholder="Sua senha" value={senha} onChangeText={setSenha} secureTextEntry={!showPass}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.grey} />}
              rightIcon={<TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.grey} /></TouchableOpacity>} />
            <Button label="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

            <View style={styles.divRow}><View style={styles.divLine} /><Text style={styles.divText}>ou</Text><View style={styles.divLine} /></View>

            <TouchableOpacity style={styles.regBtn} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.regText}>Novo motorista? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Cadastre-se</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SnackBar message={snack} visible={!!snack} type={snackErr ? 'error' : 'success'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, padding: Spacing.xl },
  logoBox: { width: 56, height: 56, backgroundColor: Colors.primarySoft, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: Spacing.xl },
  logoText: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  title: { fontSize: Typography['3xl'], fontWeight: '800', color: Colors.dark },
  subtitle: { fontSize: Typography.base, color: Colors.grey, marginTop: 6 },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { marginHorizontal: 12, fontSize: Typography.sm, color: Colors.grey },
  regBtn: { alignItems: 'center', paddingVertical: 8 },
  regText: { fontSize: Typography.md, color: Colors.grey }
});