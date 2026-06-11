import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, ActivityIndicator, Vibration, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const PARADEROS = [
  'SANTA ROSA', 'PROC. DE LA INDEPENDENCIA', 'ACHO', 'PIZARRO - CAQUETA',
  'ALFONSO UGARTE', 'AV. BRASIL', 'AV. DEL EJERCITO', 'PARDO - MIRAFLORES',
  'AV. BENAVIDES', 'TOMAS MARSANO', 'SAN JUAN DE MIRAFLORES',
  'VILLA EL SALVADOR', 'LAS PALMAS',
];

function ResultadoBanner({ resultado, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    if (!resultado) return;
    
    Animated.spring(slideAnim, {
      toValue: 0, tension: 120, friction: 10, useNativeDriver: true,
    }).start();
    
    const t = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 120, duration: 300, useNativeDriver: true,
      }).start(onDismiss);
    }, 3500);
    return () => clearTimeout(t);
  }, [resultado]);

  if (!resultado) return null;

  const ok = resultado.tipo === 'exito';
  return (
    <Animated.View
      style={[
        styles.banner,
        ok ? styles.bannerOk : styles.bannerErr,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.bannerIcono}>
        <Ionicons
          name={ok ? 'checkmark-circle' : 'close-circle'}
          size={28}
          color={ok ? '#4ade80' : '#f87171'}
        />
      </View>
      <View style={{ flex: 1 }}>
        {ok && resultado.pasajero ? (
          <>
            <Text style={styles.bannerNombre}>
              {resultado.pasajero.nombres} {resultado.pasajero.apellidos}
            </Text>
            <Text style={styles.bannerSub}>
              {resultado.pasajero.tipoCarnet} · Destino: {resultado.pasajero.destino}
            </Text>
          </>
        ) : (
          <Text style={styles.bannerNombre}>{resultado.mensaje}</Text>
        )}
      </View>
    </Animated.View>
  );
}

