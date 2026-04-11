import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const TIPO_CARNET_LABEL = {
  REGULAR:       'Regular',
  ESTUDIANTE:    'Estudiante',
  ADULTO_MAYOR:  'Adulto Mayor',
  DISCAPACITADO: 'Discapacitado',
};

export default function EscanearQRScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null); // null | 'exito' | 'error'
  const [infoViaje, setInfoViaje] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [activo, setActivo] = useState(true);
  const procesandoRef = useRef(false);

  // Reiniciar escáner cuando la pantalla vuelve al foco
  useFocusEffect(
    React.useCallback(() => {
      setActivo(true);
      setResultado(null);
      setInfoViaje(null);
      procesandoRef.current = false;
      return () => setActivo(false);
    }, [])
  );

  const handleBarCodeScanned = async ({ data }) => {
    // Evita procesar múltiples escaneos simultáneos
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    setEscaneando(true);
    setActivo(false);

    try {
      const { data: res } = await api.post('/conductor/escanear-qr', {
        qrCodigo: data,
      });

      Vibration.vibrate(200);
      setInfoViaje(res.pasajero);
      setResultado('exito');
    } catch (error) {
      Vibration.vibrate([0, 100, 50, 100]); // patrón de error
      const msg = error.response?.data?.error || 'QR inválido o ya utilizado';
      setMensajeError(msg);
      setResultado('error');
    } finally {
      setEscaneando(false);
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setInfoViaje(null);
    setMensajeError('');
    procesandoRef.current = false;
    setActivo(true);
  };

  // ── Pantalla: sin permiso ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-[#0a0a1a] items-center justify-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-[#0a0a1a] items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
      >
        <MaterialCommunityIcons name="camera-off" size={60} color="rgba(255,255,255,0.4)" />
        <Text className="text-white text-xl font-bold text-center mt-4 mb-2">
          Se requiere acceso a la cámara
        </Text>
        <Text className="text-white/50 text-center mb-8">
          Para escanear el QR del pasajero necesitamos permiso de cámara
        </Text>
        <TouchableOpacity
          className="bg-[#1a3cff] rounded-2xl px-8 py-4"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-base">Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Pantalla: resultado del escaneo ───────────────────────────────────────
  if (resultado) {
    const esExito = resultado === 'exito';
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: esExito ? '#0f172a' : '#0f172a',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Tarjeta de resultado */}
        <View
          className="w-full rounded-3xl p-6 items-center"
          style={{
            backgroundColor: esExito ? '#052e16' : '#1f0a0a',
            borderWidth: 2,
            borderColor: esExito ? '#16a34a' : '#dc2626',
          }}
        >
          {/* Ícono */}
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: esExito ? '#dcfce7' : '#fee2e2' }}
          >
            <Ionicons
              name={esExito ? 'checkmark-circle' : 'close-circle'}
              size={50}
              color={esExito ? '#16a34a' : '#dc2626'}
            />
          </View>

          <Text
            className="text-2xl font-bold mb-1"
            style={{ color: esExito ? '#4ade80' : '#f87171' }}
          >
            {esExito ? '¡QR Válido!' : 'QR Inválido'}
          </Text>

          {esExito && infoViaje ? (
            <>
              <Text className="text-white/60 text-sm mb-6">Pasajero verificado</Text>

              {/* Info del pasajero */}
              <View className="w-full bg-white/10 rounded-2xl p-4 mb-2">
                <InfoFila
                  icono="person-outline"
                  label="Pasajero"
                  valor={`${infoViaje.nombres} ${infoViaje.apellidos}`}
                  claro
                />
                <InfoFila
                  icono="card-outline"
                  label="Tipo carnet"
                  valor={TIPO_CARNET_LABEL[infoViaje.tipoCarnet] || infoViaje.tipoCarnet}
                  claro
                />
                <InfoFila
                  icono="flag-outline"
                  label="Destino"
                  valor={infoViaje.destino}
                  claro
                />
              </View>
            </>
          ) : (
            <Text className="text-white/60 text-center mt-2 mb-6">{mensajeError}</Text>
          )}
        </View>

        {/* Botón para escanear otro */}
        <TouchableOpacity
          className="mt-6 w-full bg-[#1a3cff] rounded-2xl py-4 items-center"
          onPress={reiniciar}
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Escanear otro QR</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-3 w-full py-3 items-center"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white/60">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Pantalla: visor de cámara ─────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 z-10">
        <TouchableOpacity
          className="bg-white/20 rounded-full w-10 h-10 items-center justify-center mr-3"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Escanear QR</Text>
      </View>

      {/* Cámara */}
      {activo && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        >
          {/* Marco de escaneo */}
          <View className="flex-1 items-center justify-center">
            <View
              style={{
                width: 260,
                height: 260,
                position: 'relative',
              }}
            >
              {/* Esquinas del marco */}
              {[
                { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
                { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
                { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
                { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
              ].map((style, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderColor: '#1a3cff',
                    borderRadius: 4,
                    ...style,
                  }}
                />
              ))}

              {/* Overlay oscuro excepto el cuadro */}
              {escaneando && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator size="large" color="#1a3cff" />
                </View>
              )}
            </View>

            <Text className="text-white text-center mt-6 text-sm opacity-70">
              Apunta la cámara al QR del pasajero
            </Text>
          </View>
        </CameraView>
      )}
    </View>
  );
}

function InfoFila({ icono, label, valor, claro }) {
  return (
    <View className="flex-row items-center py-2">
      <View
        className="w-8 h-8 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Ionicons name={icono} size={16} color={claro ? 'rgba(255,255,255,0.7)' : '#1a3cff'} />
      </View>
      <View className="flex-1">
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{label}</Text>
        <Text style={{ color: 'white', fontWeight: '600', marginTop: 1 }}>{valor}</Text>
      </View>
    </View>
  );
}
