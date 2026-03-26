import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { corridasApi, type Corrida } from '../../src/services/api';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../src/theme';
import { Loading } from '../../src/components/ui';

type Tab = 'todas' | 'concluidas' | 'canceladas';

export default function HistoricoScreen() {
  const [corridas,   setCorridas]   = useState<Corrida[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<Tab>('todas');

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const list = await corridasApi.listar();
    setCorridas(list);
    setLoading(false);
    setRefreshing(false);
  };

  const filtradas = corridas.filter(c => {
    if (tab === 'concluidas') return c.status === 'concluida';
    if (tab === 'canceladas') return c.status === 'cancelada';
    return true;
  });

  const concluidas  = corridas.filter(c => c.status === 'concluida');
  const totalBruto  = concluidas.reduce((s, c) => s + Number(c.valor), 0);
  const totalLiq    = totalBruto * 0.85;

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Corridas</Text>
      </View>

      {/* Resumo */}
      <View style={styles.resumo}>
        <ResumoItem icon="car-outline" color={Colors.primary}
          label="Total" value={String(concluidas.length)} />
        <View style={styles.sep} />
        <ResumoItem icon="cash-outline" color={Colors.success}
          label="Bruto" value={`R$${totalBruto.toFixed(2)}`} />
        <View style={styles.sep} />
        <ResumoItem icon="wallet-outline" color={Colors.pix}
          label="Líquido" value={`R$${totalLiq.toFixed(2)}`} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          ['todas',      `Todas (${corridas.length})`],
          ['concluidas', `Concluídas (${concluidas.length})`],
          ['canceladas', `Canceladas (${corridas.filter(c=>c.status==='cancelada').length})`],
        ] as [Tab, string][]).map(([t, label]) => (
          <TouchableOpacity key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtradas}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.primary} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={60}
              color={Colors.grey + '60'} />
            <Text style={styles.emptyText}>Nenhuma corrida aqui</Text>
          </View>
        )}
        renderItem={({ item }) => <CorridaCard corrida={item} />}
      />
    </SafeAreaView>
  );
}

function CorridaCard({ corrida: c }: { corrida: Corrida }) {
  const ok     = c.status === 'concluida';
  const valor  = Number(c.valor);
  const liq    = valor * 0.85;
  const isPix  = c.metodo_pagamento?.toLowerCase() === 'pix';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon,
          { backgroundColor: ok ? Colors.successSoft : Colors.dangerSoft }]}>
          <Ionicons
            name={ok ? 'checkmark' : 'close'}
            size={16}
            color={ok ? Colors.success : Colors.danger}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.clientName}>{c.cliente_nome}</Text>
          <Text style={styles.cardDate}>{fmtDate(c.criado_em)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardValor}>R${valor.toFixed(2)}</Text>
          <Text style={styles.cardLiq}>Líq: R${liq.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Endereços */}
      <AddrLine icon="cube-outline" color={Colors.success}
        label="Coleta" value={c.coleta} />
      <View style={{ height: 6 }} />
      <AddrLine icon="location-outline" color={Colors.danger}
        label="Entrega" value={c.entrega} />

      <View style={styles.divider} />

      {/* Rodapé */}
      <View style={styles.cardFoot}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={13} color={Colors.grey} />
          <Text style={styles.statText}>{c.distancia_km} km</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={13} color={Colors.grey} />
          <Text style={styles.statText}>{c.duracao_min} min</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.payChip,
          { backgroundColor: isPix ? Colors.pix + '18' : Colors.success + '18' }]}>
          <Ionicons
            name={isPix ? 'qr-code-outline' : 'cash-outline'}
            size={11}
            color={isPix ? Colors.pix : Colors.success}
          />
          <Text style={[styles.payChipText,
            { color: isPix ? Colors.pix : Colors.success }]}>
            {isPix ? 'PIX' : 'Dinheiro'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function AddrLine({ icon, color, label, value }: {
  icon: any; color: string; label: string; value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={12} color={color} style={{ marginTop: 2 }} />
      <View style={{ marginLeft: 7, flex: 1 }}>
        <Text style={{ fontSize: 9, color: Colors.grey,
          fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: Colors.dark, fontWeight: '500' }}
          numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ResumoItem({ icon, color, label, value }: {
  icon: any; color: string; label: string; value: string;
}) {
  return (
    <View style={styles.resumoItem}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.resumoValue, { color }]}>{value}</Text>
      <Text style={styles.resumoLabel}>{label}</Text>
    </View>
  );
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${
      (d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ` +
      `${d.getHours().toString().padStart(2,'0')}:${
      d.getMinutes().toString().padStart(2,'0')}`;
  } catch { return iso; }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.greyLight },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.dark },
  resumo: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingVertical: 14, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resumoItem: { flex: 1, alignItems: 'center', gap: 4 },
  resumoValue: { fontSize: 13, fontWeight: '800' },
  resumoLabel: { fontSize: 10, color: Colors.grey },
  sep: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: Typography.xs, color: Colors.grey, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  list: { padding: Spacing.md, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: Typography.lg, color: Colors.grey, fontWeight: '600' },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  clientName: { fontSize: Typography.md, fontWeight: '700', color: Colors.dark },
  cardDate: { fontSize: Typography.xs, color: Colors.grey, marginTop: 1 },
  cardValor: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  cardLiq: { fontSize: 11, color: Colors.grey, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: Colors.dark },
  payChip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, gap: 4,
  },
  payChipText: { fontSize: 10, fontWeight: '700' },
});