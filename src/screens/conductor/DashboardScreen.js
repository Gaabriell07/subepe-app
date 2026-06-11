import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TIPO_CARNET_COLOR = {
  NORMAL:        { bg: '#eef0ff', text: '#1a3cff' },
  UNIVERSITARIO: { bg: '#dcfce7', text: '#16a34a' },
  ESCOLAR:       { bg: '#dcfce7', text: '#16a34a' },
  POLICIA:       { bg: '#fff7ed', text: '#ea580c' },
  MILITAR:       { bg: '#fff7ed', text: '#ea580c' },
  ADULTO_MAYOR:  { bg: '#fef9c3', text: '#ca8a04' },
  DISCAPACITADO: { bg: '#fee2e2', text: '#dc2626' },
};

function useEntrance(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  };
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.7, duration: 650, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.turnoDot, { transform: [{ scale }] }]} />;
}

export default function ConductorDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const [saldo,        setSaldo]        = useState(0);
  const [pasajeros,    setPasajeros]    = useState([]);
  const [validadosHoy, setValidadosHoy] = useState(0);
  const [cargando,     setCargando]     = useState(true);
  const [turno,        setTurno]        = useState(null);

  const headerStyle = useEntrance(0);
  const avatarScale = useRef(new Animated.Value(0)).current;
  const turnoStyle  = useEntrance(200);
  const qrStyle     = useEntrance(300);
  const statsStyle  = useEntrance(380);
  const listStyle   = useEntrance(460);

  useEffect(() => {
    Animated.spring(avatarScale, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [resSaldo, resPasajeros, resTurno] = await Promise.allSettled([
        api.get('/conductor/saldo'),
        api.get('/conductor/pasajeros-activos'),
        api.get('/conductor/turno-activo'),
      ]);
      if (resSaldo.status === 'fulfilled')     setSaldo(resSaldo.value.data.saldo ?? 0);
      if (resPasajeros.status === 'fulfilled') {
        const { activos = [], validadosHoy: vhoy = 0 } = resPasajeros.value.data;
        setPasajeros(activos);
        setValidadosHoy(vhoy);
      }
      if (resTurno.status === 'fulfilled') setTurno(resTurno.value.data);
    } catch (error) {
      console.error('Error cargando dashboard conductor:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  const getIniciales = () => {
    const n = usuario?.nombres || '';
    const a = usuario?.apellidos || '';
    return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
  };

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header + Saldo ───────────────────────────────────────────────── */}
        <Animated.View style={headerStyle} className="px-5 pt-5 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-gray-400 text-sm">Bienvenido,</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {usuario?.nombres?.split(' ')[0] || 'Conductor'}
              </Text>
            </View>
            {}
            <Animated.View
              style={{ transform: [{ scale: avatarScale }] }}
              className="w-12 h-12 rounded-full bg-[#1a3cff] items-center justify-center"
            >
              <Text className="text-white font-bold text-lg">{getIniciales()}</Text>
            </Animated.View>
          </View>

          {}
          <View className="bg-[#1a3cff] rounded-3xl p-5">
            <Text className="text-white/70 text-sm mb-1">Comisiones acumuladas</Text>
            <Text className="text-white text-4xl font-bold mb-4">
              S/ {saldo.toFixed(2)}
            </Text>
            <View className="flex-row items-center">
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Text className="text-white text-xs font-bold">CONDUCTOR ACTIVO</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {}
        <Animated.View style={turnoStyle} className="px-5 mb-4">
          {turno?.turnoActivo ? (
            <TouchableOpacity
              style={styles.turnoBannerActivo}
              onPress={() => navigation.navigate('TurnoActivo', { paraderoActualIdx: turno.paraderoActualIdx ?? 0 })}
              activeOpacity={0.85}
            >
              <PulseDot />
              <View style={{ flex: 1 }}>
                <Text style={styles.turnoBannerLabel}>TURNO EN CURSO</Text>
                <Text style={styles.turnoBannerParadero}>Estás en: {turno.paraderoActual}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4ade80" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.turnoIniciarBtn}
              onPress={async () => {
                try {
                  const { data } = await api.post('/conductor/iniciar-turno');
                  setTurno({ turnoActivo: true, paraderoActualIdx: 0, paraderoActual: data.paraderoActual });
                  navigation.navigate('TurnoActivo', { paraderoActualIdx: 0 });
                } catch (e) {
                  console.error(e);
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.turnoIniciarText}>Iniciar turno</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {}
        <Animated.View style={qrStyle} className="px-5 mb-6">
          <TouchableOpacity
            className="bg-[#1a3cff] rounded-2xl py-5 flex-row items-center justify-center shadow-sm"
            style={{ elevation: 4 }}
            onPress={() => navigation.navigate('EscanearQR')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
            <Text className="text-white text-lg font-bold ml-3">Escanear QR de pasajero</Text>
          </TouchableOpacity>
        </Animated.View>

        {}
        <Animated.View style={statsStyle} className="px-5 flex-row mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 items-center mr-3 shadow-sm">
            <View className="bg-[#eef0ff] rounded-xl p-2 mb-2">
              <Ionicons name="people-outline" size={22} color="#1a3cff" />
            </View>
            <Text className="text-2xl font-bold text-[#1a3cff]">{pasajeros.length}</Text>
            <Text className="text-xs text-gray-400 mt-1">A bordo ahora</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <View className="bg-[#eef0ff] rounded-xl p-2 mb-2">
              <Ionicons name="checkmark-circle-outline" size={22} color="#1a3cff" />
            </View>
            <Text className="text-2xl font-bold text-[#1a3cff]">{validadosHoy}</Text>
            <Text className="text-xs text-gray-400 mt-1">Validados hoy</Text>
          </View>
        </Animated.View>

        {}
        <Animated.View style={listStyle} className="px-5 mb-8">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Pasajeros a bordo
          </Text>

          {cargando ? (
            <ActivityIndicator color="#1a3cff" />
          ) : pasajeros.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
              <Ionicons name="bus-outline" size={40} color="#ccc" />
              <Text className="text-gray-400 mt-2 text-sm">Sin pasajeros activos</Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {pasajeros.map((viaje, idx) => {
                const tipoCarnet = viaje.pasajero?.tipoCarnet || 'NORMAL';
                const color = TIPO_CARNET_COLOR[tipoCarnet] ?? TIPO_CARNET_COLOR.NORMAL;
                return (
                  <View
                    key={viaje.id}
                    className="flex-row items-center px-4 py-4"
                    style={idx < pasajeros.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
                      : {}}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#eef0ff' }}>
                      <Text className="text-[#1a3cff] font-bold">
                        {viaje.pasajero?.usuario?.nombres?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800">
                        {viaje.pasajero?.usuario?.nombres} {viaje.pasajero?.usuario?.apellidos}
                      </Text>
                      <Text className="text-xs text-gray-400">Hasta: {viaje.paraderoFin}</Text>
                    </View>
                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: color.bg }}>
                      <Text className="text-xs font-bold" style={{ color: color.text }}>{tipoCarnet}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  turnoDot:            { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80' },
  turnoBannerActivo:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  turnoBannerLabel:    { color: '#4ade80', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  turnoBannerParadero: { color: '#166534', fontSize: 14, fontWeight: '700', marginTop: 2 },
  turnoIniciarBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 18, paddingVertical: 16, gap: 10 },
  turnoIniciarText:    { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
