import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.grey,
      tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border, height: 60, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Ganhos', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}