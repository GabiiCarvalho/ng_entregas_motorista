import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16, ...Shadow.md }
});