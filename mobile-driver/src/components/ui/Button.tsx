import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'outline';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Button({ label, onPress, loading, variant = 'primary', icon, disabled }: ButtonProps) {
  const bg = {
    primary: Colors.primary,
    success: Colors.success,
    danger: Colors.danger,
    outline: 'transparent'
  }[variant];

  const color = variant === 'outline' ? Colors.primary : Colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg }, variant === 'outline' && styles.outline, (disabled || loading) && { opacity: 0.6 }]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: '100%', borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1.5, borderColor: Colors.primary },
  text: { fontWeight: '700', fontSize: 16 }
});