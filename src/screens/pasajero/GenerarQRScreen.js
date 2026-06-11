import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

const PARADEROS = [
  'SANTA ROSA',
  'PROC. DE LA INDEPENDENCIA',
  'ACHO',
  'PIZARRO - CAQUETA',
  'ALFONSO UGARTE',
  'AV. BRASIL',
  'AV. DEL EJERCITO',
  'PARDO - MIRAFLORES',
  'AV. BENAVIDES',
  'TOMAS MARSANO',
  'SAN JUAN DE MIRAFLORES',
  'VILLA EL SALVADOR',
  'LAS PALMAS',
];

const BANDAS_PRECIO = {
  0: [ 
    { hasta: 2, precio: 2.00 },   
    { hasta: 3, precio: 3.00 },   
    { hasta: 7, precio: 4.00 },   
    { hasta: 12, precio: 5.00 },  
  ],
  1: [ 
    { hasta: 3, precio: 2.00 },   
    { hasta: 5, precio: 3.00 },   
    { hasta: 7, precio: 4.00 },   
    { hasta: 12, precio: 5.00 },  
  ],
  2: [ 
    { hasta: 4, precio: 2.00 },   
    { hasta: 5, precio: 3.00 },   
    { hasta: 8, precio: 4.00 },   
    { hasta: 12, precio: 5.00 },  
  ],
  3: [ 
    { hasta: 4, precio: 2.00 },   
    { hasta: 6, precio: 3.00 },   
    { hasta: 8, precio: 4.00 },   
    { hasta: 12, precio: 5.00 },  
  ],
  4: [ 
    { hasta: 6, precio: 2.00 },   
    { hasta: 7, precio: 3.00 },   
    { hasta: 9, precio: 4.00 },   
    { hasta: 12, precio: 5.00 },  
  ],
  5: [ 
    { hasta: 7, precio: 2.00 },   
    { hasta: 9, precio: 3.00 },   
    { hasta: 10, precio: 4.00 },  
    { hasta: 12, precio: 5.00 },  
  ],
  6: [ 
    { hasta: 8, precio: 2.00 },   
    { hasta: 9, precio: 3.00 },   
    { hasta: 10, precio: 4.00 },  
    { hasta: 12, precio: 5.00 },  
  ],
  7: [ 
    { hasta: 8, precio: 2.00 },   
    { hasta: 10, precio: 3.00 },  
    { hasta: 12, precio: 4.00 },  
  ],
  8: [ 
    { hasta: 9, precio: 2.00 },   
    { hasta: 10, precio: 3.00 },  
    { hasta: 12, precio: 4.00 },  
  ],
  9: [ 
    { hasta: 10, precio: 2.00 },  
    { hasta: 12, precio: 3.00 },  
  ],
  10: [ 
    { hasta: 11, precio: 2.00 },  
    { hasta: 12, precio: 3.00 },  
  ],
  11: [ 
    { hasta: 12, precio: 2.00 },  
  ],
};

function calcularPrecio(idxInicio, idxFin) {
  if (idxFin <= idxInicio) return 0;
  const bandas = BANDAS_PRECIO[idxInicio];
  if (!bandas) return 2.00;
  for (const banda of bandas) {
    if (idxFin <= banda.hasta) return banda.precio;
  }
  return 5.00;
}

