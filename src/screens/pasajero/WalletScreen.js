import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MONTOS_RAPIDOS = [5, 10, 20, 50];
const LIMITE_VISTA_PREVIA = 5;
const CARD_WIDTH  = Dimensions.get('window').width - 8; 
const CARD_HEIGHT = Math.round(CARD_WIDTH / 1.586);

export default function WalletScreen() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [saldo, setSaldo] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [monto, setMonto] = useState('');
  const [recargando, setRecargando] = useState(false);
  const [verTodo, setVerTodo] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      // Usamos allSettled para que si /recargas aún no existe en el backend,
      // el saldo y los viajes igual carguen sin crashear
      const [saldoRes, viajesRes, recargasRes] = await Promise.allSettled([
        api.get('/pasajero/saldo'),
        api.get('/pasajero/viajes'),
        api.get('/pasajero/recargas'),
      ]);

      if (saldoRes.status === 'fulfilled') {
        setSaldo(saldoRes.value.data.saldo);
      }

      const historial = [];

      if (viajesRes.status === 'fulfilled') {
        viajesRes.value.data.forEach((v) => {
          historial.push({
            id: `viaje-${v.id}`,
            tipo: 'VIAJE',
            descripcion: v.ruta?.nombre || 'Viaje en bus',
            fecha: v.creadoEn,
            monto: -(v.montoDescontado ?? 0),
          });
          if (v.penalidad) {
            historial.push({
              id: `penalidad-${v.penalidad.id}`,
              tipo: 'PENALIDAD',
              descripcion: v.penalidad.motivo || 'Multa por exceso de tramo',
              fecha: v.penalidad.creadoEn,
              monto: -(v.penalidad.monto ?? 0),
            });
          }
        });
      }

      if (recargasRes.status === 'fulfilled') {
        recargasRes.value.data.forEach((r) => {
          historial.push({
            id: `recarga-${r.id}`,
            tipo: 'RECARGA',
            descripcion: 'Recarga de saldo',
            fecha: r.creadoEn,
            monto: r.monto,
          });
        });
      }

      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setTransacciones(historial);
    } catch (error) {
      console.error('Error cargando wallet:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleRecargar = async () => {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    setRecargando(true);
    try {
      await api.post('/pasajero/recargar', { monto: montoNum });
      setModalVisible(false);
      setMonto('');
      // Refrescamos los datos para que la recarga aparezca en el historial
      await cargarDatos();
      Alert.alert('¡Recarga exitosa!', `Se agregaron S/ ${montoNum.toFixed(2)} a tu billetera`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la recarga');
    } finally {
      setRecargando(false);
    }
  };

  const formatFecha = (fecha) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconoTransaccion = (tipo) => {
    switch (tipo) {
      case 'VIAJE':
        return { nombre: 'bus', color: '#1a3cff', bg: '#eef0ff' };
      case 'RECARGA':
        return { nombre: 'cash-plus', color: '#16a34a', bg: '#dcfce7' };
      case 'PENALIDAD':
        return { nombre: 'alert-circle', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { nombre: 'cash', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const transaccionesVisibles = verTodo
    ? transacciones
    : transacciones.slice(0, LIMITE_VISTA_PREVIA);

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

        {}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-[#1a3cff]">Mi Billetera</Text>
        </View>

        {}
        <ImageBackground
          source={require('../../../images/tarjeta.png')}
          style={{ marginHorizontal: 4, marginTop: 12, width: CARD_WIDTH, height: CARD_HEIGHT, padding: 22 }}
          imageStyle={{ borderRadius: 24 }}
          resizeMode="cover"
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 4 }}>Saldo actual</Text>
            <Text style={{ color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 16 }}>
              S/ {saldo.toFixed(2)}
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 11, alignSelf: 'flex-start' }}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#1a3cff" />
              <Text style={{ color: '#1a3cff', fontWeight: 'bold', marginLeft: 6 }}>Recargar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {}
        <View className="px-5 mt-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Últimas transacciones
          </Text>

          {transacciones.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
              <MaterialCommunityIcons name="wallet-outline" size={40} color="#ccc" />
              <Text className="text-gray-400 mt-2 text-sm">
                Aún no tienes transacciones
              </Text>
            </View>
          ) : (
            <>
              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {transaccionesVisibles.map((item, index) => {
                  const icono = getIconoTransaccion(item.tipo);
                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center px-4 py-4"
                      style={
                        index < transaccionesVisibles.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
                          : {}
                      }
                    >
                      {}
                      <View
                        className="rounded-full w-10 h-10 items-center justify-center mr-3"
                        style={{ backgroundColor: icono.bg }}
                      >
                        <MaterialCommunityIcons
                          name={icono.nombre}
                          size={20}
                          color={icono.color}
                        />
                      </View>

                      {}
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900 text-sm">
                          {item.descripcion}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {formatFecha(item.fecha)}
                        </Text>
                      </View>

                      {}
                      <Text
                        className="font-bold"
                        style={{
                          color:
                            item.monto > 0
                              ? '#16a34a'
                              : item.tipo === 'PENALIDAD'
                              ? '#dc2626'
                              : '#1a3cff',
                        }}
                      >
                        {item.monto > 0 ? '+' : ''}S/{' '}
                        {Math.abs(item.monto).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Botón Ver todo / Ver menos */}
              {transacciones.length > LIMITE_VISTA_PREVIA && (
                <TouchableOpacity
                  className="mt-3 bg-white rounded-2xl py-4 items-center shadow-sm"
                  onPress={() => setVerTodo((prev) => !prev)}
                >
                  <Text className="text-[#1a3cff] font-semibold">
                    {verTodo
                      ? 'Ver menos'
                      : `Ver todo el historial (${transacciones.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">Recargar saldo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ccc" />
              </TouchableOpacity>
            </View>

            {}
            <Text className="text-sm text-gray-500 mb-3">Monto rápido</Text>
            <View className="flex-row justify-between mb-5">
              {MONTOS_RAPIDOS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={{
                    borderWidth: 2,
                    borderColor: monto === String(m) ? '#1a3cff' : '#e5e7eb',
                    backgroundColor: monto === String(m) ? '#eef0ff' : '#ffffff',
                  }}
                  className="flex-1 mx-1 py-3 rounded-2xl items-center"
                  onPress={() => setMonto(String(m))}
                >
                  <Text
                    style={{ color: monto === String(m) ? '#1a3cff' : '#4b5563' }}
                    className="font-bold"
                  >
                    S/{m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {}
            <Text className="text-sm text-gray-500 mb-2">O ingresa otro monto</Text>
            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-6">
              <Text className="text-gray-500 font-bold mr-2">S/</Text>
              <TextInput
                className="flex-1 text-gray-900 font-bold text-lg"
                placeholder="0.00"
                keyboardType="numeric"
                value={monto}
                onChangeText={setMonto}
              />
            </View>

            <TouchableOpacity
              className="bg-[#1a3cff] rounded-2xl py-4 items-center"
              onPress={handleRecargar}
              disabled={recargando}
            >
              {recargando ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Confirmar recarga
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
