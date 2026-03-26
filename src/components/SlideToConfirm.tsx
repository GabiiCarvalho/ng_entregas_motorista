// src/components/SlideToConfirm.tsx
// Botão deslizante para finalizar corrida — segurança contra clique acidental
import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated,
  PanResponder, Dimensions, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography, Shadow } from '../theme';

const { width: SW } = Dimensions.get('window');
const TRACK_W    = SW - 48;   // largura total da trilha
const THUMB_SIZE = 60;        // tamanho do polegar
const MAX_DRAG   = TRACK_W - THUMB_SIZE - 8; // limite máximo
const THRESHOLD  = MAX_DRAG * 0.82; // 82% → confirma

interface Props {
  label?: string;
  sublabel?: string;
  onConfirm: () => Promise<void> | void;
  color?: string;
  icon?: string;
  loading?: boolean;
}

export default function SlideToConfirm({
  label     = 'Deslize para finalizar',
  sublabel  = 'Arraste para confirmar a entrega',
  onConfirm,
  color     = Colors.success,
  icon      = 'checkmark',
  loading   = false,
}: Props) {
  const pan      = useRef(new Animated.Value(0)).current;
  const [done,   setDone]   = useState(false);
  const [acting, setActing] = useState(false);

  // Animações de feedback
  const textOpacity = pan.interpolate({
    inputRange: [0, MAX_DRAG * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const trackOpacity = pan.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: [0, 0.35],
    extrapolate: 'clamp',
  });
  const thumbScale = pan.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: [1, 1.08],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !done && !acting && !loading,
    onMoveShouldSetPanResponder:  () => !done && !acting && !loading,

    onPanResponderMove: (_, gs) => {
      const val = Math.max(0, Math.min(gs.dx, MAX_DRAG));
      pan.setValue(val);
    },

    onPanResponderRelease: async (_, gs) => {
      if (gs.dx >= THRESHOLD) {
        // ── Confirmado ──────────────────────
        Animated.spring(pan, {
          toValue: MAX_DRAG, useNativeDriver: false, friction: 6 }).start();
        Vibration.vibrate(60);
        setDone(true);
        setActing(true);
        try { await onConfirm(); }
        finally { setActing(false); }
      } else {
        // ── Volta ao início ─────────────────
        Animated.spring(pan, {
          toValue: 0, useNativeDriver: false,
          friction: 5, tension: 80 }).start();
      }
    },
  })).current;

  return (
    <View style={styles.wrapper}>
      {sublabel ? (
        <Text style={styles.sublabel}>{sublabel}</Text>
      ) : null}

      <View style={[styles.track, { backgroundColor: color + '22',
        borderColor: color + '50' }]}>

        {/* Fundo preenchido conforme arrasta */}
        <Animated.View style={[
          styles.fill,
          { backgroundColor: color, opacity: trackOpacity,
            width: pan.interpolate({
              inputRange: [0, MAX_DRAG],
              outputRange: [THUMB_SIZE, TRACK_W],
              extrapolate: 'clamp',
            })
          },
        ]} />

        {/* Texto central */}
        <Animated.Text style={[styles.label,
          { color, opacity: textOpacity }]}>
          {done ? 'Entregue! ✅' : label}
        </Animated.Text>

        {/* Polegar deslizante */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: done ? color : Colors.white,
              borderColor: color,
              transform: [
                { translateX: pan },
                { scale: thumbScale },
              ],
              ...Shadow.md,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {acting || loading ? (
            <View style={styles.spinner}>
              <Ionicons name="sync" size={22}
                color={done ? Colors.white : color} />
            </View>
          ) : (
            <Ionicons
              name={done ? 'checkmark-circle' : (icon as any)}
              size={26}
              color={done ? Colors.white : color}
            />
          )}
        </Animated.View>

        {/* Seta indicadora */}
        {!done && (
          <Animated.View style={[styles.arrows,
            { opacity: textOpacity }]}>
            {[0,1,2].map(i => (
              <Ionicons key={i} name="chevron-forward"
                size={14} color={color + '70'} />
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: 8,
  },
  sublabel: {
    fontSize: Typography.xs,
    color: Colors.grey,
    textAlign: 'center',
  },
  track: {
    width: TRACK_W,
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: (THUMB_SIZE + 8) / 2,
  },
  label: {
    fontSize: Typography.md,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  arrows: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    // Simula loading com ícone de sync
  },
});