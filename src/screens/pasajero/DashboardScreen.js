import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TARGET_SELLOS = 30;

const CARD_WIDTH  = Dimensions.get('window').width - 8; 
const CARD_HEIGHT = Math.round(CARD_WIDTH / 1.586);

function formatFechaCorta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [saldo,        setSaldo]        = useState(0);
  const [sellos,       setSellos]       = useState(0);
  const [viajesGratis, setViajesGratis] = useState(0);
  const [viajeActivo,  setViajeActivo]  = useState(null);
  const [comunicados,  setComunicados]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  
  const [alertaActual,   setAlertaActual]   = useState(null); 
  const [showAlertModal, setShowAlertModal] = useState(false);
  const pollingRef = useRef(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [resSaldo, resFidelidad, resViajes, resComunicados] = await Promise.allSettled([
        api.get('/pasajero/saldo'),
        api.get('/pasajero/puntos'),
        api.get('/pasajero/viajes'),
        api.get('/pasajero/comunicados'),
      ]);

      if (resSaldo.status === 'fulfilled')
        setSaldo(resSaldo.value.data.saldo ?? 0);

      if (resFidelidad.status === 'fulfilled') {
        setSellos(resFidelidad.value.data.sellosActuales ?? 0);
        setViajesGratis(resFidelidad.value.data.viajesGratisDisponibles ?? 0);
      }

      if (resViajes.status === 'fulfilled') {
        const viajes = resViajes.value.data;
        setViajeActivo(viajes.find((v) => v.estado === 'EN_CURSO') || null);
      }

      if (resComunicados.status === 'fulfilled')
        setComunicados(resComunicados.value.data);

    } catch (error) {
      console.error('Error dashboard:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  useEffect(() => {
    if (!viajeActivo) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const { data } = await api.get('/pasajero/viaje-activo-estado');
        if (!data.tieneViajeActivo) { setViajeActivo(null); return; }
        if (data.alerta && !showAlertModal) {
          setAlertaActual({ tipo: data.alerta, paraderoFin: data.paraderoFin, viajeId: data.viajeId });
          setShowAlertModal(true);
        }
      } catch {  }
    };

    pollingRef.current = setInterval(poll, 5000);
    return () => { clearInterval(pollingRef.current); pollingRef.current = null; };
  }, [viajeActivo?.id]); 

  const handleDismissAlerta = useCallback(async () => {
    if (alertaActual?.viajeId) {
      try { await api.post(`/pasajero/confirmar-alerta/${alertaActual.viajeId}`); } catch {}
    }
    setShowAlertModal(false);
    setAlertaActual(null);
  }, [alertaActual]);

  const [bajando, setBajando] = useState(false);

  const handleBajar = useCallback(() => {
    Alert.alert(
      '¿Confirmar bajada?',
      'Se registrará que bajaste del bus. Se descontará la tarifa de tu saldo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, bajo ahora',
          onPress: async () => {
            try {
              setBajando(true);
              await api.post('/pasajero/bajar');
              
              setViajeActivo(null);
              setAlertaActual(null);
              setShowAlertModal(false);
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              Alert.alert('¡Bajada registrada!', '¡Que tengas buen día! 🙂');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'No se pudo registrar la bajada');
            } finally {
              setBajando(false);
            }
          },
        },
      ]
    );
  }, []);

  const progreso = useMemo(() => sellos / TARGET_SELLOS, [sellos]);
  const tipoCarnet = usuario?.pasajero?.tipoCarnet || 'NORMAL';
  const carnetLabel = {
    NORMAL: 'Regular', UNIVERSITARIO: 'Universitario', ESCOLAR: 'Escolar',
    POLICIA: 'Policía', MILITAR: 'Militar', DISCAPACITADO: 'Discapacitado',
  }[tipoCarnet] || 'Regular';

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f0f2ff]">
        <ActivityIndicator size="large" color="#1a3cff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {}
        <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Bienvenido</Text>
            <Text className="text-xl font-bold text-[#1a3cff]">
              {usuario?.nombres} {usuario?.apellidos}
            </Text>
          </View>
          {}
          <View style={styles.carnetBadge}>
            <Ionicons name="card-outline" size={13} color="#1a3cff" />
            <Text style={styles.carnetBadgeText}>{carnetLabel}</Text>
          </View>
        </View>

        {}
        <ImageBackground
          source={require('../../../images/tarjeta.png')}
          style={styles.card}
          imageStyle={{ borderRadius: 24 }}
          resizeMode="cover"
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={styles.cardLabel}>Saldo disponible</Text>
            <Text style={styles.cardSaldo}>S/ {saldo.toFixed(2)}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity style={styles.recargarBtn} onPress={() => navigation.navigate('Wallet')}>
                <Ionicons name="add-circle-outline" size={16} color="#1a3cff" />
                <Text style={styles.recargarBtnText}>Recargar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {}
        <View className="flex-row px-5 mt-5 gap-3">

          {}
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 items-center shadow-sm"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('GenerarQR')}
          >
            <View className="bg-[#eef0ff] rounded-xl p-3 mb-2">
              <MaterialCommunityIcons name="qrcode" size={26} color="#1a3cff" />
            </View>
            <Text className="text-xs text-gray-700 font-semibold text-center">Generar QR</Text>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 items-center shadow-sm"
            style={{ flex: 1.4 }}
            onPress={() => navigation.navigate('Viajes')}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="bookmark" size={14} color="#f59e0b" />
              <Text className="text-amber-500 font-bold text-base ml-1">{sellos}/{TARGET_SELLOS}</Text>
            </View>
            {}
            <View style={styles.miniBarra}>
              <View style={[styles.miniBarraFill, { width: `${progreso * 100}%` }]} />
            </View>
            <Text className="text-xs text-gray-500 font-semibold mt-1.5">Sellos</Text>
            {viajesGratis > 0 && (
              <View style={styles.miniGratisBadge}>
                <Text style={styles.miniGratisText}>🎁 {viajesGratis} gratis</Text>
              </View>
            )}
          </TouchableOpacity>

          {}
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 items-center shadow-sm"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('Viajes')}
          >
            <View className="bg-[#eef0ff] rounded-xl p-3 mb-2">
              <Ionicons name="time-outline" size={26} color="#1a3cff" />
            </View>
            <Text className="text-xs text-gray-700 font-semibold text-center">Historial</Text>
          </TouchableOpacity>
        </View>

        {}
        <View className="px-5 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Viaje actual</Text>
            {viajeActivo && (
              <View className="bg-green-500 rounded-full px-3 py-1 flex-row items-center">
                <View className="w-2 h-2 bg-white rounded-full mr-1" />
                <Text className="text-white text-xs font-bold">EN VIVO</Text>
              </View>
            )}
          </View>

          {viajeActivo ? (
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-[#eef0ff] rounded-xl p-2 mr-3">
                    <Ionicons name="bus" size={24} color="#1a3cff" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900">{viajeActivo.ruta?.nombre || 'Ruta CPSA'}</Text>
                    <Text className="text-xs text-gray-400">Destino: {viajeActivo.paraderoFin}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[#1a3cff] font-bold text-base">
                    {viajeActivo.montoDescontado === 0 ? 'GRATIS' : `S/ ${viajeActivo.montoDescontado?.toFixed(2)}`}
                  </Text>
                  <Text className="text-xs text-gray-400">Tarifa</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">{viajeActivo.paraderoInicio}</Text>
                <Text className="text-xs text-[#1a3cff] font-bold">En progreso</Text>
                <Text className="text-xs text-gray-400">{viajeActivo.paraderoFin}</Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full mt-2">
                <View className="h-2 bg-[#1a3cff] rounded-full w-1/2" />
              </View>

              {}
              <TouchableOpacity
                style={[
                  styles.bajarBtn,
                  bajando && { opacity: 0.6 },
                ]}
                onPress={handleBajar}
                disabled={bajando}
                activeOpacity={0.8}
              >
                {bajando ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="hand-left-outline" size={18} color="white" />
                    <Text style={styles.bajarBtnText}>Voy a bajar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-5 shadow-sm flex-row items-center">
              <View className="bg-gray-100 rounded-xl p-3 mr-4">
                <Ionicons name="bus-outline" size={32} color="#9ca3af" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold">Sin viaje activo</Text>
                <Text className="text-gray-400 text-xs mt-0.5">¿Listo para viajar?</Text>
              </View>
              <TouchableOpacity
                className="bg-[#1a3cff] rounded-xl px-4 py-2"
                onPress={() => navigation.navigate('GenerarQR')}
              >
                <Text className="text-white font-bold text-xs">Generar QR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {}
        <View className="px-5 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Comunicados</Text>
            <View className="bg-[#eef0ff] rounded-full px-2 py-0.5">
              <Text className="text-[#1a3cff] text-xs font-bold">CPSA</Text>
            </View>
          </View>

          {comunicados.length === 0 ? (
            <View className="bg-white rounded-2xl p-5 shadow-sm flex-row items-center">
              <View className="bg-[#eef0ff] rounded-xl p-3 mr-4">
                <Ionicons name="megaphone-outline" size={24} color="#1a3cff" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 font-semibold text-sm">Sin novedades</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  Aquí verás avisos de horarios, cambios de ruta y alertas de CPSA
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {comunicados.map((c, i) => (
                <View key={c.id} className="px-4 py-3"
                  style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}>
                  <View className="flex-row items-start">
                    <View className="bg-[#eef0ff] rounded-lg p-1.5 mr-3 mt-0.5">
                      <Ionicons name="megaphone-outline" size={14} color="#1a3cff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold text-sm">{c.titulo}</Text>
                      <Text className="text-gray-500 text-xs mt-1 leading-4" numberOfLines={2}>
                        {c.contenido}
                      </Text>
                      <Text className="text-gray-300 text-xs mt-1.5">{formatFechaCorta(c.creadoEn)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {}
      <Modal
        visible={showAlertModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleDismissAlerta}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard,
            alertaActual?.tipo === 'CERCA_DESTINO' && styles.modalAmbar,
            alertaActual?.tipo === 'EN_DESTINO'    && styles.modalVerde,
            alertaActual?.tipo === 'PASADO'        && styles.modalRojo,
          ]}>
            <Text style={styles.modalEmoji}>
              {alertaActual?.tipo === 'CERCA_DESTINO' && '⚠️'}
              {alertaActual?.tipo === 'EN_DESTINO'    && '🎯'}
              {alertaActual?.tipo === 'PASADO'        && '🚨'}
            </Text>

            <Text style={styles.modalTitulo}>
              {alertaActual?.tipo === 'CERCA_DESTINO' && 'Próximo paradero'}
              {alertaActual?.tipo === 'EN_DESTINO'    && '¡Llegaste!'}
              {alertaActual?.tipo === 'PASADO'        && 'Te pasaste'}
            </Text>

            <Text style={styles.modalMensaje}>
              {alertaActual?.tipo === 'CERCA_DESTINO' && `Falta 1 paradero para tu destino.\n¡Prepárate para bajar en ${alertaActual.paraderoFin}!`}
              {alertaActual?.tipo === 'EN_DESTINO'    && `El bus llegó a ${alertaActual.paraderoFin}.\n¡Baja ahora!`}
              {alertaActual?.tipo === 'PASADO'        && `Te pasaste de ${alertaActual.paraderoFin}.\nSe aplicará un cobro de S/ 2.00 en tu saldo.`}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalBtn,
                alertaActual?.tipo === 'CERCA_DESTINO' && { backgroundColor: '#d97706' },
                alertaActual?.tipo === 'EN_DESTINO'    && { backgroundColor: '#16a34a' },
                alertaActual?.tipo === 'PASADO'        && { backgroundColor: '#dc2626' },
              ]}
              onPress={handleDismissAlerta}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>
                {alertaActual?.tipo === 'PASADO' ? 'Entendido' : 'OK, gracias'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  carnetBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef0ff', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  carnetBadgeText: { color: '#1a3cff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  
  card:            { marginHorizontal: 4, marginTop: 16, width: CARD_WIDTH, height: CARD_HEIGHT, padding: 22 },
  cardLabel:       { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 4 },
  cardSaldo:       { color: 'white', fontSize: 34, fontWeight: '800', marginBottom: 14 },
  recargarBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  recargarBtnText: { color: '#1a3cff', fontWeight: 'bold', marginLeft: 4 },
  miniBarra:       { width: '100%', height: 4, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  miniBarraFill:   { height: 4, backgroundColor: '#1a3cff', borderRadius: 99 },
  miniGratisBadge: { backgroundColor: '#dcfce7', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  miniGratisText:  { color: '#16a34a', fontSize: 10, fontWeight: '700' },
  
  bajarBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 12, marginTop: 14, gap: 8 },
  bajarBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 32, alignItems: 'center' },
  modalAmbar:    { borderTopWidth: 5, borderTopColor: '#f59e0b' },
  modalVerde:    { borderTopWidth: 5, borderTopColor: '#22c55e' },
  modalRojo:     { borderTopWidth: 5, borderTopColor: '#ef4444' },
  modalEmoji:    { fontSize: 52, marginBottom: 12 },
  modalTitulo:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  modalMensaje:  { fontSize: 15, color: '#6b7280', lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  modalBtn:      { width: '100%', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  modalBtnText:  { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
