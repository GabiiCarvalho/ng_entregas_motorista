// src/components/ActiveRidePanel.tsx
// Fluxo completo da corrida:
//
//  aceito
//    └─► [Cheguei na coleta]
//  coletando                     ← contador de espera rodando
//    └─► [Coletado ✅]
//  em_rota
//    └─► [>>>>  Deslize para finalizar entrega  >>>>]
//  entregue  ✅

import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadow, Radius } from '../theme';
import SlideToConfirm from './SlideToConfirm';
import { pedidosDisponiveisApi } from '../services/api';

interface Pedido {
  id: number;
  usuario_nome?: string;
  coleta: string;
  entrega: string;
  valor: number;
  forma_pagamento?: string;
  status: string;
}

interface Props {
  pedido: Pedido;
  onStatusUpdate: (novoStatus: string) => void;
  onFinalizado: () => void;
}

// ─────────────────────────────────────────────
// Config visual de cada status
// ─────────────────────────────────────────────
const STATUS_CFG: Record<string, {
  label: string; sub: string; color: string; icon: any; step: number;
}> = {
  aceito: {
    label: 'A caminho da coleta',
    sub:   'Dirija até o endereço de coleta',
    color: Colors.primary,
    icon:  'bicycle-outline',
    step:  1,
  },
  coletando: {
    label: 'Aguardando coleta',
    sub:   'Você chegou — aguarde o item ser entregue a você',
    color: Colors.warning,
    icon:  'timer-outline',
    step:  2,
  },
  em_rota: {
    label: 'A caminho da entrega',
    sub:   'Dirija até o endereço de entrega',
    color: Colors.success,
    icon:  'car-outline',
    step:  3,
  },
};

export default function ActiveRidePanel({
  pedido, onStatusUpdate, onFinalizado,
}: Props) {
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const cfg      = STATUS_CFG[pedido.status] ?? STATUS_CFG.aceito;
  const isPix    = pedido.forma_pagamento?.toLowerCase() === 'pix';
  const isEmRota = pedido.status === 'em_rota';

  const toggleExpand = () => {
    Animated.spring(slideAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false, friction: 8,
    }).start();
    setExpanded(!expanded);
  };

  // ── Atualiza status no backend ────────────
  const handleStatus = async (novoStatus: string) => {
    setLoading(true);
    try {
      const r = await pedidosDisponiveisApi.atualizarStatus(
        pedido.id, novoStatus);
      if (r.ok) {
        // Avisa sobre adicional de espera se houver
        if (r.adicional_espera > 0) {
          Alert.alert(
            '⏱️  Tempo de espera',
            `Adicional cobrado: R$${Number(r.adicional_espera).toFixed(2)}\n` +
            `Valor total do pedido: R$${Number(r.valor_total).toFixed(2)}`,
            [{ text: 'Entendido', style: 'default' }]
          );
        }
        onStatusUpdate(novoStatus);
      } else {
        Alert.alert('Erro', r.msg || 'Não foi possível atualizar o status.');
      }
    } catch {
      Alert.alert('Erro', 'Sem conexão com o servidor.');
    }
    setLoading(false);
  };

  const handleFinalizar = async () => {
    await pedidosDisponiveisApi.atualizarStatus(pedido.id, 'entregue');
    onFinalizado();
  };

  // Altura do painel (expandido/colapsado)
  const PANEL_H_EXPANDED = isEmRota ? 380 : 310;
  const panelH = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_H_EXPANDED, 76],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[s.panel, { height: panelH }]}>

      {/* Handle */}
      <TouchableOpacity style={s.handleArea} onPress={toggleExpand}
        activeOpacity={0.7}>
        <View style={s.handleBar} />
      </TouchableOpacity>

      {/* ── Cabeçalho — sempre visível ────── */}
      <View style={s.header}>
        <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[s.headerLabel, { color: cfg.color }]}>
            {cfg.label}
          </Text>
          <Text style={s.headerSub} numberOfLines={1}>
            {isEmRota ? pedido.entrega : pedido.coleta}
          </Text>
        </View>
        <View style={[s.valorBadge,
          { backgroundColor: isPix
              ? Colors.pix + '18'
              : Colors.success + '18' }]}>
          <Text style={[s.valorText,
            { color: isPix ? Colors.pix : Colors.success }]}>
            R${Number(pedido.valor).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* ── Conteúdo expandido ────────────── */}
      {expanded && (
        <View style={s.body}>

          {/* StepBar — 3 passos */}
          <StepIndicator step={cfg.step} />

          {/* Endereços */}
          <View style={s.addrCard}>
            <AddrRow
              icon="cube-outline"
              color={Colors.success}
              label="Coleta"
              value={pedido.coleta}
              active={pedido.status !== 'em_rota'}
              done={pedido.status === 'em_rota'}
            />
            <View style={s.addrDivider} />
            <AddrRow
              icon="location-outline"
              color={Colors.danger}
              label="Entrega"
              value={pedido.entrega}
              active={pedido.status === 'em_rota'}
              done={false}
            />
          </View>

          {/* Pagamento */}
          <View style={s.payRow}>
            <Ionicons
              name={isPix ? 'qr-code-outline' : 'cash-outline'}
              size={14}
              color={isPix ? Colors.pix : Colors.success}
            />
            <Text style={[s.payLabel,
              { color: isPix ? Colors.pix : Colors.success }]}>
              {isPix ? 'PIX' : 'Dinheiro'}
            </Text>
            <Text style={s.payNote}>
              {isPix
                ? '— Pré-pago pelo app'
                : '— Cobrar do cliente na entrega'}
            </Text>
          </View>

          <View style={s.divider} />

          {/* ── PASSO 1 → 2: Cheguei na coleta ── */}
          {pedido.status === 'aceito' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: Colors.primary },
                loading && { opacity: 0.6 }]}
              onPress={() => handleStatus('coletando')}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={20} color={Colors.white} />
              <Text style={s.actionBtnText}>
                {loading ? 'Atualizando...' : 'Cheguei na coleta'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ── PASSO 2 → 3: Coletado ── */}
          {pedido.status === 'coletando' && (
            <View style={s.coletandoWrap}>
              <View style={s.waitingBadge}>
                <Ionicons name="timer-outline" size={14}
                  color={Colors.warning} />
                <Text style={s.waitingText}>
                  Aguardando — tempo de espera em contagem
                </Text>
              </View>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: Colors.success },
                  loading && { opacity: 0.6 }]}
                onPress={() => handleStatus('em_rota')}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={22}
                  color={Colors.white} />
                <Text style={s.actionBtnText}>
                  {loading ? 'Confirmando...' : 'Coletado ✅'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PASSO 3: Deslize para finalizar ── */}
          {isEmRota && (
            <SlideToConfirm
              label="Deslize para finalizar entrega"
              sublabel="Confirme que o pedido foi entregue ao cliente"
              onConfirm={handleFinalizar}
              color={Colors.success}
              icon="checkmark"
              loading={loading}
            />
          )}

        </View>
      )}
    </Animated.View>
  );
}

