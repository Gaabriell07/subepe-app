import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const SEXOS = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Femenino', value: 'FEMENINO' },
  { label: 'Otro', value: 'OTRO' },
];

export default function RegistroScreen({ navigation, route }) {
  const rol = route.params?.rol ?? 'PASAJERO';
  const { registro } = useAuth();

  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  // Paso 1 – Datos personales
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [sexo, setSexo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  // Paso 2 – Credenciales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // ──────────────────────────── helpers ────────────────────────────
  const validarFecha = (text) => {
    // Permite formato DD/MM/AAAA con auto-inserción de "/"
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    if (clean.length > 10) clean = clean.slice(0, 10);
    setFechaNacimiento(clean);
  };

  const parsearFecha = (str) => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const fecha = new Date(`${y}-${m}-${d}`);
    return isNaN(fecha.getTime()) ? null : fecha;
  };

  const validarPaso1 = () => {
    if (!nombres.trim()) return 'Ingresa tus nombres';
    if (!apellidos.trim()) return 'Ingresa tus apellidos';
    if (!dni.trim() || dni.length < 8) return 'El DNI debe tener al menos 8 dígitos';
    if (!sexo) return 'Selecciona tu sexo';
    if (!fechaNacimiento || fechaNacimiento.length < 10) return 'Ingresa tu fecha de nacimiento (DD/MM/AAAA)';
    if (!parsearFecha(fechaNacimiento)) return 'Fecha inválida. Usa el formato DD/MM/AAAA';
    return null;
  };

  const validarPaso2 = () => {
    if (!email.trim() || !email.includes('@')) return 'Ingresa un correo válido';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmarPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSiguiente = () => {
    const error = validarPaso1();
    if (error) {
      Alert.alert('Datos incompletos', error);
      return;
    }
    setPaso(2);
  };

  const handleRegistro = async () => {
    const error = validarPaso2();
    if (error) {
      Alert.alert('Datos incompletos', error);
      return;
    }

    try {
      setCargando(true);
      await registro({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        dni: dni.trim(),
        sexo,
        fechaNacimiento: parsearFecha(fechaNacimiento).toISOString(),
        email: email.trim().toLowerCase(),
        password,
        rol,
      });
      Alert.alert(
        '¡Cuenta creada!',
        'Tu cuenta fue creada correctamente. Inicia sesión para continuar.',
        [{ text: 'Aceptar', onPress: () => navigation.navigate('Login', { rol }) }]
      );
    } catch (error) {
      const msg =
        error?.response?.data?.mensaje ||
        'No se pudo crear la cuenta. Verifica tus datos e inténtalo de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setCargando(false);
    }
  };

  // ──────────────────────────── UI ────────────────────────────
  const rolLabel = rol === 'CONDUCTOR' ? 'Conductor' : 'Pasajero';

  return (
    <SafeAreaView className="flex-1 bg-[#f0f2ff]">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity
          className="mb-6 flex-row items-center"
          onPress={() => (paso === 1 ? navigation.goBack() : setPaso(1))}
        >
          <Ionicons name="arrow-back" size={22} color="#1a3cff" />
          <Text className="ml-2 text-[#1a3cff] font-semibold text-sm">
            {paso === 1 ? 'Volver' : 'Paso anterior'}
          </Text>
        </TouchableOpacity>

        {/* Logo + Título */}
        <View className="items-center mb-8">
          <Image
            source={require('../../../images/subepeicono.png')}
            style={{ width: 90, height: 90, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-gray-900">Crear cuenta</Text>
          <Text className="text-sm text-gray-500 mt-1">Regístrate como {rolLabel}</Text>
        </View>

        {/* Indicador de pasos */}
        <View className="flex-row items-center justify-center mb-8">
          {/* Paso 1 */}
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${paso >= 1 ? 'bg-[#1a3cff]' : 'bg-gray-200'}`}
          >
            {paso > 1 ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text className="text-white font-bold text-xs">1</Text>
            )}
          </View>
          <View className={`flex-1 h-1 mx-2 rounded-full ${paso > 1 ? 'bg-[#1a3cff]' : 'bg-gray-200'}`} />
          {/* Paso 2 */}
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${paso >= 2 ? 'bg-[#1a3cff]' : 'bg-gray-200'}`}
          >
            <Text className={`font-bold text-xs ${paso >= 2 ? 'text-white' : 'text-gray-400'}`}>2</Text>
          </View>
        </View>

        {paso === 1 ? (
          <>
            {/* ───── PASO 1 ───── */}
            <Text className="text-base font-bold text-gray-800 mb-5">Datos personales</Text>

            {/* Nombres */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Nombres</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="person-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Ej. Juan Carlos"
                placeholderTextColor="#aaa"
                value={nombres}
                onChangeText={setNombres}
                autoCapitalize="words"
              />
            </View>

            {/* Apellidos */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Apellidos</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="person-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Ej. Pérez García"
                placeholderTextColor="#aaa"
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
              />
            </View>

            {/* DNI */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">DNI</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="card-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="12345678"
                placeholderTextColor="#aaa"
                value={dni}
                onChangeText={setDni}
                keyboardType="number-pad"
                maxLength={12}
              />
            </View>

            {/* Fecha de nacimiento */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Fecha de nacimiento</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="calendar-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#aaa"
                value={fechaNacimiento}
                onChangeText={validarFecha}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* Sexo */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Sexo</Text>
            <View className="flex-row gap-3 mb-6">
              {SEXOS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSexo(s.value)}
                  className={`flex-1 h-12 rounded-2xl items-center justify-center border-2 ${
                    sexo === s.value
                      ? 'bg-[#1a3cff] border-[#1a3cff]'
                      : 'bg-[#eef0ff] border-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      sexo === s.value ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón Siguiente */}
            <TouchableOpacity
              className="bg-[#1a3cff] rounded-2xl h-14 items-center justify-center"
              onPress={handleSiguiente}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-white font-bold text-base">Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ───── PASO 2 ───── */}
            <Text className="text-base font-bold text-gray-800 mb-5">Credenciales de acceso</Text>

            {/* Email */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Correo electrónico</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="mail-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="nombre@ejemplo.com"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Contraseña */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Contraseña</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-4 h-14">
              <Ionicons name="lock-closed-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                <Ionicons
                  name={mostrarPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar contraseña */}
            <Text className="text-sm font-semibold text-gray-700 mb-1">Confirmar contraseña</Text>
            <View className="flex-row items-center bg-[#eef0ff] rounded-2xl px-4 mb-6 h-14">
              <Ionicons name="lock-closed-outline" size={18} color="#999" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Repite tu contraseña"
                placeholderTextColor="#aaa"
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                secureTextEntry={!mostrarConfirmar}
              />
              <TouchableOpacity onPress={() => setMostrarConfirmar(!mostrarConfirmar)}>
                <Ionicons
                  name={mostrarConfirmar ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Indicador de fortaleza */}
            {password.length > 0 && (
              <View className="mb-6">
                <View className="flex-row gap-1 mb-1">
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      className={`flex-1 h-1.5 rounded-full ${
                        password.length >= n * 2
                          ? password.length < 4
                            ? 'bg-red-400'
                            : password.length < 8
                            ? 'bg-yellow-400'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </View>
                <Text className="text-xs text-gray-400">
                  {password.length < 4
                    ? 'Contraseña débil'
                    : password.length < 8
                    ? 'Contraseña regular'
                    : 'Contraseña fuerte'}
                </Text>
              </View>
            )}

            {/* Botón Registrarse */}
            <TouchableOpacity
              className="bg-[#1a3cff] rounded-2xl h-14 items-center justify-center mb-5"
              onPress={handleRegistro}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Crear mi cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Ya tengo cuenta */}
            <View className="flex-row justify-center">
              <Text className="text-gray-500 text-sm">¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { rol })}>
                <Text className="text-[#1a3cff] font-bold text-sm">Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
