import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Typography, Spacing } from '../../src/theme';

export default function FaceScreen() {
  const router      = useRouter();
  const motorista   = useAuth((s) => s.motorista);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef  = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [verified,  setVerified]  = useState(false);
  const [msg,       setMsg]       = useState('Posicione seu rosto no círculo');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, {
          toValue: 0.94, duration: 900, useNativeDriver: true }),
      ])
    );
    if (capturing) loop.start();
    else { loop.stop(); pulseAnim.setValue(1); }
    return () => loop.stop();
  }, [capturing]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setMsg('Verificando...');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('Falha ao capturar foto');

      const form = new FormData();
      form.append('face', {
        uri: photo.uri, name: 'face.jpg', type: 'image/jpeg'
      } as any);

      const res = await authApi.face(form);
      if (res.ok) {
        setVerified(true);
        setMsg('Identidade confirmada!');
      } else {
        setMsg(res.msg || 'Erro. Tente novamente.');
        setCapturing(false);
      }
    } catch {
      setMsg('Erro na câmera. Tente novamente.');
      setCapturing(false);
    }
  };

  const handleProceed = () => {
    router.replace('/(tabs)');
  };

  const borderColor = verified ? Colors.success
    : capturing ? Colors.primary
    : 'rgba(255,255,255,0.3)';

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Ionicons name="arrow-back-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificação de segurança</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {/* Câmera ou ícone */}
        <Animated.View style={[styles.cameraWrap,
          { borderColor, transform: [{ scale: capturing ? pulseAnim : new Animated.Value(1) }] }]}>
          {permission?.granted && !verified ? (
            <CameraView ref={cameraRef} style={styles.camera}
              facing="front" />
          ) : (
            <View style={[styles.camera, styles.cameraFallback]}>
              <Ionicons
                name={verified ? 'checkmark-circle' : 'scan-outline'}
                size={90}
                color={verified ? Colors.success : 'rgba(255,255,255,0.5)'}
              />
            </View>
          )}
        </Animated.View>

        <Text style={styles.msgText}>
          {verified ? '✅  Identidade confirmada!' : msg}
        </Text>
        <Text style={styles.subText}>
          {verified
            ? `Bem-vindo, ${motorista?.nome?.split(' ')[0] ?? 'motorista'}!`
            : 'Olhe diretamente para a câmera com os olhos abertos'}
        </Text>
      </View>

      {/* Botão */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {verified ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success }]}
            onPress={handleProceed} activeOpacity={0.85}>
            <Text style={styles.btnText}>Começar a trabalhar 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn,
              { backgroundColor: Colors.primary,
                opacity: capturing || !permission?.granted ? 0.6 : 1 }]}
            onPress={permission?.granted ? handleCapture : requestPermission}
            disabled={capturing} activeOpacity={0.85}>
            <Text style={styles.btnText}>
              {capturing ? 'Verificando...'
                : !permission?.granted ? 'Permitir câmera'
                : 'Capturar foto'}
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  headerTitle: { color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.md, fontWeight: '500' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl },
  cameraWrap: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 3, overflow: 'hidden',
    marginBottom: 32,
  },
  camera: { width: '100%', height: '100%' },
  cameraFallback: { backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center' },
  msgText: { color: Colors.white, fontSize: Typography.xl,
    fontWeight: '700', textAlign: 'center' },
  subText: { color: 'rgba(255,255,255,0.5)', fontSize: Typography.sm,
    textAlign: 'center', marginTop: 10, lineHeight: 20 },
  bottom: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  btn: { borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.white, fontSize: Typography.lg,
    fontWeight: '700' },
});