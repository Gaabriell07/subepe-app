import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import SelectorRolScreen  from '../screens/auth/SelectorRolScreen';
import LoginScreen             from '../screens/auth/LoginScreen';
import RecuperarPasswordScreen from '../screens/auth/RecuperarPasswordScreen';
import RegistroScreen          from '../screens/auth/RegistroScreen';
import PasajeroNavigator  from './PasajeroNavigator';
import ConductorNavigator from './ConductorNavigator';

const Stack = createNativeStackNavigator();

function PantallaCarga() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
                   backgroundColor: '#f0f2ff' }}>
      <ActivityIndicator size="large" color="#1a3cff" />
    </View>
  );
}

export default function AppNavigator() {
  const { usuario, cargando } = useAuth();
  const navRef      = useRef(null);
  const navReady    = useRef(false);

  const lastAuthKey = useRef(null);

  const getTargetRoute = (u) => {
    if (!u)                    return 'Login';
    if (u.rol === 'PASAJERO')  return 'PasajeroHome';
    if (u.rol === 'CONDUCTOR') return 'ConductorHome';
    return 'SelectorRol';
  };

  const navegarSegunAuth = (u) => {
    if (!navRef.current || !navReady.current) return;

    const authKey = u ? `${u.rol}-${u.id}` : 'guest';
    if (lastAuthKey.current === authKey) return; 
    lastAuthKey.current = authKey;

    navRef.current.reset({ index: 0, routes: [{ name: getTargetRoute(u) }] });
  };

  useEffect(() => {
    
    if (cargando) return;
    navegarSegunAuth(usuario);
  }, [usuario, cargando]); 

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => {
        navReady.current = true;
        
        if (!cargando) {
          navegarSegunAuth(usuario);
        }
      }}
    >
      {}
      <Stack.Navigator
        initialRouteName="Cargando"
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Stack.Screen name="Cargando"      component={PantallaCarga} />
        <Stack.Screen name="Login"             component={LoginScreen} />
        <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
        <Stack.Screen name="SelectorRol"       component={SelectorRolScreen} />
        <Stack.Screen name="Registro"      component={RegistroScreen} />
        <Stack.Screen name="PasajeroHome"  component={PasajeroNavigator} />
        <Stack.Screen name="ConductorHome" component={ConductorNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
