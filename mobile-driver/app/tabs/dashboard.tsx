import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ganhosApi, saquesApi, type GanhoDiario } from '../../src/services/api';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../src/theme';
import { Card, SnackBar, Divider } from '../../src/components/ui';

const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function DashboardScreen() {
  const router = useRouter();
  const [hoje,      setHoje]      = useState<GanhoDiario | null>(null);
  const [semana,    setSemana]    = useState<GanhoDiario[]>([]);
  const [refreshing,setRefreshing]= useState(false);
  const [snack,     setSnack]     = useState('');
  const [snackErr,  setSnackErr]  = useState(false);
  const [showSaque, setShowSaque] = useState(false);
  const [chavePix,  setChavePix]  = useState('');
  const [valorSaque,setValorSaque]= useState('');
  const [saqLoading,setSaqLoading]= useState(false);

  const msg = (m: string, err = false) => {
    setSnack(m); setSnackErr(err);
    setTimeout(() => setSnack(''), 3000);
  };

  const load = async () => {
    const [h, s] = await Promise.all([
      ganhosApi.hoje(), ganhosApi.semana()]);
    setHoje(h); setSemana(s);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pagarTaxa = async () => {
    await ganhosApi.pagarTaxa();
    await load();
    msg('Taxa paga! Débito zerado. ✅');
  };

  const handleSaque = async () => {
    const v = parseFloat(valorSaque);
    if (!chavePix || isNaN(v) || v < 20)
      return msg('Chave PIX e valor mínimo R$20 obrigatórios', true);
    setSaqLoading(true);
    const r = await saquesApi.solicitar(v, chavePix);
    setSaqLoading(false);
    if (r.ok) {
      msg('Saque solicitado! Prazo: 1-2 dias úteis. ✅');
      setShowSaque(false);
      setChavePix('');
      setValorSaque('');
    } else {
      msg(r.msg || 'Erro ao solicitar saque', true);
    }
  };

  const net    = hoje?.liquido    ?? 0;
  const bruto  = hoje?.bruto      ?? 0;
  const taxa   = hoje?.taxa_app   ?? 0;
  const rides  = hoje?.num_corridas ?? 0;
  const debit  = taxa >= 125.35;
  const maxBar = Math.max(...semana.map(d => d.bruto), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Painel de Ganhos</Text>
          <TouchableOpacity style={styles.histBtn}
            onPress={() => router.push('/(tabs)/historico')}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Card principal */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>Ganhos líquidos hoje</Text>
          <Text style={styles.mainValue}>R${net.toFixed(2)}</Text>
          <View style={styles.mainChips}>
            <Chip label="Bruto" value={`R$${bruto.toFixed(2)}`}
              color="rgba(255,255,255,0.7)" />
            <Chip label="Taxa 15%" value={`-R$${taxa.toFixed(2)}`}
              color="rgba(255,255,255,0.7)" />
            <Chip label="Corridas" value={String(rides)}
              color="rgba(255,255,255,0.7)" />
          </View>
        </View>

        {/* Alerta taxa */}
        {debit && (
          <TouchableOpacity style={styles.taxAlert} onPress={pagarTaxa}>
            <Ionicons name="warning" size={18} color={Colors.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.taxTitle}>Taxa do app pendente</Text>
              <Text style={styles.taxSub}>
                R${taxa.toFixed(2)} — toque para pagar
              </Text>
            </View>
            <Text style={styles.taxBtn}>Pagar</Text>
          </TouchableOpacity>
        )}

        {/* Sacar via PIX */}
        <Card onPress={() => setShowSaque(true)} style={styles.saqueCard}>
          <View style={styles.saqueRow}>
            <View style={styles.saqueIcon}>
              <Ionicons name="qr-code" size={22} color={Colors.pix} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.saqueTitle}>Sacar via PIX</Text>
              <Text style={styles.saqueSub}>
                Saldo: R${net.toFixed(2)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.grey} />
          </View>
        </Card>

        {/* Semana */}
        <Text style={styles.sectionTitle}>Esta semana</Text>
        <Card style={styles.weekCard}>
          {semana.map((d, i) => {
            const date = new Date(d.data);
            const day  = DAYS[date.getDay()];
            const pct  = (d.bruto / maxBar) * 100;
            return (
              <View key={i} style={styles.weekRow}>
                <Text style={styles.weekDay}>{day}</Text>
                <View style={styles.weekBarBg}>
                  <View style={[styles.weekBar, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.weekValue}>
                  R${Number(d.bruto).toFixed(2)}
                </Text>
                <Text style={styles.weekRides}>{d.num_corridas}x</Text>
              </View>
            );
          })}
          {semana.length === 0 && (
            <Text style={{ color: Colors.grey, fontSize: 13,
              textAlign: 'center', padding: 16 }}>
              Nenhum ganho esta semana
            </Text>
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal saque */}
      {showSaque && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sacar via PIX</Text>
            <Text style={styles.modalSub}>
              Saldo disponível: R${net.toFixed(2)}
            </Text>
            <View style={{ height: 16 }} />
            <Text style={styles.inputLabel}>Valor (mínimo R$20)</Text>
            <TextInputSimple
              value={valorSaque}
              onChangeText={setValorSaque}
              placeholder="Ex: 50.00"
              keyboardType="decimal-pad"
            />
            <View style={{ height: 12 }} />
            <Text style={styles.inputLabel}>Chave PIX</Text>
            <TextInputSimple
              value={chavePix}
              onChangeText={setChavePix}
              placeholder="CPF, telefone, e-mail ou aleatória"
            />
            <View style={{ height: 20 }} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => setShowSaque(false)}>
                <Text style={{ color: Colors.grey, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn,
                  saqLoading && { opacity: 0.6 }]}
                onPress={handleSaque} disabled={saqLoading}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>
                  {saqLoading ? 'Solicitando...' : 'Solicitar saque'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SnackBar message={snack} visible={!!snack}
        type={snackErr ? 'error' : 'success'} />
    </SafeAreaView>
  );
}

function Chip({ label, value, color }: {
  label: string; value: string; color: string;
}) {
  return (
    <View style={chipStyles.chip}>
      <Text style={[chipStyles.label, { color }]}>{label}</Text>
      <Text style={chipStyles.value}>{value}</Text>
    </View>
  );
}

import { TextInput } from 'react-native';
function TextInputSimple({ value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <TextInput
      style={tiStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.grey}
      keyboardType={keyboardType}
    />
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md, paddingVertical: 8,
  },
  label: { fontSize: 9, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '800', color: Colors.white, marginTop: 2 },
});

const tiStyles = StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: Colors.dark,
    backgroundColor: Colors.white,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.greyLight },
  scroll: { padding: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.dark },
  histBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: 'center',
    justifyContent: 'center', ...Shadow.sm,
  },
  mainCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: 24, marginBottom: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  mainLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  mainValue: {
    fontSize: 40, fontWeight: '900', color: Colors.white,
    letterSpacing: -1, marginVertical: 8,
  },
  mainChips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  taxAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.lg, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.danger + '40',
  },
  taxTitle: { fontWeight: '700', color: Colors.danger, fontSize: 13 },
  taxSub: { color: Colors.danger, fontSize: 12, marginTop: 1 },
  taxBtn: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  saqueCard: { padding: 16, marginBottom: 20 },
  saqueRow: { flexDirection: 'row', alignItems: 'center' },
  saqueIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.pix + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  saqueTitle: { fontWeight: '700', fontSize: 15, color: Colors.dark },
  saqueSub: { color: Colors.grey, fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.dark, marginBottom: 12,
  },
  weekCard: { padding: 16, gap: 12 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekDay: { width: 30, fontSize: 12, fontWeight: '600', color: Colors.grey },
  weekBarBg: {
    flex: 1, height: 6, backgroundColor: Colors.greyLight,
    borderRadius: 3, overflow: 'hidden',
  },
  weekBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  weekValue: { width: 65, fontSize: 12, fontWeight: '700',
    textAlign: 'right', color: Colors.dark },
  weekRides: { width: 24, fontSize: 11, color: Colors.grey },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', zIndex: 100,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, ...Shadow.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },
  modalSub: { fontSize: 13, color: Colors.grey, marginTop: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark,
    marginBottom: 6 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: Colors.pix, alignItems: 'center',
  },
});