import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

const PARADEROS = [
  'SANTA ROSA', 'PROC. DE LA INDEPENDENCIA', 'ACHO', 'PIZARRO - CAQUETA',
  'ALFONSO UGARTE', 'AV. BRASIL', 'AV. DEL EJERCITO', 'PARDO - MIRAFLORES',
  'AV. BENAVIDES', 'TOMAS MARSANO', 'SAN JUAN DE MIRAFLORES',
  'VILLA EL SALVADOR', 'LAS PALMAS',
];

export default function TurnoActivoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const paraderoInicialIdx = route?.params?.paraderoActualIdx ?? 0;

  const [paraderoActualIdx, setParaderoActualIdx] = useState(paraderoInicialIdx);
  const [avanzando,         setAvanzando]          = useState(false);
  const [finalizando,       setFinalizando]         = useState(false);
  const [toastMsg,          setToastMsg]            = useState(null);
  const scrollRef = useRef(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, paraderoActualIdx * 64 - 120), animated: true });
    }, 300);
  }, [paraderoActualIdx]);

  const mostrarToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const siguienteIdx = paraderoActualIdx + 1;
  const hayParaderoSiguiente = siguienteIdx < PARADEROS.length;

  const handleAvanzar = useCallback(async () => {
    if (!hayParaderoSiguiente) return;
    try {
      setAvanzando(true);
      const { data } = await api.post('/conductor/siguiente-paradero', {
        paraderoIdx: siguienteIdx,
      });
      setParaderoActualIdx(siguienteIdx);
      const { alertasGeneradas } = data;
      mostrarToast(
        alertasGeneradas > 0
          ? `📣 ${alertasGeneradas} pasajero${alertasGeneradas > 1 ? 's' : ''} notificado${alertasGeneradas > 1 ? 's' : ''}`
          : `✅ Llegaste a ${PARADEROS[siguienteIdx]}`
      );
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo avanzar');
    } finally {
      setAvanzando(false);
    }
  }, [hayParaderoSiguiente, siguienteIdx, mostrarToast]);

  const handleFinalizar = useCallback(() => {
    Alert.alert(
      'Finalizar turno',
      '¿Estás seguro? Se cerrará el turno activo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar', style: 'destructive',
          onPress: async () => {
            try {
              setFinalizando(true);
              await api.post('/conductor/finalizar-turno');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo finalizar el turno');
            } finally {
              setFinalizando(false);
            }
          },
        },
      ]
    );
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Turno en curso</Text>
          <Text style={styles.headerTitle}>Ruta CPSA — {paraderoActualIdx + 1}/{PARADEROS.length}</Text>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>ACTIVO</Text>
        </View>
      </View>

      {}
      <ScrollView
        ref={scrollRef}
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {PARADEROS.map((nombre, idx) => {
          const esActual  = idx === paraderoActualIdx;
          const esPasado  = idx < paraderoActualIdx;
          const esSig     = idx === siguienteIdx;

          return (
            <View key={idx} style={styles.paraderoRow}>
              {}
              <View style={styles.lineaContainer}>
                {idx < PARADEROS.length - 1 && (
                  <View style={[styles.lineaVert, esPasado && styles.lineaVertActiva]} />
                )}
                {}
                <View style={[
                  styles.circulo,
                  esActual && styles.circuloActual,
                  esPasado && styles.circuloPasado,
                  esSig    && styles.circuloSig,
                ]}>
                  {esPasado && <Ionicons name="checkmark" size={12} color="white" />}
                  {esActual && <View style={styles.circuloInner} />}
                  {esSig    && <Ionicons name="chevron-down" size={10} color="#1a3cff" />}
                </View>
              </View>

              {}
              <View style={[styles.paraderoCard, esActual && styles.paraderoCardActual]}>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.paraderoNombre,
                    esActual && styles.paraderoNombreActual,
                    esPasado && styles.paraderoNombrePasado,
                  ]}>
                    {nombre}
                  </Text>
                  {esActual && (
                    <Text style={styles.paraderoLabel}>← Estás aquí</Text>
                  )}
                  {esSig && (
                    <Text style={styles.paraderoLabelSig}>Próximo paradero</Text>
                  )}
                </View>
                <Text style={styles.paraderoNum}>{idx + 1}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 200 }} />
      </ScrollView>

      {}
      {toastMsg && (
        <Animated.View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      {}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {hayParaderoSiguiente && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <TouchableOpacity
              style={styles.btnAvanzar}
              onPress={handleAvanzar}
              disabled={avanzando}
              activeOpacity={0.85}
            >
              {avanzando ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="location" size={20} color="white" />
                  <Text style={styles.btnAvanzarText}>
                    Llegué a {PARADEROS[siguienteIdx]}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {!hayParaderoSiguiente && (
          <View style={styles.btnAvanzarDisabled}>
            <Ionicons name="flag-outline" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.btnAvanzarDisabledText}>Fin de ruta alcanzado</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnFinalizar}
          onPress={handleFinalizar}
          disabled={finalizando}
        >
          {finalizando
            ? <ActivityIndicator color="#dc2626" size="small" />
            : <Text style={styles.btnFinalizarText}>Finalizar turno</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0f172a' },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerSub:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  headerTitle:     { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  activeBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  activeDot:       { width: 7, height: 7, borderRadius: 99, backgroundColor: '#4ade80', marginRight: 6 },
  activeBadgeText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },

  listScroll: { flex: 1, paddingHorizontal: 20 },
  paraderoRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  lineaContainer:{ width: 32, alignItems: 'center', paddingTop: 16 },
  lineaVert:     { position: 'absolute', top: 28, bottom: -4, width: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  lineaVertActiva:{ backgroundColor: 'rgba(74,222,128,0.4)' },
  circulo:       { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 10, zIndex: 1 },
  circuloActual: { backgroundColor: '#4ade80', borderColor: '#4ade80', width: 24, height: 24, borderRadius: 12 },
  circuloPasado: { backgroundColor: 'rgba(74,222,128,0.3)', borderColor: 'rgba(74,222,128,0.5)' },
  circuloSig:    { backgroundColor: 'rgba(26,60,255,0.3)', borderColor: '#1a3cff' },
  circuloInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },

  paraderoCard:       { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  paraderoCardActual: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)' },
  paraderoNombre:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  paraderoNombreActual:{ color: '#4ade80', fontWeight: '700', fontSize: 14 },
  paraderoNombrePasado:{ color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  paraderoLabel:      { color: 'rgba(74,222,128,0.7)', fontSize: 10, marginTop: 2 },
  paraderoLabelSig:   { color: 'rgba(99,129,255,0.8)', fontSize: 10, marginTop: 2 },
  paraderoNum:        { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginLeft: 8 },

  toast:     { position: 'absolute', bottom: 200, alignSelf: 'center', backgroundColor: 'rgba(15,23,42,0.95)', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  toastText: { color: 'white', fontWeight: '600', fontSize: 13 },

  footer:        { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  btnAvanzar:    { backgroundColor: '#1a3cff', borderRadius: 18, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  btnAvanzarText:{ color: 'white', fontWeight: 'bold', fontSize: 15 },
  btnAvanzarDisabled:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  btnAvanzarDisabledText:{ color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 15 },
  btnFinalizar:  { paddingVertical: 12, alignItems: 'center' },
  btnFinalizarText:{ color: '#dc2626', fontWeight: '600', fontSize: 14 },
});
