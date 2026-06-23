import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../src/theme';
import { Loading } from '../../src/components/ui';

export default function PerfilScreen() {
  const router    = useRouter();
  const motorista = useAuth((s) => s.motorista);
  const logout    = useAuth((s) => s.logout);
  const refresh   = useAuth((s) => s.refresh);

  const [uploading, setUploading] = useState<string | null>(null);

  if (!motorista) return <Loading />;

  const initials = motorista.nome?.[0]?.toUpperCase() ?? 'M';

  const pickAndUpload = async (tipo: 'foto' | 'cnh' | 'crlv' | 'face') => {
    const src = tipo === 'face' ? ImagePicker.MediaTypeOptions.Images
      : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: src, quality: 0.8,
      allowsEditing: tipo === 'foto',
      aspect: tipo === 'foto' ? [1,1] : undefined,
    });
    if (result.canceled) return;

    setUploading(tipo);
    const form = new FormData();
    const uri  = result.assets[0].uri;
    const file = { uri, name: `${tipo}.jpg`, type: 'image/jpeg' } as any;

    try {
      if (tipo === 'foto') {
        form.append('foto', file);
        await authApi.uploadFoto(form);
      } else if (tipo === 'face') {
        form.append('face', file);
        await authApi.face(form);
      } else {
        form.append('file', file);
        form.append('tipo', tipo);
        await authApi.uploadDoc(form);
      }
      await refresh();
    } catch {}
    setUploading(null);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const docStatus = (s: string) => ({
    aprovado:  { color: Colors.success, bg: Colors.successSoft, label: 'Aprovado' },
    reprovado: { color: Colors.danger,  bg: Colors.dangerSoft,  label: 'Reprovado' },
    pendente:  { color: Colors.primary, bg: Colors.primarySoft, label: 'Em análise' },
  }[s] ?? { color: Colors.grey, bg: Colors.greyLight, label: s });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => pickAndUpload('foto')}
            style={styles.avatarWrap}>
            {motorista.foto_url ? (
              <Image source={{ uri: motorista.foto_url }}
                style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{motorista.nome}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {' '}{Number(motorista.avaliacao).toFixed(2)}
              {'  '}·{'  '}
              {motorista.total_corridas} corridas
            </Text>
          </View>
        </View>

        {/* Dados */}
        <SectionTitle title="Dados pessoais" />
        <View style={styles.card}>
          {[
            ['person-outline', 'Nome',       motorista.nome],
            ['card-outline',   'CPF',         motorista.cpf ?? '—'],
            ['gift-outline',   'Nascimento',  motorista.data_nascimento?.slice(0,10) ?? '—'],
            ['call-outline',   'Telefone',    motorista.telefone],
            ['mail-outline',   'E-mail',      motorista.email],
          ].map(([icon, label, value], i, arr) => (
            <View key={label}>
              <InfoRow icon={icon as any} label={label} value={value} />
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Documentos */}
        <SectionTitle title="Documentos" />
        <View style={styles.docsGrid}>
          {(['cnh','crlv'] as const).map(doc => {
            const st = docStatus((motorista as any)[`${doc}_status`] ?? 'pendente');
            return (
              <View key={doc} style={styles.docCard}>
                <View style={styles.docTop}>
                  <Text style={styles.docTitle}>{doc.toUpperCase()}</Text>
                  <View style={[styles.docBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.docBadgeText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.docBtn,
                    uploading === doc && { opacity: 0.6 }]}
                  onPress={() => pickAndUpload(doc)}
                  disabled={uploading === doc}>
                  <Ionicons name="cloud-upload-outline" size={16}
                    color={Colors.primary} />
                  <Text style={styles.docBtnText}>
                    {uploading === doc ? 'Enviando...' : 'Enviar documento'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Verificações */}
        <SectionTitle title="Verificações" />
        <View style={styles.card}>
          <InfoRow icon="scan-outline" label="Face"
            value={motorista.face_ok ? '✅ Verificada' : '⏳ Pendente'} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={secStyles.title}>{title}</Text>;
}

function InfoRow({ icon, label, value }: {
  icon: any; label: string; value: string;
}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.grey} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const secStyles = StyleSheet.create({
  title: {
    fontSize: Typography.md, fontWeight: '700', color: Colors.dark,
    paddingHorizontal: Spacing.lg, paddingTop: 16, paddingBottom: 8,
  },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  label: { width: 90, fontSize: Typography.sm, color: Colors.grey },
  value: {
    flex: 1, fontSize: Typography.md, fontWeight: '600',
    color: Colors.dark, textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.greyLight },
  scroll: { paddingBottom: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.lg,
    paddingVertical: 16, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.dark },
  avatarSection: {
    backgroundColor: Colors.white, alignItems: 'center',
    paddingVertical: Spacing.xl, marginBottom: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primarySoft, alignItems: 'center',
    justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary,
  },
  avatarInitial: { fontSize: 38, fontWeight: '900', color: Colors.primary },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
  },
  userName: { fontSize: Typography.xl, fontWeight: '800', color: Colors.dark },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { fontSize: Typography.sm, color: Colors.grey },
  card: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, ...Shadow.sm,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  docsGrid: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 12,
    marginBottom: 4,
  },
  docCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, ...Shadow.sm,
  },
  docTop: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12 },
  docTitle: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  docBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  docBadgeText: { fontSize: 10, fontWeight: '700' },
  docBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primarySoft, borderRadius: Radius.md,
    paddingVertical: 10, gap: 6,
  },
  docBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});