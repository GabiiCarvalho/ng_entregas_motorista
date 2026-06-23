// mobile-driver/app/index.tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    // Carrega dados do storage
    const loadData = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const authData = await AsyncStorage.getItem('auth-storage');
        
        if (authData) {
          const parsed = JSON.parse(authData);
          const state = parsed.state || parsed;
          setHasUser(!!(state.motorista || state.user));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
      setIsReady(true);
    };

    loadData();

    // Animação de entrada
    Animated.parallel([
      Animated.timing(opacity, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: true 
      }),
      Animated.spring(scale, { 
        toValue: 1, 
        friction: 6, 
        useNativeDriver: true 
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    const timer = setTimeout(() => {
      if (hasUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isReady, hasUser]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content, 
        { opacity, transform: [{ scale }] }
      ]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NG</Text>
        </View>
        <Text style={styles.title}>NG Motorista</Text>
        <Text style={styles.subtitle}>Seu parceiro de entregas</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#FF6B00', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  content: { 
    alignItems: 'center' 
  },
  logoBox: { 
    width: 120, 
    height: 120, 
    backgroundColor: '#fff', 
    borderRadius: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  logoText: { 
    fontSize: 44, 
    fontWeight: '900', 
    color: '#FF6B00' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#fff', 
    marginTop: 28 
  },
  subtitle: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.75)', 
    marginTop: 8 
  }
});