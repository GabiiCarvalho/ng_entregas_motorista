// app/(tabs)/index.tsx — Mapa 100% tela com corridas e tracking
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, ScrollView, Modal,
} from 'react-native';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  authApi, ganhosApi, pedidosDisponiveisApi,
  type GanhoDiario,
} from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Shadow, Spacing, Typography, Radius } from '../../src/theme';
import { SnackBar } from '../../src/components/ui';
import ActiveRidePanel from '../../src/components/ActiveRidePanel';

export default function MapScreen() {
  const router    = useRouter();
  const motorista = useAuth((s) => s.motorista);
  const refresh   = useAuth((s) => s.refresh);
  const mapRef    = useRef<MapView>(null);

  const [location,  setLocation]  = useState<Location.LocationObject | null>(null);
  const [online,    setOnline]    = useState(false);
  const [ganho,     setGanho]     = useState<GanhoDiario | null>(null);
  const [pedidos,   setPedidos]   = useState<any[]>([]);
  const [showEarn,  setShowEarn]  = useState(true);
  const [rideModal, setRideModal] = useState<any | null>(null);
  const [snack,     setSnack]     = useState('');
  const [snackErr,  setSnackErr]  = useState(false);
  const [accepting, setAccepting] = useState(false);

  const locInterval = useRef<ReturnType<typeof setInterval>>();
  const ridePollInterval = useRef<ReturnType<typeof setInterval>>();

  const msg = (m: string, err = false) => {
    setSnack(m); setSnackErr(err);
    setTimeout(() => setSnack(''), 3000);
  };

  // Localização em tempo real
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High });
      setLocation(loc);
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (l) => {
          setLocation(l);
          if (online) {
            authApi.atualizarLocalizacao(
              l.coords.latitude, l.coords.longitude, true).catch(() => {});
          }
        }
      );
    })();
  }, []);

  // Centraliza quando localização muda
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude:  location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta:  0.01,
        longitudeDelta: 0.01,
      }, 600);
    }
  }, [location?.coords.latitude]);

  // Carrega ganhos ao focar
  useFocusEffect(useCallback(() => {
    loadGanhos();
    if (online) startPolling();
    return () => stopPolling();
  }, [online]));

  const loadGanhos = async () => {
    const g = await ganhosApi.hoje();
    setGanho(g);
  };

  const startPolling = () => {
    ridePollInterval.current = setInterval(async () => {
      const list = await pedidosDisponiveisApi.listar();
      if (list.length > 0 && !rideModal) {
        setRideModal(list[0]);
      }
    }, 8000);
  };

  const stopPolling = () => {
    clearInterval(ridePollInterval.current);
  };

  const toggleOnline = async () => {
    const newStatus = !online;
    setOnline(newStatus);
    if (location) {
      await authApi.atualizarLocalizacao(
        location.coords.latitude,
        location.coords.longitude,
        newStatus
      );
    }
    if (newStatus) {
      startPolling();
      msg('Você está online! Aguardando corridas... 🟢');
    } else {
      stopPolling();
      msg('Você ficou offline.');
    }
  };

  const handleAccept = async () => {
    if (!rideModal) return;
    setAccepting(true);
    const res = await pedidosDisponiveisApi.aceitar(rideModal.id);
    setAccepting(false);
    if (res.ok) {
      // Guarda o pedido ativo e exibe o painel
      setPedidoAtivo({ ...rideModal, status: 'aceito' });
      setRideModal(null);
      stopPolling();
      msg('Corrida aceita! Vá até o endereço de coleta. 🚀');
      loadGanhos();
    } else {
      msg(res.msg || 'Erro ao aceitar', true);
    }
  };

  const handleStatusUpdate = (novoStatus: string) => {
    if (pedidoAtivo) {
      setPedidoAtivo({ ...pedidoAtivo, status: novoStatus });
    }
  };

  const handleFinalizado = () => {
    setPedidoAtivo(null);
    setOnline(true);
    startPolling();
    loadGanhos();
    msg('Entrega finalizada! Ótimo trabalho 🎉');
  };

  const nome      = motorista?.nome?.split(' ')[0] ?? 'Motorista';
  const initials  = motorista?.nome?.[0]?.toUpperCase() ?? 'M';
  const net       = (ganho?.liquido ?? 0);
  const debit     = (ganho?.taxa_app ?? 0) >= 125.35;

  return (
    <View style={{ flex: 1 }}>

      {/* ── MAPA ────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude:  location?.coords.latitude  ?? -23.5505,
          longitude: location?.coords.longitude ?? -46.6333,
          latitudeDelta:  0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="none"
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19} flipY={false}
        />
        {location && (
          <>
            <Circle
              center={{
                latitude:  location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={50}
              fillColor="rgba(255,107,0,0.1)"
              strokeColor="rgba(255,107,0,0.4)"
              strokeWidth={1.5}
            />
            <Marker
              coordinate={{
                latitude:  location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.myPin,
                online && { backgroundColor: Colors.success }]} />
            </Marker>
          </>
        )}
      </MapView>

      {/* ── TOPBAR ──────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          style={styles.avatarRow}
          onPress={() => router.push('/(tabs)/perfil')}
          activeOpacity={0.85}
        >
          {motorista?.foto_url ? (
            <Image source={{ uri: motorista.foto_url }}
              style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.greetText}>{nome}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {' '}{Number(motorista?.avaliacao ?? 5).toFixed(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Alerta taxa */}
        {debit && (
          <TouchableOpacity style={styles.taxAlert}
            onPress={async () => {
              await ganhosApi.pagarTaxa();
              loadGanhos();
              msg('Taxa paga! ✅');
            }}>
            <Ionicons name="warning" size={14} color={Colors.white} />
            <Text style={styles.taxText}>
              R${(ganho?.taxa_app ?? 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Dashboard */}
        <TouchableOpacity style={styles.iconBtn}
          onPress={() => router.push('/(tabs)/dashboard')}>
          <Ionicons name="bar-chart" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── GANHOS ──────────────────────── */}
      {online && showEarn && (
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Ganhos hoje</Text>
          <Text style={styles.earningsValue}>R${net.toFixed(2)}</Text>
          <Text style={styles.earningsSub}>
            {ganho?.num_corridas ?? 0} corridas
          </Text>
        </View>
      )}

      {/* ── FABs ────────────────────────── */}
      <View style={styles.fabs}>
        {online && (
          <TouchableOpacity style={styles.fab}
            onPress={() => setShowEarn(v => !v)}>
            <Ionicons
              name={showEarn ? 'eye-off-outline' : 'cash-outline'}
              size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <View style={{ height: 10 }} />
        <TouchableOpacity style={styles.fab}
          onPress={() => {
            if (location) {
              mapRef.current?.animateToRegion({
                latitude:  location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta:  0.01,
                longitudeDelta: 0.01,
              }, 600);
            }
          }}>
          <Ionicons name="locate" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>


      {/* ── PAINEL CORRIDA ATIVA (quando tem corrida) ── */}
      {pedidoAtivo ? (
        <ActiveRidePanel
          pedido={pedidoAtivo}
          onStatusUpdate={handleStatusUpdate}
          onFinalizado={handleFinalizado}
        />
      ) : (
        /* ── BOTÃO ONLINE / OFFLINE (quando livre) ── */
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.onlineBtn,
              { backgroundColor: online ? Colors.danger : Colors.success }]}
            onPress={toggleOnline}
            activeOpacity={0.88}
          >
            <Ionicons
              name={online ? 'power' : 'wifi'}
              size={20} color={Colors.white} />
            <Text style={styles.onlineBtnText}>
              {online ? 'Ficar offline' : 'Ficar online'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ── MODAL CORRIDA DISPONÍVEL ─────── */}
      <Modal visible={!!rideModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {rideModal && <RideCard
              ride={rideModal}
              accepting={accepting}
              onAccept={handleAccept}
              onReject={() => setRideModal(null)}
            />}
          </View>
        </View>
      </Modal>

      <SnackBar message={snack} visible={!!snack}
        type={snackErr ? 'error' : 'success'} />
    </View>
  );
}

// ── Card da corrida ───────────────────────────
function RideCard({ ride, accepting, onAccept, onReject }: {
  ride: any; accepting: boolean;
  onAccept: () => void; onReject: () => void;
}) {
  const [pag, setPag] = useState<'pix'|'dinheiro'>('pix');

  return (
    <View>
      {/* Cliente */}
      <View style={rideStyles.clientRow}>
        <View style={rideStyles.avatar}>
          <Text style={rideStyles.avatarText}>
            {(ride.usuario_nome ?? 'C')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={rideStyles.clientName}>
            {ride.usuario_nome ?? 'Cliente'}
          </Text>
          <View style={rideStyles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={rideStyles.ratingText}> 5.0</Text>
          </View>
        </View>
        <View style={rideStyles.valorBox}>
          <Text style={rideStyles.valor}>
            R${Number(ride.valor ?? 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={rideStyles.divider} />

      {/* Endereços */}
      <AddrLine icon="cube-outline" color={Colors.success}
        label="Coleta" value={ride.coleta} />
      <View style={{ height: 8 }} />
      <AddrLine icon="location-outline" color={Colors.danger}
        label="Entrega" value={ride.entrega} />

      <View style={rideStyles.divider} />

      {/* Pagamento */}
      <Text style={rideStyles.payLabel}>Pagamento do cliente</Text>
      <View style={rideStyles.payRow}>
        {(['pix','dinheiro'] as const).map(p => (
          <TouchableOpacity key={p}
            style={[rideStyles.payOpt,
              pag === p && { borderColor: p === 'pix' ? Colors.pix : Colors.success,
                backgroundColor: (p === 'pix' ? Colors.pix : Colors.success) + '15' }]}
            onPress={() => setPag(p)}>
            <Ionicons
              name={p === 'pix' ? 'qr-code-outline' : 'cash-outline'}
              size={14}
              color={pag === p ? (p === 'pix' ? Colors.pix : Colors.success)
                : Colors.grey}
            />
            <Text style={[rideStyles.payOptText,
              pag === p && { color: p === 'pix' ? Colors.pix : Colors.success }]}>
              {p === 'pix' ? 'PIX' : 'Dinheiro'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={rideStyles.divider} />

      {/* Botões */}
      <View style={rideStyles.btns}>
        <TouchableOpacity style={rideStyles.rejectBtn} onPress={onReject}>
          <Text style={rideStyles.rejectText}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rideStyles.acceptBtn,
          accepting && { opacity: 0.6 }]}
          onPress={onAccept} disabled={accepting}>
          <Text style={rideStyles.acceptText}>
            {accepting ? 'Aceitando...' : 'Aceitar corrida'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddrLine({ icon, color, label, value }: {
  icon: any; color: string; label: string; value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={13} color={color} style={{ marginTop: 2 }} />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={{ fontSize: 10, color: Colors.grey, fontWeight: '700',
          textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.dark }}
          numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 50,
    paddingVertical: 7, paddingHorizontal: 10, ...Shadow.md,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  greetText: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 11, color: Colors.grey },
  taxAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.danger, borderRadius: 50,
    paddingVertical: 8, paddingHorizontal: 12, gap: 4, ...Shadow.sm,
  },
  taxText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: 'center',
    justifyContent: 'center', ...Shadow.md,
  },
  myPin: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3, borderColor: Colors.white,
  },
  earningsBox: {
    position: 'absolute', top: 100, right: Spacing.lg,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, alignItems: 'flex-end', ...Shadow.md,
  },
  earningsLabel: { fontSize: 10, color: Colors.grey },
  earningsValue: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  earningsSub: { fontSize: 10, color: Colors.grey },
  fabs: {
    position: 'absolute', right: Spacing.lg, bottom: 120,
  },
  fab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white, alignItems: 'center',
    justifyContent: 'center', ...Shadow.md,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  onlineBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 8,
  },
  onlineBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, ...Shadow.lg,
  },
});

const rideStyles = StyleSheet.create({
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },
  clientName: { fontWeight: '700', fontSize: 15, color: Colors.dark },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontSize: 12, color: Colors.grey },
  valorBox: {
    backgroundColor: Colors.success, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  valor: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  payLabel: { fontSize: 11, color: Colors.grey, fontWeight: '600',
    marginBottom: 8 },
  payRow: { flexDirection: 'row', gap: 10 },
  payOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
    borderRadius: Radius.md, backgroundColor: Colors.greyLight,
    borderWidth: 2, borderColor: 'transparent', gap: 6,
  },
  payOptText: { fontSize: 12, fontWeight: '700', color: Colors.grey },
  btns: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.danger,
    alignItems: 'center',
  },
  rejectText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
  acceptBtn: {
    flex: 2, paddingVertical: 13, borderRadius: Radius.md,
    backgroundColor: Colors.success, alignItems: 'center',
  },
  acceptText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});