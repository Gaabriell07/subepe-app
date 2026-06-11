import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EscanearQRScreen      from '../screens/conductor/EscanearQRScreen';
import GananciasScreen       from '../screens/conductor/GananciasScreen';
import ConductorCuentaScreen from '../screens/conductor/CuentaScreen';

const Tab = createBottomTabNavigator();

export default function ConductorNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a1a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.07)',
          elevation: 20,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor:   '#4f7cff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      }}
    >
      {}
      <Tab.Screen
        name="Escaner"
        component={EscanearQRScreen}
        options={{
          tabBarLabel: 'Escáner',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
          ),
        }}
      />

      {}
      <Tab.Screen
        name="Ganancias"
        component={GananciasScreen}
        options={{
          tabBarLabel: 'Ganancias',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
          ),
        }}
      />

      {}
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
