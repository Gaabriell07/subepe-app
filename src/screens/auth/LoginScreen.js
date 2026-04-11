import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, loginConGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    try {
      setCargando(true);
      await login(email, password);
      // AppNavigator redirige automáticamente según usuario.rol
    } catch (error) {
      Alert.alert('Error', error.message || 'Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setCargandoGoogle(true);
      await loginConGoogle();
    } catch (error) {
      if (error.message !== 'Login cancelado') {
        Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setCargandoGoogle(false);
    }
  };

  return (
    <View
      className="flex-1 bg-[#f0f2ff]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <Image
            source={require('../../../images/subepeicono.png')}
            style={{ width: 110, height: 110, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-900 mb-1">SubePE</Text>
          <Text className="text-base text-gray-500">Bienvenido de vuelta</Text>
        </View>

        {/* Email */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Correo electrónico
        </Text>
        <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-5 h-14">
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

        {/* Password */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">Contraseña</Text>
        <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-2 h-14">
          <Ionicons name="lock-closed-outline" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-3 text-gray-800"
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!mostrarPassword}
          />
          <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
            <Ionicons
              name={mostrarPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Olvidé contraseña */}
        <TouchableOpacity className="items-end mb-6">
          <Text className="text-[#1a3cff] font-semibold text-sm">
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

        {/* Botón Login */}
        <TouchableOpacity
          className="bg-[#1a3cff] rounded-2xl h-14 items-center justify-center mb-6"
          onPress={handleLogin}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-400 text-xs font-semibold tracking-widest">
            O CONTINÚA CON
          </Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Google */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white rounded-2xl h-14 mb-8 shadow-sm"
          onPress={handleGoogle}
          disabled={cargandoGoogle}
        >
          {cargandoGoogle ? (
            <ActivityIndicator color="#EA4335" />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color="#EA4335" />
              <Text className="ml-3 font-semibold text-gray-700">
                Continuar con Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Crear cuenta → va a SelectorRol primero para elegir el rol */}
        <View className="flex-row justify-center">
          <Text className="text-gray-500 text-sm">¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SelectorRol')}>
            <Text className="text-[#1a3cff] font-bold text-sm">Crear una cuenta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
