import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGanancias } from '../../hooks/useGanancias';

// ── Mapa de íconos y colores por tipo de carnet ───────────────────────────────
// OCP: agregar un nuevo tipo de carnet solo requiere añadir una entrada aquí,
//      sin modificar los componentes de UI.
const TIPO_CARNET_META = {
  NORMAL:       { label: 'Normal',        color: '#4f7cff', bg: '#eef0ff', icon: 'person' },
  UNIVERSITARIO:{ label: 'Universitario', color: '#7c3aed', bg: '#f5f3ff', icon: 'school' },
  ESCOLAR:      { label: 'Escolar',       color: '#059669', bg: '#ecfdf5', icon: 'book' },
  POLICIA:      { label: 'Policía',       color: '#0369a1', bg: '#e0f2fe', icon: 'shield' },
  MILITAR:      { label: 'Militar',       color: '#b45309', bg: '#fef3c7', icon: 'star' },
  ADULTO_MAYOR: { label: 'Adulto mayor',  color: '#d97706', bg: '#fffbeb', icon: 'people' },
  DISCAPACITADO:{ label: 'Discapacidad',  color: '#db2777', bg: '#fdf2f8', icon: 'heart' },
};

// ── Helpers de formato ────────────────────────────────────────────────────────
const formatSol  = (n) => `S/. ${(n ?? 0).toFixed(2)}`;
const metaCarnet = (tipo) => TIPO_CARNET_META[tipo] ?? TIPO_CARNET_META.NORMAL;

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ISP: solo recibe los datos que necesita a través del hook; no conoce nada
//      sobre cómo se obtienen o de dónde vienen.
// ─────────────────────────────────────────────────────────────────────────────
export default function GananciasScreen() {
  const insets = useSafeAreaInsets();
  const { ganancias, cargando, error, recargar } = useGanancias();

  // ── Estado de carga ──────────────────────────────────────────────────────
  if (cargando) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#f0f2ff', paddingTop: insets.top }}
        className="items-center justify-center"
      >
        <ActivityIndicator size="large" color="#4f7cff" />
        <Text className="text-gray-400 mt-3 text-sm">Calculando ganancias…</Text>
      </View>
    );
  }

  // ── Estado de error ──────────────────────────────────────────────────────
  if (error) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#f0f2ff', paddingTop: insets.top }}
        className="items-center justify-center px-8"
      >
        <MaterialCommunityIcons name="wifi-off" size={48} color="#cbd5e1" />
        <Text className="text-gray-500 text-base font-semibold mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={recargar}
          className="mt-5 bg-[#4f7cff] rounded-2xl px-8 py-3"
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Estado vacío ─────────────────────────────────────────────────────────
  const sinViajes = !ganancias || ganancias.totalViajes === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2ff', paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header con total del día ─────────────────────────────────── */}
        <HeaderGanancias
          total={ganancias?.totalHoy ?? 0}
          totalViajes={ganancias?.totalViajes ?? 0}
          onRecargar={recargar}
        />

        {sinViajes ? (
          <EstadoVacio />
        ) : (
          <>
            {/* ── Desglose por tipo de carnet ──────────────────────────── */}
            <SeccionDesglose desglose={ganancias.desglose} />

            {/* ── Últimos viajes del día ────────────────────────────────── */}
            <SeccionUltimosViajes viajes={ganancias.ultimosViajes} />
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes (SRP: cada uno tiene una única razón para cambiar)
// ─────────────────────────────────────────────────────────────────────────────

function HeaderGanancias({ total, totalViajes, onRecargar }) {
  return (
    <View className="bg-[#0f172a] px-5 pt-4 pb-10">
      {/* Título + botón recargar */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-2xl font-bold">Ganancias de hoy</Text>
        <TouchableOpacity
          onPress={onRecargar}
          className="bg-white/10 rounded-full p-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Monto grande */}
      <View className="items-center">
        <Text className="text-white/50 text-sm mb-1 tracking-widest uppercase">Total recaudado</Text>
        <Text
          className="text-white font-bold"
          style={{ fontSize: 52, lineHeight: 60 }}
        >
          {formatSol(total)}
        </Text>
        <View
          className="mt-3 rounded-full px-5 py-1.5 flex-row items-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        >
          <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-sm ml-1.5">
            {totalViajes} {totalViajes === 1 ? 'pasajero' : 'pasajeros'} hoy
          </Text>
        </View>
      </View>
    </View>
  );
}

function SeccionDesglose({ desglose }) {
  if (!desglose || desglose.length === 0) return null;
  return (
    <View className="px-5 -mt-5">
      <View className="bg-white rounded-3xl p-5 shadow-sm">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Desglose por tipo
        </Text>
        {desglose.map((item, idx) => (
          <FilaDesglose key={item.tipo} item={item} borde={idx > 0} />
        ))}
      </View>
    </View>
  );
}

function FilaDesglose({ item, borde }) {
  const meta = metaCarnet(item.tipo);
  return (
    <View
      className="flex-row items-center py-3"
      style={borde ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}
    >
      <View
        className="rounded-xl p-2 mr-3"
        style={{ backgroundColor: meta.bg }}
      >
        <Ionicons name={`${meta.icon}-outline`} size={18} color={meta.color} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold text-sm">{meta.label}</Text>
        <Text className="text-gray-400 text-xs">{item.cantidad} pasajero{item.cantidad !== 1 ? 's' : ''}</Text>
      </View>
      <Text className="font-bold text-base" style={{ color: meta.color }}>
        {formatSol(item.subtotal)}
      </Text>
    </View>
  );
}

function SeccionUltimosViajes({ viajes }) {
  if (!viajes || viajes.length === 0) return null;
  return (
    <View className="px-5 mt-5">
      <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        Últimos viajes
      </Text>
      <View className="bg-white rounded-3xl overflow-hidden shadow-sm">
        {viajes.map((v, idx) => (
          <FilaViaje key={v.id} viaje={v} borde={idx > 0} />
        ))}
      </View>
    </View>
  );
}

function FilaViaje({ viaje, borde }) {
  const meta = metaCarnet(viaje.tipo);
  return (
    <View
      className="flex-row items-center px-4 py-3"
      style={borde ? { borderTopWidth: 1, borderTopColor: '#f3f4f6' } : {}}
    >
      {/* Hora */}
      <Text className="text-xs text-gray-400 w-12 font-mono">{viaje.hora}</Text>

      {/* Ruta */}
      <View className="flex-1 mx-3">
        <View className="flex-row items-center">
          <Text className="text-gray-700 text-xs font-medium flex-shrink" numberOfLines={1}>
            {viaje.origen}
          </Text>
          <Ionicons name="arrow-forward" size={10} color="#9ca3af" style={{ marginHorizontal: 4 }} />
          <Text className="text-gray-700 text-xs font-medium flex-shrink" numberOfLines={1}>
            {viaje.destino}
          </Text>
        </View>
        <View
          className="self-start rounded-full px-2 py-0.5 mt-1"
          style={{ backgroundColor: meta.bg }}
        >
          <Text className="text-xs font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* Monto */}
      <Text className="text-[#4f7cff] font-bold text-sm">{formatSol(viaje.monto)}</Text>
    </View>
  );
}

function EstadoVacio() {
  return (
    <View className="items-center justify-center px-8 mt-16">
      <MaterialCommunityIcons name="cash-off" size={64} color="#cbd5e1" />
      <Text className="text-gray-500 text-base font-semibold mt-4 text-center">
        Sin viajes hoy
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-1">
        Inicia tu turno y escanea QRs para ver tus ganancias aquí.
      </Text>
    </View>
  );
}
