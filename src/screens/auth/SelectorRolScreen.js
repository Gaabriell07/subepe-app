import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Esta pantalla ahora solo se usa para REGISTRO
// El usuario elige su rol (Pasajero o Conductor) antes de crear su cuenta
export default function SelectorRolScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#f0f2ff]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <Image
            source={require('../../../images/subepeicono.png')}
            style={{ width: 110, height: 110, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-[#1a3cff] mb-2">SubePE</Text>
          <Text className="text-base text-gray-500 text-center">
            ¿Cómo quieres registrarte?
          </Text>
        </View>

        {/* Tarjeta Pasajero */}
        <TouchableOpacity
          className="bg-white rounded-3xl p-7 items-center w-full mb-5 shadow-sm"
          onPress={() => navigation.navigate('Registro', { rol: 'PASAJERO' })}
        >
          <View className="bg-[#eef0ff] rounded-full p-4 mb-4">
            <Ionicons name="person" size={36} color="#1a3cff" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Soy Pasajero</Text>
          <Text className="text-sm text-gray-400 text-center leading-6">
            Recarga tu billetera, genera QR de abordaje y viaja fácil.
          </Text>
        </TouchableOpacity>

        {/* Tarjeta Conductor */}
        <TouchableOpacity
          className="bg-white rounded-3xl p-7 items-center w-full mb-5 shadow-sm"
          onPress={() => navigation.navigate('Registro', { rol: 'CONDUCTOR' })}
        >
          <View className="bg-[#eef0ff] rounded-full p-4 mb-4">
            <MaterialCommunityIcons name="steering" size={36} color="#1a3cff" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Soy Conductor</Text>
          <Text className="text-sm text-gray-400 text-center leading-6">
            Escanea QR, valida pasajeros y gestiona tu ruta diaria.
          </Text>
        </TouchableOpacity>

        {/* Volver al login */}
        <TouchableOpacity
          className="flex-row justify-center items-center mt-4"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#1a3cff" />
          <Text className="text-[#1a3cff] font-semibold text-sm ml-1">
            Ya tengo cuenta · Iniciar sesión
          </Text>
        </TouchableOpacity>

        <Text className="text-center mt-8 text-gray-300 text-xs tracking-widest">
          © 2026 SUBEPE TRANSIT FLOW
        </Text>
      </ScrollView>
    </View>
  );
}