function ModalParadero({ visible, paraderoActualIdx, onSeleccionar, onClose, guardando }) {
  const [sentido, setSentido] = useState('ida');
  const PARADEROS_LIST = sentido === 'ida' ? PARADEROS : [...PARADEROS].reverse();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {}
          <View style={styles.handle} />
          <Text style={styles.modalTitulo}>¿En qué paradero estás?</Text>
          <Text style={styles.modalSub}>Selecciona el paradero actual del bus</Text>

          <View style={{ flexDirection: 'row', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, pading: 4 }}>
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: sentido === 'ida' ? '#1a3cff' : 'transparent', borderRadius: 10 }}
              onPress={() => setSentido('ida')}
            >
              <Text style={{ color: sentido === 'ida' ? 'white' : 'gray', fontWeight: 'bold' }}>Ida</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: sentido === 'vuelta' ? '#1a3cff' : 'transparent', borderRadius: 10 }}
              onPress={() => setSentido('vuelta')}
            >
              <Text style={{ color: sentido === 'vuelta' ? 'white' : 'gray', fontWeight: 'bold' }}>Vuelta</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={PARADEROS_LIST}
            keyExtractor={(_, i) => String(i)}
            style={{ width: '100%', marginTop: 12 }}
            renderItem={({ item, index }) => {
              
              const trueIdx = sentido === 'ida' ? index : PARADEROS.length - 1 - index;
              const activo = trueIdx === paraderoActualIdx;
              return (
                <TouchableOpacity
                  style={[styles.paraderoItem, activo && styles.paraderoItemActivo]}
                  onPress={() => onSeleccionar(trueIdx)}
                  disabled={guardando}
                >
                  <View style={[styles.paraderoNum, activo && styles.paraderoNumActivo]}>
                    <Text style={{ color: activo ? 'white' : '#1a3cff', fontWeight: 'bold', fontSize: 12 }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.paraderoNombre, activo && { color: '#1a3cff', fontWeight: '700' }]}>
                    {item}
                  </Text>
                  {activo && <Ionicons name="checkmark-circle" size={18} color="#1a3cff" />}
                  {guardando && activo && <ActivityIndicator size="small" color="#1a3cff" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function EscanearQRScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [turnoActivo,      setTurnoActivo]      = useState(false);
  const [paraderoActualIdx, setParaderoActualIdx] = useState(0);
  const [iniciandoTurno,   setIniciandoTurno]   = useState(false);
  const [guardandoParadero, setGuardandoParadero] = useState(false);
  const [showModalParadero, setShowModalParadero] = useState(false);

  const [escaneando,  setEscaneando]  = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(true);
  const [resultado,   setResultado]   = useState(null); 
  const procesandoRef = useRef(false);

  const soundSuccessRef = useRef(null);
  const soundErrorRef = useRef(null);

  useEffect(() => {
    async function loadSounds() {
      try {
        const { sound: sSuccess } = await Audio.Sound.createAsync(require('../../../../assets/sounds/success.wav'));
        const { sound: sError } = await Audio.Sound.createAsync(require('../../../../assets/sounds/error.wav'));
        soundSuccessRef.current = sSuccess;
        soundErrorRef.current = sError;
      } catch (e) {
        console.warn('Error al cargar sonidos', e);
      }
    }
    loadSounds();
    return () => {
      if (soundSuccessRef.current) soundSuccessRef.current.unloadAsync();
      if (soundErrorRef.current) soundErrorRef.current.unloadAsync();
    };
  }, []);

  useFocusEffect(useCallback(() => {
    cargarTurno();
    setCamaraActiva(true);
    procesandoRef.current = false;
  }, []));

  const cargarTurno = async () => {
    try {
      const { data } = await api.get('/conductor/turno-activo');
      setTurnoActivo(data.turnoActivo);
      if (data.turnoActivo) setParaderoActualIdx(data.paraderoActualIdx ?? 0);
    } catch {}
  };

  const handleIniciarTurno = async () => {
    try {
      setIniciandoTurno(true);
      await api.post('/conductor/iniciar-turno');
      setTurnoActivo(true);
      setParaderoActualIdx(0);
    } catch (e) {
      alert(e?.response?.data?.error || 'No se pudo iniciar el turno');
    } finally {
      setIniciandoTurno(false);
    }
  };

  const handleSeleccionarParadero = async (idx) => {
    try {
      setGuardandoParadero(true);
      await api.post('/conductor/siguiente-paradero', { paraderoIdx: idx });
      setParaderoActualIdx(idx);
      setShowModalParadero(false);
    } catch (e) {
      alert(e?.response?.data?.error || 'No se pudo actualizar el paradero');
    } finally {
      setGuardandoParadero(false);
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (procesandoRef.current || !turnoActivo) return;
    procesandoRef.current = true;
    setEscaneando(true);

    try {
      const { data: res } = await api.post('/conductor/escanear-qr', { qrCodigo: data });
      Vibration.vibrate(200);
      if (soundSuccessRef.current) await soundSuccessRef.current.replayAsync();
      setResultado({ tipo: 'exito', pasajero: res.pasajero });
    } catch (error) {
      Vibration.vibrate([0, 100, 50, 100]);
      if (soundErrorRef.current) await soundErrorRef.current.replayAsync();
      const msg = error.response?.data?.error || 'QR inválido o ya utilizado';
      setResultado({ tipo: 'error', mensaje: msg });
    } finally {
      setEscaneando(false);
      
      setTimeout(() => {
        procesandoRef.current = false;
      }, 2000);
    }
  };

  if (!permission) return <View style={styles.fullBlack}><ActivityIndicator color="white" /></View>;

  if (!permission.granted) {
    return (
      <View style={[styles.fullBlack, styles.center, { paddingTop: insets.top + 20, paddingHorizontal: 32 }]}>
        <MaterialCommunityIcons name="camera-off" size={60} color="rgba(255,255,255,0.4)" />
        <Text style={styles.permTitle}>Se requiere acceso a la cámara</Text>
        <Text style={styles.permSub}>Para escanear el QR del pasajero necesitamos permiso de cámara</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.fullBlack, { paddingTop: insets.top }]}>

      {}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={16} color="#4f7cff" />
          <Text style={styles.headerParadero} numberOfLines={1}>
            {turnoActivo ? PARADEROS[paraderoActualIdx] : 'Sin turno activo'}
          </Text>
        </View>

        {turnoActivo ? (
          <TouchableOpacity
            style={styles.paraderoBtn}
            onPress={() => setShowModalParadero(true)}
          >
            <Text style={styles.paraderoBtnText}>Paradero</Text>
            <Ionicons name="chevron-down" size={14} color="#4f7cff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iniciarBtn}
            onPress={handleIniciarTurno}
            disabled={iniciandoTurno}
          >
            {iniciandoTurno
              ? <ActivityIndicator size="small" color="white" />
              : <Text style={styles.iniciarBtnText}>Iniciar turno</Text>}
          </TouchableOpacity>
        )}
      </View>

      {}
      <View style={{ flex: 1 }}>
        {camaraActiva && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={turnoActivo ? handleBarCodeScanned : undefined}
          />
        )}

        {}
        {!turnoActivo && (
          <View style={styles.overlayInactivo}>
            <MaterialCommunityIcons name="bus-clock" size={56} color="rgba(255,255,255,0.3)" />
            <Text style={styles.overlayText}>Inicia tu turno para{'\n'}empezar a escanear</Text>
          </View>
        )}

        {}
        {turnoActivo && (
          <View style={styles.marcoContainer}>
            <View style={styles.marco}>
              {[
                { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
                { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
                { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
                { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
              ].map((s, i) => (
                <View key={i} style={[styles.esquina, s]} />
              ))}
              {escaneando && (
                <View style={styles.escaneandoOverlay}>
                  <ActivityIndicator size="large" color="#4f7cff" />
                </View>
              )}
            </View>
            <Text style={styles.marcoHint}>
              {escaneando ? 'Procesando...' : 'Apunta al QR del pasajero'}
            </Text>
          </View>
        )}
      </View>

      {}
      <ResultadoBanner
        resultado={resultado}
        onDismiss={() => setResultado(null)}
      />

      {}
      <ModalParadero
        visible={showModalParadero}
        paraderoActualIdx={paraderoActualIdx}
        onSeleccionar={handleSeleccionarParadero}
        onClose={() => setShowModalParadero(false)}
        guardando={guardandoParadero}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullBlack: { flex: 1, backgroundColor: '#0a0a1a' },
  center:    { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(10,10,26,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  headerParadero: { color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 6 },
  paraderoBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(79,124,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(79,124,255,0.3)' },
  paraderoBtnText:{ color: '#4f7cff', fontSize: 13, fontWeight: '700', marginRight: 4 },
  iniciarBtn:     { backgroundColor: '#1a3cff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  iniciarBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },

  overlayInactivo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,26,0.75)' },
  overlayText:     { color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center', marginTop: 16, lineHeight: 24 },

  marcoContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  marco:          { width: 250, height: 250, position: 'relative' },
  esquina:        { position: 'absolute', width: 36, height: 36, borderColor: '#4f7cff', borderRadius: 4 },
  escaneandoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  marcoHint:      { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 20, textAlign: 'center' },

  banner:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 12, marginBottom: 12, borderRadius: 18 },
  bannerOk: { backgroundColor: '#052e16', borderWidth: 1.5, borderColor: '#16a34a' },
  bannerErr:{ backgroundColor: '#1f0a0a', borderWidth: 1.5, borderColor: '#dc2626' },
  bannerIcono:  { marginRight: 12 },
  bannerNombre: { color: 'white', fontWeight: '700', fontSize: 14 },
  bannerSub:    { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, maxHeight: '80%' },
  handle:    { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, alignSelf: 'center', marginBottom: 20 },
  modalTitulo: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub:    { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 },
  paraderoItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  paraderoItemActivo:{ backgroundColor: 'rgba(79,124,255,0.1)', borderRadius: 12, paddingHorizontal: 10, borderBottomWidth: 0, marginVertical: 2 },
  paraderoNum:       { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(79,124,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paraderoNumActivo: { backgroundColor: '#1a3cff' },
  paraderoNombre:    { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  cancelBtn:     { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  permTitle: { color: 'white', fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 20, marginBottom: 8 },
  permSub:   { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 },
  permBtn:    { backgroundColor: '#1a3cff', borderRadius: 18, paddingHorizontal: 32, paddingVertical: 14 },
  permBtnText:{ color: 'white', fontWeight: 'bold', fontSize: 15 },
});
