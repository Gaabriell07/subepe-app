import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../services/api';

// ─── Config de estados de viaje ───────────────────────────────────────────────
const ESTADO_CONFIG = {
  PENDIENTE:  { label: 'Pendiente',  bg: '#fef9c3', text: '#ca8a04', icono: 'time-outline',             desc: 'QR listo para mostrar' },
  EN_CURSO:   { label: 'En curso',   bg: '#dcfce7', text: '#16a34a', icono: 'bus-outline',              desc: 'Viaje en progreso' },
  COMPLETADO: { label: 'Completado', bg: '#eef0ff', text: '#1a3cff', icono: 'checkmark-circle-outline', desc: 'Viaje finalizado' },
  PENALIZADO: { label: 'Penalizado', bg: '#fee2e2', text: '#dc2626', icono: 'warning-outline',          desc: 'Viaje con penalidad' },
};

const TARGET_SELLOS = 30;
const FILTROS_VIAJE = ['Todos', 'Pendiente', 'En curso', 'Completado'];
const FILTRO_MAP = { 'Pendiente': 'PENDIENTE', 'En curso': 'EN_CURSO', 'Completado': 'COMPLETADO' };

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sello animado (memoizado) ────────────────────────────────────────────────
const Sello = memo(function Sello({ activo, delay }) {
  const scaleAnim   = useRef(new Animated.Value(activo ? 0 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(activo ? 0 : 0.3)).current;

  useEffect(() => {
    if (!activo) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 180, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [activo]);

  return (
    <Animated.View
      style={[
        styles.sello,
        activo ? styles.selloActivo : styles.selloVacio,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      {activo && <Ionicons name="bus" size={12} color="white" />}
    </Animated.View>
  );
});

// ─── Tarjeta de fidelidad ─────────────────────────────────────────────────────
function TarjetaFidelidad({ datos, onCanjear, canjeando }) {
  const { sellosActuales = 0, viajesGratisDisponibles = 0, totalViajes = 0 } = datos;
  const progreso = sellosActuales / TARGET_SELLOS;
  const barraAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(barraAnim, { toValue: progreso, duration: 900, delay: 300, useNativeDriver: false }).start();
    if (viajesGratisDisponibles > 0) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])).start();
    }
  }, [progreso, viajesGratisDisponibles]);

  const barraWidth = barraAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const sellos = useMemo(() => Array.from({ length: TARGET_SELLOS }, (_, i) => i < sellosActuales), [sellosActuales]);

  return (
    <View className="mx-5 mb-5">
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardSubtitle}>CPSA · TARJETA FIDELIDAD</Text>
            <Text style={styles.cardTitle}>Mis Viajes</Text>
          </View>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeNum}>{totalViajes}</Text>
            <Text style={styles.cardBadgeSub}>viajes</Text>
          </View>
        </View>

        {/* Grid sellos */}
        <View style={styles.sellosGrid}>
          {sellos.map((activo, i) => (
            <Sello key={i} activo={activo} delay={i * 25} />
          ))}
        </View>

        {/* Barra progreso */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>{sellosActuales} / {TARGET_SELLOS} viajes</Text>
            <Text style={styles.progressText}>
              {TARGET_SELLOS - sellosActuales > 0
                ? `Faltan ${TARGET_SELLOS - sellosActuales} más`
                : '¡Tarjeta completa! 🎉'}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: barraWidth }]} />
          </View>
        </View>

        {/* Viajes gratis disponibles */}
        {viajesGratisDisponibles > 0 && (
          <Animated.View style={[styles.canjeBox, { opacity: glowAnim }]}>
            <Ionicons name="gift" size={18} color="#818cf8" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.canjeTitle}>
                {viajesGratisDisponibles} viaje{viajesGratisDisponibles > 1 ? 's' : ''} gratis disponible{viajesGratisDisponibles > 1 ? 's' : ''}
              </Text>
              <Text style={styles.canjeSub}>¡Canjea tu recompensa ahora!</Text>
            </View>
            <TouchableOpacity style={styles.canjeBtn} onPress={onCanjear} disabled={canjeando}>
              {canjeando
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.canjeBtnText}>Canjear</Text>}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ─── Tab Fidelidad ────────────────────────────────────────────────────────────
function TabFidelidad({ datos, onCanjear, canjeando }) {
  const { historialCanjes = [] } = datos;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TarjetaFidelidad datos={datos} onCanjear={onCanjear} canjeando={canjeando} />

      {/* Cómo funciona */}
      <View className="mx-5 mb-5">
        <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">¿Cómo funciona?</Text>
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { icono: 'qr-code-outline',             texto: 'Genera tu QR y sube al bus',                color: '#1a3cff' },
            { icono: 'checkmark-done-circle-outline',texto: 'El conductor escanea → 1 sello ganado',    color: '#16a34a' },
            { icono: 'gift-outline',                 texto: 'Completa 30 sellos → 1 viaje gratis',      color: '#f59e0b' },
            { icono: 'ticket-outline',               texto: 'Canjea tu viaje gratis cuando quieras',    color: '#7c3aed' },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center px-4 py-3"
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}>
              <View className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${item.color}22` }}>
                <Ionicons name={item.icono} size={18} color={item.color} />
              </View>
              <Text className="text-gray-700 text-sm flex-1">{item.texto}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Historial de canjes */}
      {historialCanjes.length > 0 && (
        <View className="mx-5 mb-20">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Canjes realizados</Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {historialCanjes.map((c, i) => (
              <View key={c.id} className="flex-row items-center px-4 py-3"
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}>
                <View className="bg-green-50 rounded-xl p-2 mr-3">
                  <Ionicons name="ticket" size={16} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium">Viaje gratis canjeado</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{formatFecha(c.creadoEn)}</Text>
                </View>
                <Text className="text-green-600 font-bold text-sm">✓ Usado</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ─── Tarjeta de viaje (memoizada) ─────────────────────────────────────────────
const TarjetaViaje = memo(function TarjetaViaje({ viaje, onVerQR, index }) {
  const slideAnim   = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 280, delay: Math.min(index * 50, 300), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: Math.min(index * 50, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const cfg = ESTADO_CONFIG[viaje.estado] || ESTADO_CONFIG.PENDIENTE;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <View className="bg-white rounded-2xl mx-5 mb-4 shadow-sm overflow-hidden">
        {/* Estado badge */}
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 16, paddingVertical: 8 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name={cfg.icono} size={14} color={cfg.text} />
              <Text style={{ color: cfg.text }} className="text-xs font-bold ml-1">{cfg.label}</Text>
            </View>
            <Text style={{ color: cfg.text }} className="text-xs">{formatFecha(viaje.creadoEn)}</Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {viaje.ruta?.nombre || 'Ruta CPSA'}
          </Text>
          <View className="flex-row items-center mb-4">
            <View className="items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-[#1a3cff]" />
              <View className="w-0.5 h-8 bg-gray-200 my-1" />
              <View className="w-3 h-3 rounded-full bg-green-500" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold text-sm mb-3" numberOfLines={1}>{viaje.paraderoInicio}</Text>
              <Text className="text-gray-800 font-semibold text-sm" numberOfLines={1}>{viaje.paraderoFin}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[#1a3cff] text-lg font-bold">
                {viaje.montoDescontado === 0 ? 'GRATIS' : `S/ ${viaje.montoDescontado?.toFixed(2)}`}
              </Text>
              {(viaje.estado === 'EN_CURSO' || viaje.estado === 'COMPLETADO') && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="bookmark" size={10} color="#f59e0b" />
                  <Text className="text-amber-500 text-xs font-semibold ml-0.5">+1 sello</Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-3"
            style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
            <Text className="text-xs text-gray-400 flex-1" numberOfLines={1}>{cfg.desc}</Text>
            {viaje.estado === 'PENDIENTE' && (
              <TouchableOpacity
                className="flex-row items-center bg-[#eef0ff] rounded-xl px-3 py-1.5 ml-2"
                onPress={() => onVerQR(viaje)}
              >
                <MaterialCommunityIcons name="qrcode" size={16} color="#1a3cff" />
                <Text className="text-[#1a3cff] text-xs font-bold ml-1">Ver QR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Pill de filtro (tamaño FIJO para que no cambie al seleccionarse) ─────────
function FiltroPill({ label, activo, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, activo && styles.pillActivo]}
    >
      <Text style={[styles.pillText, activo && styles.pillTextActivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function ViajesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tabActivo, setTabActivo] = useState('viajes');
  const [viajes,     setViajes]    = useState([]);
  const [fidelidad,  setFidelidad] = useState({});
  const [cargando,   setCargando]  = useState(true);
  const [filtro,     setFiltro]    = useState('Todos');
  const [viajeQR,    setViajeQR]   = useState(null);
  const [canjeando,  setCanjeando] = useState(false);

  const tabIndicator = useRef(new Animated.Value(0)).current;

  const cambiarTab = useCallback((tab) => {
    setTabActivo(tab);
    Animated.spring(tabIndicator, {
      toValue: tab === 'viajes' ? 0 : 1,
      tension: 200, friction: 16, useNativeDriver: false,
    }).start();
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [resViajes, resPuntos] = await Promise.allSettled([
        api.get('/pasajero/viajes'),
        api.get('/pasajero/puntos'),
      ]);
      if (resViajes.status === 'fulfilled') setViajes(resViajes.value.data);
      if (resPuntos.status === 'fulfilled') setFidelidad(resPuntos.value.data);
    } catch (e) {
      console.error('Error historial:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  const handleCanjear = useCallback(() => {
    Alert.alert(
      '¿Canjear viaje gratis?',
      'Tu próximo QR saldrá en S/ 0.00',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear', onPress: async () => {
            try {
              setCanjeando(true);
              await api.post('/pasajero/canjear-viaje-gratis');
              await cargarDatos();
              Alert.alert('¡Canjeado! 🎉', 'Tu próximo viaje es GRATIS.');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'No se pudo canjear');
            } finally {
              setCanjeando(false);
            }
          },
        },
      ]
    );
  }, [cargarDatos]);

  // Filtrado memoizado — solo recalcula cuando cambian viajes o filtro
  const viajesFiltrados = useMemo(() => {
    if (filtro === 'Todos') return viajes;
    return viajes.filter((v) => v.estado === FILTRO_MAP[filtro]);
  }, [viajes, filtro]);

  const tabLeft = tabIndicator.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  const renderViaje = useCallback(({ item, index }) => (
    <TarjetaViaje viaje={item} onVerQR={setViajeQR} index={index} />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View className="flex-1 bg-[#f0f2ff]" style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Historial</Text>
          <TouchableOpacity
            style={styles.selloBadge}
            onPress={() => cambiarTab('fidelidad')}
          >
            <Ionicons name="bookmark" size={13} color="#f59e0b" />
            <Text style={styles.selloBadgeText}>{fidelidad.sellosActuales ?? 0}/{TARGET_SELLOS}</Text>
            {(fidelidad.viajesGratisDisponibles ?? 0) > 0 && (
              <View style={styles.greenDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="mx-5 mb-3 bg-white rounded-2xl p-1 shadow-sm" style={{ position: 'relative' }}>
        <Animated.View
          className="absolute top-1 bottom-1 rounded-xl bg-[#1a3cff]"
          style={{ left: tabLeft, right: tabIndicator.interpolate({ inputRange: [0, 1], outputRange: ['50%', '0%'] }) }}
        />
        <View className="flex-row">
          {['viajes', 'fidelidad'].map((t, i) => (
            <TouchableOpacity key={t} className="flex-1 py-2.5 rounded-xl items-center z-10"
              onPress={() => cambiarTab(t)}>
              <Text className="font-bold text-sm"
                style={{ color: tabActivo === t ? 'white' : '#9ca3af' }}>
                {t === 'viajes' ? 'Mis Viajes' : '🎟️ Fidelidad'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {cargando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1a3cff" />
        </View>
      ) : tabActivo === 'fidelidad' ? (
        <TabFidelidad datos={fidelidad} onCanjear={handleCanjear} canjeando={canjeando} />
      ) : (
        <>
          {/* ⬇️ FIX: ScrollView con alignItems:'center' evita stretching de pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtrosContainer}>
            {FILTROS_VIAJE.map((f) => (
              <FiltroPill key={f} label={f} activo={filtro === f} onPress={() => setFiltro(f)} />
            ))}
          </ScrollView>

          {viajesFiltrados.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <MaterialCommunityIcons name="bus-clock" size={60} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-4 font-medium">
                {filtro === 'Todos' ? 'No tienes viajes registrados' : `Sin viajes "${filtro}"`}
              </Text>
              {filtro === 'Todos' && (
                <TouchableOpacity className="mt-4 bg-[#1a3cff] rounded-2xl px-6 py-3"
                  onPress={() => navigation.navigate('GenerarQR')}>
                  <Text className="text-white font-bold">Generar mi primer QR</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={viajesFiltrados}
              keyExtractor={keyExtractor}
              renderItem={renderViaje}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 16 }}
              // ── Optimizaciones de performance ──
              removeClippedSubviews
              windowSize={5}
              maxToRenderPerBatch={6}
              initialNumToRender={8}
              updateCellsBatchingPeriod={50}
            />
          )}
        </>
      )}

      {/* Modal QR pendiente */}
      <Modal visible={!!viajeQR} transparent animationType="fade" onRequestClose={() => setViajeQR(null)}>
        <Pressable style={styles.modalBg} onPress={() => setViajeQR(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-gray-900 mb-1">Tu QR de abordaje</Text>
            <Text className="text-gray-400 text-sm text-center mb-5">Muéstraselo al conductor</Text>
            <View style={styles.qrBox}>
              {viajeQR && <QRCode value={viajeQR.qrCodigo} size={200} color="#0a0a2e" />}
            </View>
            {viajeQR && (
              <View className="w-full bg-[#f0f2ff] rounded-2xl p-4 mb-4">
                <FilaInfo label="Desde" valor={viajeQR.paraderoInicio} />
                <FilaInfo label="Hasta" valor={viajeQR.paraderoFin} />
                <FilaInfo label="Tarifa"
                  valor={viajeQR.montoDescontado === 0 ? 'Gratuito' : `S/ ${viajeQR.montoDescontado?.toFixed(2)}`} />
              </View>
            )}
            <TouchableOpacity className="w-full bg-[#1a3cff] rounded-2xl py-4 items-center"
              onPress={() => setViajeQR(null)}>
              <Text className="text-white font-bold">Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilaInfo({ label, valor }) {
  return (
    <View className="flex-row justify-between items-center py-1.5">
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text className="text-gray-800 font-semibold text-sm">{valor}</Text>
    </View>
  );
}

// ─── StyleSheet (evita recalculos de NativeWind en tiempo de render) ──────────
const styles = StyleSheet.create({
  // Sellos
  sello: { width: 28, height: 28, borderRadius: 14, margin: 4, alignItems: 'center', justifyContent: 'center' },
  selloActivo: { backgroundColor: '#1a3cff' },
  selloVacio:  { backgroundColor: '#f1f5f9' },

  // Tarjeta fidelidad
  card:        { backgroundColor: '#0f172a', borderRadius: 24, overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  cardSubtitle:{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  cardTitle:   { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  cardBadge:   { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  cardBadgeNum:{ color: 'white', fontSize: 26, fontWeight: 'bold' },
  cardBadgeSub:{ color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  sellosGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  progressSection: { paddingHorizontal: 20, paddingBottom: 16, marginTop: 8 },
  progressLabels:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText:    { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  progressBar:     { height: 6, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill:    { height: 6, borderRadius: 99, backgroundColor: '#1a3cff' },
  canjeBox:   { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,60,255,0.25)', borderWidth: 1, borderColor: 'rgba(26,60,255,0.5)' },
  canjeTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  canjeSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 },
  canjeBtn:     { backgroundColor: '#1a3cff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  canjeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  // ⬇️ PILLS: dimensiones FIJAS — background cambia pero el tamaño no
  filtrosContainer: { paddingHorizontal: 20, paddingBottom: 8, alignItems: 'center' },
  pill:         { height: 36, paddingHorizontal: 16, borderRadius: 99, marginRight: 8, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  pillActivo:   { backgroundColor: '#1a3cff' },
  pillText:     { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  pillTextActivo:{ color: 'white' },

  // Header badge
  selloBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  selloBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },
  greenDot:       { width: 7, height: 7, borderRadius: 99, backgroundColor: '#4ade80', marginLeft: 6 },

  // Modal
  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  qrBox:     { backgroundColor: 'white', padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 2, borderColor: '#eef0ff' },
});
