import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

export default function RecuperarPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRecuperar = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }
    try {
      setCargando(true);
      const { data } = await api.post('/auth/recuperar-password', { email: email.trim() });
      Alert.alert('¡Éxito!', data.mensaje || 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar el correo de recuperación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-5 pt-4 pb-4">
        <TouchableOpacity
          className="bg-white rounded-full w-10 h-10 items-center justify-center shadow-sm mr-3"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#1a3cff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1a3cff]">Recuperar Contraseña</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }} keyboardShouldPersistTaps="handled">
        <Text className="text-gray-500 mb-8 leading-5">
          Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace para que puedas restablecer tu contraseña.
        </Text>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Correo electrónico</Text>
        <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-8 h-14">
          <Ionicons name="mail-outline" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-3 text-gray-800"
            placeholder="nombre@ejemplo.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          className="bg-[#1a3cff] rounded-2xl h-14 items-center justify-center"
          onPress={handleRecuperar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Enviar correo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
