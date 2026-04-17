import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Los conductores son creados exclusivamente por el administrador.
// Esta pantalla solo permite el registro de PASAJEROS.
export default function SelectorRolScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#f0f2ff]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <Image
            source={require('../../../images/subepeicono.png')}
            style={{ width: 110, height: 110, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#1a3cff] mb-2">SubePE</Text>
          <Text className="text-base text-gray-500 text-center">
            Crea tu cuenta para empezar a viajar
          </Text>
        </View>

        {/* Tarjeta Pasajero — única opción */}
        <TouchableOpacity
          className="bg-white rounded-3xl p-8 items-center w-full shadow-sm"
          onPress={() => navigation.navigate('Registro', { rol: 'PASAJERO' })}
          activeOpacity={0.85}
        >
          <View className="bg-[#eef0ff] rounded-full p-5 mb-5">
            <Ionicons name="person" size={42} color="#1a3cff" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
          <Text className="text-sm text-gray-400 text-center leading-6 mb-4">
            Recarga tu billetera, genera tu QR de abordaje y viaja cómodamente.
          </Text>
          <View className="bg-[#1a3cff] rounded-2xl px-8 py-3 w-full items-center">
            <Text className="text-white font-bold text-base">Registrarme como pasajero</Text>
          </View>
        </TouchableOpacity>

        {/* Volver al login */}
        <TouchableOpacity
          className="flex-row justify-center items-center mt-8"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#1a3cff" />
          <Text className="text-[#1a3cff] font-semibold text-sm ml-1">
            Ya tengo cuenta · Iniciar sesión
          </Text>
        </TouchableOpacity>

        {/* Nota informativa para conductores */}
        <View className="mt-6 bg-white/70 rounded-2xl px-5 py-4">
          <Text className="text-xs text-gray-400 text-center leading-5">
            🚌 ¿Eres conductor? Tu cuenta es creada por la empresa.{'\n'}
            Inicia sesión con las credenciales que te proporcionaron.
          </Text>
        </View>

        <Text className="text-center mt-8 text-gray-300 text-xs tracking-widest">
          © 2026 SUBEPE TRANSIT FLOW
        </Text>
      </ScrollView>
    </View>
  );
}
