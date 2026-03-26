import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Button, Input, StepBar, Card, SnackBar } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';

export default function RegisterScreen() {
  const router       = useRouter();
  const setMotorista = useAuth((s) => s.setMotorista);

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [snack,   setSnack]   = useState('');
  const [snackErr,setSnackErr]= useState(false);

  // Passo 1
  const [nome,     setNome]     = useState('');
  const [cpf,      setCpf]      = useState('');
  const [nasc,     setNasc]     = useState('');
  const [telefone, setTelefone] = useState('');
  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');
  const [showPass, setShowPass] = useState(false);

  // Passo 2 — documentos
  const [cnhUri,  setCnhUri]  = useState('');
  const [crlvUri, setCrlvUri] = useState('');
  const [cnhOk,   setCnhOk]   = useState(false);
  const [crlvOk,  setCrlvOk]  = useState(false);

  const msg = (m: string, err = false) => {
    setSnack(m); setSnackErr(err);
    setTimeout(() => setSnack(''), 3000);
  };

  const pickDoc = async (tipo: 'cnh'|'crlv') => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (r.canceled) return;
    const uri = r.assets[0].uri;
    if (tipo === 'cnh') { setCnhUri(uri); setCnhOk(true); }
    else { setCrlvUri(uri); setCrlvOk(true); }
  };

  const next = async () => {
    if (step === 1) {
      if (!nome.trim()) return msg('Digite seu nome', true);
      if (cpf.replace(/\D/g,'').length < 11) return msg('CPF inválido', true);
      if (nasc.replace(/\D/g,'').length < 8) return msg('Data de nascimento inválida', true);
      if (telefone.replace(/\D/g,'').length < 10) return msg('Telefone inválido', true);
      if (!email.includes('@')) return msg('E-mail inválido', true);
      if (senha.length < 6) return msg('Senha muito curta', true);
      setStep(2);
    } else if (step === 2) {
      if (!cnhOk || !crlvOk) return msg('Envie a CNH e o CRLV', true);
      setStep(3);
    } else {
      await cadastrar();
    }
  };

  const cadastrar = async () => {
    setLoading(true);
    try {
      const res = await authApi.cadastrar({
        nome, telefone: telefone.replace(/\D/g,''),
        email, senha,
        cpf: cpf.replace(/\D/g,''),
        data_nascimento: nasc,
      });
      if (res.ok) {
        // Upload dos documentos
        if (cnhUri) {
          const f = new FormData();
          f.append('file', { uri: cnhUri, name: 'cnh.jpg', type: 'image/jpeg' } as any);
          f.append('tipo', 'cnh');
          await authApi.uploadDoc(f);
        }
        if (crlvUri) {
          const f = new FormData();
          f.append('file', { uri: crlvUri, name: 'crlv.jpg', type: 'image/jpeg' } as any);
          f.append('tipo', 'crlv');
          await authApi.uploadDoc(f);
        }
        setMotorista(res.motorista ?? null);
        router.replace('/(auth)/face');
      } else {
        msg(res.msg || 'Erro ao cadastrar', true);
      }
    } catch { msg('Sem conexão com o servidor', true); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step-1) : router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar conta</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          <StepBar current={step} total={3} />
          <View style={{ height: 24 }} />

          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Seus dados</Text>
              <Text style={styles.stepSub}>Preencha suas informações</Text>
              <View style={{ height: 20 }} />
              <Input label="Nome completo" placeholder="Seu nome"
                value={nome} onChangeText={setNome}
                leftIcon={<Ionicons name="person-outline" size={18}
                  color={Colors.grey} />} />
              <Input label="CPF" placeholder="000.000.000-00"
                value={cpf} onChangeText={setCpf}
                keyboardType="numeric" maxLength={14}
                leftIcon={<Ionicons name="card-outline" size={18}
                  color={Colors.grey} />} />
              <Input label="Data de nascimento" placeholder="DD/MM/AAAA"
                value={nasc} onChangeText={setNasc}
                keyboardType="numeric" maxLength={10}
                leftIcon={<Ionicons name="gift-outline" size={18}
                  color={Colors.grey} />} />
              <Input label="Telefone" placeholder="(47) 99999-9999"
                value={telefone} onChangeText={setTelefone}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18}
                  color={Colors.grey} />} />
              <Input label="E-mail" placeholder="seu@email.com"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18}
                  color={Colors.grey} />} />
              <Input label="Senha" placeholder="Mínimo 6 caracteres"
                value={senha} onChangeText={setSenha}
                secureTextEntry={!showPass}
                leftIcon={<Ionicons name="lock-closed-outline" size={18}
                  color={Colors.grey} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color={Colors.grey} />
                  </TouchableOpacity>} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Documentos</Text>
              <Text style={styles.stepSub}>Envie os documentos obrigatórios</Text>
              <View style={{ height: 20 }} />
              {(['cnh','crlv'] as const).map(doc => (
                <DocCard key={doc}
                  title={doc === 'cnh' ? 'CNH com EAR' : 'CRLV do veículo'}
                  sub={doc === 'cnh'
                    ? 'Carteira Nacional de Habilitação'
                    : 'Certificado de Registro e Licenciamento'}
                  done={doc === 'cnh' ? cnhOk : crlvOk}
                  onPick={() => pickDoc(doc)}
                />
              ))}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16}
                  color={Colors.primary} />
                <Text style={styles.infoText}>
                  Documentos analisados em até 48h após o envio.
                </Text>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Revisar</Text>
              <Text style={styles.stepSub}>Confira seus dados</Text>
              <View style={{ height: 20 }} />
              <Card style={{ padding: 16 }}>
                {[
                  ['Nome', nome], ['CPF', cpf], ['Nascimento', nasc],
                  ['Telefone', telefone], ['E-mail', email],
                  ['CNH', cnhOk ? '✅ Enviada' : '—'],
                  ['CRLV', crlvOk ? '✅ Enviado' : '—'],
                ].map(([l, v], i, arr) => (
                  <View key={l}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{l}</Text>
                      <Text style={styles.reviewValue}>{v}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={styles.reviewDiv} />
                    )}
                  </View>
                ))}
              </Card>
              <View style={styles.termsBox}>
                <Ionicons name="checkmark-circle-outline" size={18}
                  color={Colors.success} />
                <Text style={styles.termsText}>
                  Ao criar a conta você concorda com os Termos de Uso
                  e Política de Privacidade.
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
          <Button label={step < 3 ? 'Continuar' : 'Criar conta'}
            onPress={next} loading={loading} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SnackBar message={snack} visible={!!snack}
        type={snackErr ? 'error' : 'success'} />
    </SafeAreaView>
  );
}

