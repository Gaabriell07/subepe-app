import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TIPO_CARNET_LABEL = {
  NORMAL:        'Regular',
  UNIVERSITARIO: 'Universitario',
  ESCOLAR:       'Escolar',
  POLICIA:       'Policía',
  MILITAR:       'Militar',
  ADULTO_MAYOR:  'Adulto Mayor',
  DISCAPACITADO: 'Discapacitado',
};

const TIPO_CARNET_COLOR = {
  NORMAL:        { bg: '#eef0ff', text: '#1a3cff' },
  UNIVERSITARIO: { bg: '#dcfce7', text: '#16a34a' },
  ESCOLAR:       { bg: '#dcfce7', text: '#16a34a' },
  POLICIA:       { bg: '#fff7ed', text: '#ea580c' },
  MILITAR:       { bg: '#fff7ed', text: '#ea580c' },
  ADULTO_MAYOR:  { bg: '#fef9c3', text: '#ca8a04' },
  DISCAPACITADO: { bg: '#fee2e2', text: '#dc2626' },
};

export default function CuentaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notificaciones, setNotificaciones] = useState(true);

  const cargarPerfil = useCallback(async () => {
    try {
      const { data } = await api.get('/pasajero/perfil');
      setPerfil(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [cargarPerfil])
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getIniciales = () => {
    const n = perfil?.nombres || usuario?.nombres || '';
    const a = perfil?.apellidos || usuario?.apellidos || '';
    return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const tipoCarnet  = perfil?.pasajero?.tipoCarnet || 'NORMAL';
  const carnetColor = TIPO_CARNET_COLOR[tipoCarnet] ?? TIPO_CARNET_COLOR.NORMAL;

  // Si la carga terminó pero el perfil sigue nulo (error 401 / red)
  // mostramos un estado vacío en lugar de romper el render
  if (!cargando && !perfil) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f0f2ff] px-8">
        <Ionicons name="person-circle-outline" size={72} color="#cbd5e1" />
        <Text className="text-gray-400 font-semibold text-base mt-4 text-center">
          No se pudo cargar tu perfil
        </Text>
        <Text className="text-gray-300 text-sm mt-1 text-center">
          Verifica tu conexión e intenta de nuevo
        </Text>
        <TouchableOpacity
          className="mt-6 bg-[#1a3cff] rounded-2xl px-8 py-4"
          onPress={cargarPerfil}
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f0f2ff]">
        <ActivityIndicator size="large" color="#1a3cff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header azul con avatar */}
        <View className="bg-[#1a3cff] px-5 pt-4 pb-10">
          <Text className="text-white text-2xl font-bold mb-6">Mi Cuenta</Text>
          <View className="items-center">
            {/* Avatar con iniciales */}
            <View
              className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-3"
              style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }}
            >
              <Text className="text-white text-3xl font-bold">{getIniciales()}</Text>
            </View>
            <Text className="text-white text-xl font-bold">
              {perfil?.nombres} {perfil?.apellidos}
            </Text>
            <Text className="text-white opacity-70 text-sm mt-1">
              {perfil?.email || usuario?.email}
            </Text>
            {/* Badge de tipo carnet */}
            <View
              className="mt-3 rounded-full px-4 py-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Text className="text-white text-xs font-bold">
                {TIPO_CARNET_LABEL[tipoCarnet] || 'Regular'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de información flotante */}
        <View className="mx-5 -mt-6 bg-white rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">Saldo</Text>
              <Text className="text-[#1a3cff] font-bold text-lg">
                S/ {perfil?.pasajero?.saldo?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
            <View
              className="w-px bg-gray-100"
              style={{ height: '100%' }}
            />
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">Tipo carnet</Text>
              <View
                className="rounded-full px-3 py-0.5"
                style={{ backgroundColor: carnetColor.bg }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: carnetColor.text }}
                >
                  {TIPO_CARNET_LABEL[tipoCarnet]}
                </Text>
              </View>
            </View>
            <View
              className="w-px bg-gray-100"
              style={{ height: '100%' }}
            />
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">DNI</Text>
              <Text className="text-gray-700 font-bold text-sm">
                {perfil?.dni || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Datos personales */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Datos personales
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <InfoFila
              icono="person-outline"
              label="Nombres"
              valor={`${perfil?.nombres || '—'} ${perfil?.apellidos || ''}`}
            />
            <InfoFila
              icono="card-outline"
              label="DNI"
              valor={perfil?.dni || '—'}
              borde
            />
            <InfoFila
              icono="calendar-outline"
              label="Fecha de nacimiento"
              valor={formatFecha(perfil?.fechaNacimiento)}
              borde
            />
            <InfoFila
              icono="male-female-outline"
              label="Sexo"
              valor={perfil?.sexo === 'MASCULINO' ? 'Masculino' : perfil?.sexo === 'FEMENINO' ? 'Femenino' : 'Otro'}
              borde
            />
          </View>

          {/* Botón editar perfil */}
          <TouchableOpacity
            className="mt-3 bg-[#eef0ff] rounded-2xl py-4 flex-row items-center justify-center"
            onPress={() => navigation.navigate('EditarPerfil')}
          >
            <Ionicons name="pencil-outline" size={18} color="#1a3cff" />
            <Text className="text-[#1a3cff] font-bold ml-2">Editar perfil y carnet</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Configuración */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Configuración
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">

            {/* Notificaciones */}
            <View
              className="flex-row items-center px-4 py-4"
              style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            >
              <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
                <Ionicons name="notifications-outline" size={20} color="#1a3cff" />
              </View>
              <Text className="flex-1 text-gray-800 font-medium">Notificaciones</Text>
              <Switch
                value={notificaciones}
                onValueChange={setNotificaciones}
                trackColor={{ false: '#e5e7eb', true: '#bfcbff' }}
                thumbColor={notificaciones ? '#1a3cff' : '#9ca3af'}
              />
            </View>

            {/* Cambiar contraseña */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
              onPress={() => Alert.alert('Próximamente', 'Cambio de contraseña en desarrollo')}
            >
              <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
                <Ionicons name="lock-closed-outline" size={20} color="#1a3cff" />
              </View>
              <Text className="flex-1 text-gray-800 font-medium">Cambiar contraseña</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            {/* Ayuda */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={() => Alert.alert('Soporte', 'Contáctanos: soporte@subepe.pe')}
            >
              <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
                <Ionicons name="help-circle-outline" size={20} color="#1a3cff" />
              </View>
              <Text className="flex-1 text-gray-800 font-medium">Ayuda y soporte</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón cerrar sesión */}
        <View className="px-5 mt-6 mb-8">
          <TouchableOpacity
            className="bg-white rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
            style={{ borderWidth: 1.5, borderColor: '#fee2e2' }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="text-[#dc2626] font-bold ml-2">Cerrar sesión</Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-300 text-xs mt-4">
            SubePE v1.0.0 · Todos los derechos reservados
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// Componente reutilizable para cada fila de información
function InfoFila({ icono, label, valor, borde = false }) {
  return (
    <View
      className="flex-row items-center px-4 py-4"
      style={borde ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}
    >
      <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
        <Ionicons name={icono} size={18} color="#1a3cff" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-gray-800 font-medium mt-0.5">{valor}</Text>
      </View>
    </View>
  );
}
