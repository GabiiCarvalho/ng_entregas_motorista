import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface SnackBarProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'error';
}

export function SnackBar({ message, visible, type = 'success' }: SnackBarProps) {
  if (!visible) return null;
  return (
    <View style={[styles.snack, { backgroundColor: type === 'success' ? Colors.success : Colors.danger }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  snack: { position: 'absolute', bottom: 100, left: 16, right: 16, padding: 14, borderRadius: Radius.md },
  text: { color: Colors.white, fontWeight: '600', textAlign: 'center', fontSize: 14 }
});