function DocCard({ title, sub, done, onPick }: {
  title: string; sub: string; done: boolean; onPick: () => void;
}) {
  return (
    <View style={docStyles.card}>
      <View style={[docStyles.icon,
        { backgroundColor: done ? Colors.successSoft : Colors.primarySoft }]}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'document-outline'}
          size={22}
          color={done ? Colors.success : Colors.primary}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={docStyles.title}>{title}</Text>
        <Text style={docStyles.sub}>{sub}</Text>
      </View>
      {done ? (
        <View style={docStyles.doneBadge}>
          <Text style={docStyles.doneText}>Enviado</Text>
        </View>
      ) : (
        <TouchableOpacity style={docStyles.btn} onPress={onPick}>
          <Text style={docStyles.btnText}>Anexar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const docStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, marginBottom: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  icon: { width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.md, fontWeight: '700', color: Colors.dark },
  sub: { fontSize: 11, color: Colors.grey, marginTop: 2 },
  doneBadge: {
    backgroundColor: Colors.success, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  doneText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  btnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.dark },
  scroll: { padding: Spacing.xl },
  stepTitle: { fontSize: Typography['3xl'], fontWeight: '800',
    color: Colors.dark, letterSpacing: -0.5 },
  stepSub: { fontSize: Typography.base, color: Colors.grey, marginTop: 4 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: 12,
    padding: 14, gap: 10, marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.primaryDark, lineHeight: 18 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10 },
  reviewLabel: { fontSize: 13, color: Colors.grey },
  reviewValue: { fontSize: 13, fontWeight: '600', color: Colors.dark },
  reviewDiv: { height: 1, backgroundColor: Colors.border },
  termsBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.successSoft, borderRadius: 12,
    padding: 14, gap: 10, marginTop: 16,
  },
  termsText: { flex: 1, fontSize: 12, color: Colors.success, lineHeight: 18 },
});