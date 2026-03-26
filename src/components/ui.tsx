import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, ViewStyle, TextInputProps,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

// ── Button ────────────────────────────────────
export function Button({
  label, onPress, loading = false,
  variant = 'primary', icon, style, disabled, size = 'lg',
}: {
  label: string; onPress: () => void; loading?: boolean;
  variant?: 'primary'|'success'|'danger'|'outline'|'ghost';
  icon?: React.ReactNode; style?: ViewStyle;
  disabled?: boolean; size?: 'sm'|'md'|'lg';
}) {
  const bg = { primary: Colors.primary, success: Colors.success,
    danger: Colors.danger, outline: 'transparent', ghost: 'transparent' }[variant];
  const tc = { primary: Colors.white, success: Colors.white,
    danger: Colors.white, outline: Colors.primary, ghost: Colors.primary }[variant];
  const pad = { sm: 10, md: 13, lg: 16 }[size];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: bg, paddingVertical: pad },
        variant === 'outline' && { borderWidth: 1.5, borderColor: Colors.primary },
        (disabled || loading) && { opacity: 0.6 }, style]}>
      {loading ? (
        <ActivityIndicator color={tc} size="small" />
      ) : (
        <View style={styles.btnRow}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.btnText, { color: tc,
            fontSize: { sm: 13, md: 14, lg: 16 }[size] }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────
export function Input({
  label, error, leftIcon, rightIcon, containerStyle, ...props
}: TextInputProps & {
  label?: string; error?: string;
  leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputWrap, !!error && { borderColor: Colors.danger }]}>
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        <TextInput style={[styles.input, leftIcon && { paddingLeft: 0 }]}
          placeholderTextColor={Colors.grey} {...props} />
        {rightIcon && <View style={styles.inputIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

// ── Card ──────────────────────────────────────
export function Card({ children, style, onPress, padding = 16 }: {
  children: React.ReactNode; style?: ViewStyle;
  onPress?: () => void; padding?: number;
}) {
  const inner = <View style={[styles.card, { padding }, style]}>{children}</View>;
  if (onPress) return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{inner}</TouchableOpacity>
  );
  return inner;
}

// ── StepBar ───────────────────────────────────
export function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <View>
      <Text style={styles.stepText}>Passo {current} de {total}</Text>
      <View style={styles.stepRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.stepDot,
            i < current ? { backgroundColor: Colors.primary }
                        : { backgroundColor: Colors.border },
            i < total - 1 && { marginRight: 4 }]} />
        ))}
      </View>
    </View>
  );
}

// ── Divider ───────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── Loading ───────────────────────────────────
export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ── SnackBar ──────────────────────────────────
export function SnackBar({ message, visible, type = 'success' }: {
  message: string; visible: boolean; type?: 'success'|'error';
}) {
  if (!visible) return null;
  return (
    <View style={[styles.snack, {
      backgroundColor: type === 'success' ? Colors.success : Colors.danger }]}>
      <Text style={styles.snackText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { width: '100%', borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontWeight: '700', letterSpacing: 0.2 },
  inputLabel: { fontSize: Typography.sm, fontWeight: '600',
    color: Colors.dark, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: Typography.base, color: Colors.dark },
  inputIcon: { paddingHorizontal: 12, justifyContent: 'center',
    alignItems: 'center' },
  inputError: { fontSize: Typography.xs, color: Colors.danger,
    marginTop: 4, marginLeft: 2 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, ...Shadow.md },
  stepText: { fontSize: Typography.xs, color: Colors.grey,
    fontWeight: '500', marginBottom: 8 },
  stepRow: { flexDirection: 'row' },
  stepDot: { flex: 1, height: 4, borderRadius: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  snack: { position: 'absolute', bottom: 100, left: 16, right: 16,
    padding: 14, borderRadius: Radius.md, ...Shadow.lg },
  snackText: { color: Colors.white, fontWeight: '600',
    textAlign: 'center', fontSize: Typography.md },
});