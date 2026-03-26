import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/useAuth';
import { Colors } from '../src/theme';

export default function SplashScreen() {
  const router   = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const user     = useAuth((s) => s.motorista);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (user) router.replace('/(tabs)');
      else      router.replace('/(auth)/login');
    }, 2000);
    return () => clearTimeout(t);
  }, [hydrated, user]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content,
        { opacity, transform: [{ scale }] }]}>

        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NG</Text>
          <View style={styles.logoBadge}>
            <Ionicons name="car" size={14} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.title}>NG Motorista</Text>
        <Text style={styles.subtitle}>Seu parceiro de entregas</Text>
      </Animated.View>

      <Animated.View style={[styles.loading, { opacity }]}>
        <View style={styles.dots}>
          {[0,1,2].map(i => (
            <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.25 }]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  logoBox: {
    width: 120, height: 120, backgroundColor: Colors.white,
    borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  logoText: { fontSize: 44, fontWeight: '900', color: Colors.primary,
    letterSpacing: -2 },
  logoBadge: {
    position: 'absolute', bottom: 14, right: 12,
    width: 30, height: 30, backgroundColor: Colors.dark,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  title: { fontSize: 32, fontWeight: '800', color: Colors.white,
    marginTop: 28, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  loading: { position: 'absolute', bottom: 60 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, backgroundColor: Colors.white, borderRadius: 4 },
});