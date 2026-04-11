import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import SelectorRolScreen from '../screens/auth/SelectorRolScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegistroScreen from '../screens/auth/RegistroScreen';
import PasajeroNavigator from './PasajeroNavigator';
import ConductorNavigator from './ConductorNavigator';

const Stack = createNativeStackNavigator();

// Pantalla de carga — siempre dentro del NavigationContainer
function PantallaCarga() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2ff' }}>
      <ActivityIndicator size="large" color="#1a3cff" />
    </View>
  );
}

export default function AppNavigator() {
  const { usuario, cargando } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {cargando ? (
          // La pantalla de carga siempre está DENTRO del NavigationContainer
          <Stack.Screen name="Cargando" component={PantallaCarga} />

        ) : !usuario ? (
          // Flujo de autenticación
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SelectorRol" component={SelectorRolScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
          </>

        ) : usuario.rol === 'PASAJERO' ? (
          <Stack.Screen name="PasajeroHome" component={PasajeroNavigator} />

        ) : usuario.rol === 'CONDUCTOR' ? (
          <Stack.Screen name="ConductorHome" component={ConductorNavigator} />

        ) : (
          // ADMINISTRADOR — placeholder por ahora
          <Stack.Screen name="SelectorRol" component={SelectorRolScreen} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