// ── Step indicator ─────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: 'A caminho' },
    { n: 2, label: 'Coletando' },
    { n: 3, label: 'Entregando' },
  ];
  return (
    <View style={stepS.wrap}>
      {steps.map((st, i) => {
        const done    = step > st.n;
        const current = step === st.n;
        return (
          <View key={st.n} style={stepS.item}>
            <View style={[
              stepS.circle,
              done    && { backgroundColor: Colors.success, borderColor: Colors.success },
              current && { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
            ]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              ) : (
                <Text style={[stepS.num,
                  current && { color: Colors.primary }]}>{st.n}</Text>
              )}
            </View>
            <Text style={[stepS.label,
              done    && { color: Colors.success },
              current && { color: Colors.primary, fontWeight: '700' },
            ]}>{st.label}</Text>
            {i < steps.length - 1 && (
              <View style={[stepS.line,
                done && { backgroundColor: Colors.success }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── AddrRow ────────────────────────────────────
function AddrRow({ icon, color, label, value, active, done }: {
  icon: any; color: string; label: string;
  value: string; active: boolean; done: boolean;
}) {
  return (
    <View style={[addrS.row, active && { backgroundColor: Colors.greyLight }]}>
      <View style={[addrS.dot, {
        backgroundColor: done
          ? Colors.success
          : active ? color : Colors.grey + '40',
      }]}>
        {done && (
          <Ionicons name="checkmark" size={8} color={Colors.white} />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[addrS.label, active && { color }]}>{label}</Text>
        <Text style={[addrS.value, !active && !done && { color: Colors.grey }]}
          numberOfLines={2}>{value}</Text>
      </View>
      {active && (
        <Ionicons name="navigate-circle" size={24} color={color} />
      )}
      {done && (
        <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
      )}
    </View>
  );
}

const stepS = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  num: {
    fontSize: 11, fontWeight: '700', color: Colors.grey,
  },
  label: {
    fontSize: 10, color: Colors.grey, fontWeight: '500',
    marginRight: 4,
  },
  line: {
    width: 24, height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
});

const addrS = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: Radius.md,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    marginTop: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontSize: 9, fontWeight: '700', color: Colors.grey,
    textTransform: 'uppercase', marginBottom: 3,
  },
  value: {
    fontSize: 13, fontWeight: '600', color: Colors.dark, lineHeight: 18,
  },
});

const s = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handleBar: {
    width: 40, height: 4,
    backgroundColor: Colors.border, borderRadius: 2,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  headerLabel: { fontSize: Typography.md, fontWeight: '700' },
  headerSub: { fontSize: Typography.xs, color: Colors.grey, marginTop: 1 },
  valorBadge: {
    borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 5,
  },
  valorText: { fontSize: Typography.md, fontWeight: '800' },
  body: { gap: 10 },
  addrCard: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  addrDivider: {
    height: 1, backgroundColor: Colors.border, marginHorizontal: 12,
  },
  payRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 2,
  },
  payLabel: { fontSize: Typography.sm, fontWeight: '800' },
  payNote: { fontSize: Typography.xs, color: Colors.grey },
  divider: { height: 1, backgroundColor: Colors.border },

  // Botão de ação principal
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, borderRadius: Radius.lg, gap: 10,
  },
  actionBtnText: {
    color: Colors.white, fontSize: Typography.lg, fontWeight: '700',
  },

  // Wrapper do estado coletando
  coletandoWrap: { gap: 10 },
  waitingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.md, padding: 10, gap: 7,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  waitingText: {
    fontSize: Typography.xs, color: Colors.warning,
    fontWeight: '600', flex: 1,
  },
});