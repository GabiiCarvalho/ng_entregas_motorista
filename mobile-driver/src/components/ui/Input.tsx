import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, rightIcon, ...props }: InputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrap, !!error && { borderColor: Colors.danger }]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput style={styles.input} placeholderTextColor={Colors.grey} {...props} />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.dark, marginBottom: 6 },
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: Typography.base, color: Colors.dark },
  icon: { paddingHorizontal: 12 },
  error: { fontSize: Typography.xs, color: Colors.danger, marginTop: 4 }
});