export default function GenerarQRScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [idxInicio, setIdxInicio] = useState(null);
  const [idxFin, setIdxFin] = useState(null);
  const [sentido, setSentido] = useState('ida');
  const [qrImagen, setQrImagen] = useState(null);
  const [viaje, setViaje] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [rutaId, setRutaId] = useState(null);
  const [paso, setPaso] = useState('inicio'); 

  const PARADEROS_LIST = sentido === 'ida' ? PARADEROS : [...PARADEROS].reverse();

  const cargarRuta = useCallback(async () => {
    try {
      const { data } = await api.get('/rutas');
      if (data && data.length > 0) {
        setRutaId(data[0].id); 
      }
    } catch (error) {
      console.error('Error cargando rutas:', error);
    }
  }, []);

  React.useEffect(() => {
    cargarRuta();
  }, [cargarRuta]);

  const realIdxInicio = idxInicio !== null ? (sentido === 'ida' ? idxInicio : PARADEROS.length - 1 - idxInicio) : null;
  const realIdxFin = idxFin !== null ? (sentido === 'ida' ? idxFin : PARADEROS.length - 1 - idxFin) : null;

  const precio = realIdxInicio !== null && realIdxFin !== null
    ? calcularPrecio(Math.min(realIdxInicio, realIdxFin), Math.max(realIdxInicio, realIdxFin))
    : 0;

  const handleGenerarQR = async () => {
    if (!rutaId) {
      Alert.alert('Error', 'No se pudo cargar la ruta. Intenta de nuevo.');
      return;
    }
    setGenerando(true);
    try {
      const { data } = await api.post('/pasajero/generar-qr', {
        rutaId,
        paraderoInicio: PARADEROS_LIST[idxInicio],
        paraderoFin: PARADEROS_LIST[idxFin],
        monto: precio,
      });
      setQrImagen(data.qrImagen);
      setViaje(data.viaje);
      setPaso('qr');
    } catch (error) {
      const msg = error.response?.data?.error || 'No se pudo generar el QR';
      Alert.alert('Error', msg);
    } finally {
      setGenerando(false);
    }
  };

  const reiniciar = () => {
    setIdxInicio(null);
    setIdxFin(null);
    setQrImagen(null);
    setViaje(null);
    setPaso('inicio');
  };

  if (paso === 'qr' && qrImagen) {
    return (
      <View
        className="flex-1 bg-[#f0f2ff] items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <View className="w-full bg-white rounded-3xl p-6 items-center shadow-sm">
          <View className="bg-green-100 rounded-full p-3 mb-3">
            <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">¡QR listo!</Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            Muéstraselo al conductor para abordar el bus
          </Text>

          {}
          <View className="bg-white rounded-2xl p-3 shadow-sm mb-4"
            style={{ borderWidth: 2, borderColor: '#eef0ff' }}>
            <Image
              source={{ uri: qrImagen }}
              style={{ width: 220, height: 220 }}
              resizeMode="contain"
            />
          </View>

          {}
          <View className="w-full bg-[#f0f2ff] rounded-2xl p-4 mb-6">
            <FilaDetalle icono="location-outline" label="Desde" valor={PARADEROS_LIST[idxInicio]} />
            <FilaDetalle icono="flag-outline" label="Hasta" valor={PARADEROS_LIST[idxFin]} />
            <FilaDetalle
              icono="cash-outline"
              label="Tarifa"
              valor={`S/ ${precio.toFixed(2)}`}
              destacado
            />
          </View>

          <Text className="text-xs text-gray-400 mb-6 text-center">
            Este QR expira cuando el conductor lo escanee
          </Text>

          <TouchableOpacity
            className="w-full bg-[#1a3cff] rounded-2xl py-4 items-center mb-3"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-bold">Ir al inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-full py-3 items-center" onPress={reiniciar}>
            <Text className="text-[#1a3cff] font-semibold">Generar otro QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>
      {}
      <View className="flex-row items-center px-5 pt-4 pb-4">
        <TouchableOpacity
          className="bg-white rounded-full w-10 h-10 items-center justify-center shadow-sm mr-3"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#1a3cff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1a3cff]">Generar QR</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">

        {}
        <View className="bg-[#1a3cff] rounded-2xl px-4 py-3 flex-row items-center mb-4">
          <Ionicons name="bus" size={20} color="white" />
          <Text className="text-white font-bold ml-2 flex-1">
            Santa Rosa — Las Palmas (CPSA)
          </Text>
        </View>

        {}
        <View className="flex-row mb-6 bg-white rounded-2xl p-1 shadow-sm">
          <TouchableOpacity 
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: sentido === 'ida' ? '#eef0ff' : 'transparent' }}
            onPress={() => { setSentido('ida'); setIdxInicio(null); setIdxFin(null); }}
          >
            <Text className="font-bold" style={{ color: sentido === 'ida' ? '#1a3cff' : '#9ca3af' }}>IDA (Norte a Sur)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: sentido === 'vuelta' ? '#eef0ff' : 'transparent' }}
            onPress={() => { setSentido('vuelta'); setIdxInicio(null); setIdxFin(null); }}
          >
            <Text className="font-bold" style={{ color: sentido === 'vuelta' ? '#1a3cff' : '#9ca3af' }}>VUELTA (Sur a Norte)</Text>
          </TouchableOpacity>
        </View>

        {}
        <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
          ¿Desde dónde subes?
        </Text>
        <View className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
          {PARADEROS_LIST.slice(0, -1).map((p, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-row items-center px-4 py-3"
              style={idx < PARADEROS_LIST.length - 2
                ? { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
                : {}}
              onPress={() => {
                setIdxInicio(idx);
                setIdxFin(null); 
              }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: idxInicio === idx ? '#1a3cff' : '#eef0ff' }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: idxInicio === idx ? 'white' : '#1a3cff' }}
                >
                  {idx + 1}
                </Text>
              </View>
              <Text
                className="flex-1 font-medium"
                style={{ color: idxInicio === idx ? '#1a3cff' : '#374151' }}
              >
                {p}
              </Text>
              {idxInicio === idx && (
                <Ionicons name="checkmark-circle" size={20} color="#1a3cff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {}
        {idxInicio !== null && (
          <>
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
              ¿Hasta dónde vas?
            </Text>
            <View className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
              {PARADEROS_LIST.slice(idxInicio + 1).map((p, i) => {
                const idx = idxInicio + 1 + i;
                
                const realIdxI = sentido === 'ida' ? idxInicio : PARADEROS.length - 1 - idxInicio;
                const realIdxF = sentido === 'ida' ? idx : PARADEROS.length - 1 - idx;
                const precioBanda = calcularPrecio(Math.min(realIdxI, realIdxF), Math.max(realIdxI, realIdxF));

                return (
                  <TouchableOpacity
                    key={idx}
                    className="flex-row items-center px-4 py-3"
                    style={i < PARADEROS_LIST.length - idxInicio - 2
                      ? { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
                      : {}}
                    onPress={() => setIdxFin(idx)}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: idxFin === idx ? '#16a34a' : '#f0fdf4' }}
                    >
                      <Ionicons
                        name="flag"
                        size={14}
                        color={idxFin === idx ? 'white' : '#16a34a'}
                      />
                    </View>
                    <Text
                      className="flex-1 font-medium"
                      style={{ color: idxFin === idx ? '#16a34a' : '#374151' }}
                    >
                      {p}
                    </Text>
                    <Text
                      className="text-xs font-bold mr-2"
                      style={{ color: idxFin === idx ? '#16a34a' : '#9ca3af' }}
                    >
                      S/ {precioBanda.toFixed(2)}
                    </Text>
                    {idxFin === idx && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {}
        {idxInicio !== null && idxFin !== null && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-8">
            <Text className="text-sm font-bold text-gray-400 mb-3">Resumen del viaje</Text>
            <FilaDetalle icono="location-outline" label="Desde" valor={PARADEROS_LIST[idxInicio]} />
            <FilaDetalle icono="flag-outline" label="Hasta" valor={PARADEROS_LIST[idxFin]} />
            <FilaDetalle
              icono="cash-outline"
              label="Tarifa"
              valor={`S/ ${precio.toFixed(2)}`}
              destacado
            />
            <TouchableOpacity
              className="bg-[#1a3cff] rounded-2xl py-4 items-center mt-4"
              onPress={handleGenerarQR}
              disabled={generando}
            >
              {generando ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="qr-code-outline" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Generar QR de abordaje</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilaDetalle({ icono, label, valor, destacado = false }) {
  return (
    <View className="flex-row items-center py-2">
      <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
        <Ionicons name={icono} size={16} color="#1a3cff" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text
          className="font-semibold mt-0.5"
          style={{ color: destacado ? '#1a3cff' : '#1f2937' }}
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}
