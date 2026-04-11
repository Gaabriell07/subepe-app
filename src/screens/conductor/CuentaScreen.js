import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ConductorCuentaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          const { data } = await api.get('/conductor/perfil');
          setPerfil(data);
        } catch (error) {
          console.error('Error cargando perfil conductor:', error);
        } finally {
          setCargando(false);
        }
      };
      cargar();
    }, [])
  );

  const getIniciales = () => {
    const n = perfil?.nombres || usuario?.nombres || '';
    const a = perfil?.apellidos || usuario?.apellidos || '';
    return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

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

        {/* Header */}
        <View className="bg-[#0f172a] px-5 pt-4 pb-10">
          <Text className="text-white text-2xl font-bold mb-6">Mi Cuenta</Text>
          <View className="items-center">
            <View
              className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-3"
              style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }}
            >
              <Text className="text-white text-3xl font-bold">{getIniciales()}</Text>
            </View>
            <Text className="text-white text-xl font-bold">
              {perfil?.nombres} {perfil?.apellidos}
            </Text>
            <Text className="text-white/50 text-sm mt-1">{perfil?.email}</Text>
            <View
              className="mt-3 rounded-full px-4 py-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-white text-xs font-bold">CONDUCTOR</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de info */}
        <View className="mx-5 -mt-6 bg-white rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">DNI</Text>
              <Text className="text-gray-700 font-bold text-sm">{perfil?.dni || '—'}</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">Unidades</Text>
              <Text className="text-[#1a3cff] font-bold text-lg">
                {perfil?.conductor?.unidades?.length ?? 0}
              </Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-400 mb-1">Estado</Text>
              <View className="bg-green-100 rounded-full px-2 py-0.5">
                <Text className="text-green-600 text-xs font-bold">Activo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Datos personales */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Datos personales
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <InfoFila icono="person-outline" label="Nombre completo"
              valor={`${perfil?.nombres || '—'} ${perfil?.apellidos || ''}`} />
            <InfoFila icono="card-outline" label="DNI" valor={perfil?.dni || '—'} borde />
            <InfoFila icono="mail-outline" label="Email" valor={perfil?.email || '—'} borde />
            <InfoFila
              icono="male-female-outline"
              label="Sexo"
              valor={perfil?.sexo === 'MASCULINO' ? 'Masculino' : perfil?.sexo === 'FEMENINO' ? 'Femenino' : 'Otro'}
              borde
            />
          </View>
        </View>

        {/* Ayuda */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Soporte
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
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

        {/* Cerrar sesión */}
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
            SubePE v1.0.0 · Panel Conductor
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
