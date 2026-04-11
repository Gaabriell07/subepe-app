import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/pasajero/DashboardScreen';
import ViajesScreen from '../screens/pasajero/ViajesScreen';
import WalletScreen from '../screens/pasajero/WalletScreen';
import CuentaScreen from '../screens/pasajero/CuentaScreen';
import GenerarQRScreen from '../screens/pasajero/GenerarQRScreen';
import EditarPerfilScreen from '../screens/pasajero/EditarPerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Config de tabs ──────────────────────────────────────────────────────────
const TAB_CONFIG = [
  {
    name: 'Home',
    label: 'Inicio',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    name: 'Viajes',
    label: 'Viajes',
    icon: 'time-outline',
    iconActive: 'time',
  },
  {
    name: 'Wallet',
    label: 'Billetera',
    icon: 'wallet-outline',
    iconActive: 'wallet',
    isMC: true, // MaterialCommunityIcons
  },
  {
    name: 'Cuenta',
    label: 'Cuenta',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

// ─── Botón de tab animado ─────────────────────────────────────────────────────
function TabButton({ tab, focused, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnim  = useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(dotAnim, {
      toValue: focused ? 1 : 0,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.78, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress]);

  const dotScale = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const iconColor = focused ? '#1a3cff' : '#9ca3af';
  const iconName  = focused ? tab.iconActive : tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Dot indicador superior */}
        <Animated.View
          style={[styles.dot, { transform: [{ scaleX: dotScale }, { scaleY: dotScale }] }]}
        />

        {/* Ícono */}
        {tab.isMC ? (
          <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
        ) : (
          <Ionicons name={iconName} size={22} color={iconColor} />
        )}

        {/* Label */}
        <Text style={[styles.tabLabel, { color: iconColor, fontWeight: focused ? '700' : '500' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Tab bar personalizado ────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route, index) => {
        const tab = TAB_CONFIG.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        return (
          <TabButton key={route.key} tab={tab} focused={focused} onPress={onPress} />
        );
      })}
    </View>
  );
}

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
function PasajeroTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      // lazy: true → solo monta la pantalla cuando el usuario la visita por primera vez
      // Reduce significativamente el tiempo de carga inicial
      detachInactiveScreens={true}
    >
      <Tab.Screen name="Home"    component={DashboardScreen} />
      <Tab.Screen name="Viajes"  component={ViajesScreen} />
      <Tab.Screen name="Wallet"  component={WalletScreen} />
      <Tab.Screen name="Cuenta"  component={CuentaScreen} />
    </Tab.Navigator>
  );
}

// ─── Stack principal ──────────────────────────────────────────────────────────
export default function PasajeroNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PasajeroTabs" component={PasajeroTabs} />
      <Stack.Screen
        name="GenerarQR"
        component={GenerarQRScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="EditarPerfil"
        component={EditarPerfilScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingTop: 8,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minWidth: 56,
  },
  dot: {
    position: 'absolute',
    top: -10,
    width: 22,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#1a3cff',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});
