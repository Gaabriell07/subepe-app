import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConductorDashboard from '../screens/conductor/DashboardScreen';
import EscanearQRScreen from '../screens/conductor/EscanearQRScreen';
import ConductorCuentaScreen from '../screens/conductor/CuentaScreen';
import TurnoActivoScreen from '../screens/conductor/TurnoActivoScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Bottom Tabs del conductor ───────────────────────────────────────────────
function ConductorTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          elevation: 10,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#4f7cff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Tab.Screen
        name="Home"
        component={ConductorDashboard}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cuenta"
        component={ConductorCuentaScreen}
        options={{
          tabBarLabel: 'Cuenta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack del conductor (Tabs + EscanearQR como modal) ──────────────────────
export default function ConductorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConductorTabs" component={ConductorTabs} />
      <Stack.Screen
        name="EscanearQR"
        component={EscanearQRScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="TurnoActivo"
        component={TurnoActivoScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
