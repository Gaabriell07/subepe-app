import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

const CARNETS = [
  {
    value: 'NORMAL',
    label: 'Pasajero regular',
    descripcion: 'Tarifa estándar según distancia',
    precio: 'S/ 2.00 – 5.00',
    icono: 'person-outline',
    color: '#1a3cff',
    bg: '#eef0ff',
    gratis: false,
  },
  {
    value: 'UNIVERSITARIO',
    label: 'Universitario',
    descripcion: 'Carnet universitario vigente',
    precio: 'S/ 1.50 fijo',
    icono: 'school-outline',
    color: '#16a34a',
    bg: '#dcfce7',
    gratis: false,
  },
  {
    value: 'ESCOLAR',
    label: 'Escolar',
    descripcion: 'Estudiante de colegio',
    precio: 'S/ 1.00 fijo',
    icono: 'book-outline',
    color: '#2563eb',
    bg: '#dbeafe',
    gratis: false,
  },
  {
    value: 'POLICIA',
    label: 'Policía Nacional',
    descripcion: 'Personal PNP en actividad',
    precio: 'GRATIS',
    icono: 'shield-outline',
    color: '#dc2626',
    bg: '#fee2e2',
    gratis: true,
  },
  {
    value: 'MILITAR',
    label: 'Personal Militar',
    descripcion: 'FFAA en actividad',
    precio: 'GRATIS',
    icono: 'ribbon-outline',
    color: '#92400e',
    bg: '#fef3c7',
    gratis: true,
  },
  {
    value: 'DISCAPACITADO',
    label: 'Persona con discapacidad',
    descripcion: 'Carnet CONADIS vigente',
    precio: 'GRATIS',
    icono: 'accessibility-outline',
    color: '#7c3aed',
    bg: '#ede9fe',
    gratis: true,
  },
];

const SEXOS = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Femenino', value: 'FEMENINO' },
  { label: 'Otro', value: 'OTRO' },
];

export default function EditarPerfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [sexo, setSexo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [tipoCarnet, setTipoCarnet] = useState('NORMAL');

  const [tipoCarnetOriginal, setTipoCarnetOriginal] = useState('NORMAL');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/pasajero/perfil');
        setNombres(data.nombres || '');
        setApellidos(data.apellidos || '');
        setSexo(data.sexo || '');
        setTipoCarnet(data.pasajero?.tipoCarnet || 'NORMAL');
        setTipoCarnetOriginal(data.pasajero?.tipoCarnet || 'NORMAL');
        
        if (data.fechaNacimiento) {
          const d = new Date(data.fechaNacimiento);
          const dia = String(d.getDate()).padStart(2, '0');
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const anio = d.getFullYear();
          setFechaNacimiento(`${dia}/${mes}/${anio}`);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const parsearFecha = (str) => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const fecha = new Date(`${y}-${m}-${d}`);
    return isNaN(fecha.getTime()) ? null : fecha;
  };

  const validarFechaInput = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    if (clean.length > 10) clean = clean.slice(0, 10);
    setFechaNacimiento(clean);
  };

  const handleGuardar = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      Alert.alert('Error', 'Nombres y apellidos son obligatorios');
      return;
    }
    if (!sexo) {
      Alert.alert('Error', 'Selecciona tu sexo');
      return;
    }
    const fecha = parsearFecha(fechaNacimiento);
    if (!fecha) {
      Alert.alert('Error', 'Fecha inválida. Usa el formato DD/MM/AAAA');
      return;
    }

    try {
      setGuardando(true);

      if (tipoCarnet !== tipoCarnetOriginal && tipoCarnet !== 'NORMAL') {
        const ImagePicker = require('expo-image-picker');
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la galería y subir tu documento.');
          setGuardando(false);
          return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });

        if (pickerResult.canceled) {
          setGuardando(false);
          return; 
        }

        const formData = new FormData();
        const localUri = pickerResult.assets[0].uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('archivo', { uri: localUri, name: filename, type });
        formData.append('tipo', 'CARNET');

        const uploadRes = await api.post('/storage/subir', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const urlImagen = uploadRes.data.archivo.url;

        await api.post('/pasajero/solicitud-carnet', {
          tipoCarnetSolicitado: tipoCarnet,
          urlImagenDocumento: urlImagen,
        });

        Alert.alert('Solicitud enviada', 'Tu documento será revisado por un administrador pronto. Tu tarifa seguirá siendo la actual hasta que sea aprobada.');
      } else {
        
        await api.put('/pasajero/perfil', {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          sexo,
          fechaNacimiento: fecha.toISOString(),
          tipoCarnet: tipoCarnet === 'NORMAL' ? 'NORMAL' : tipoCarnetOriginal, 
        });
        Alert.alert(
          '¡Perfil actualizado!',
          'Tus cambios han sido guardados correctamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo actualizar el perfil');
    } finally {
      setGuardando(false);
    }
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
      {}
      <View className="flex-row items-center px-5 pt-4 pb-4">
        <TouchableOpacity
          className="bg-white rounded-full w-10 h-10 items-center justify-center shadow-sm mr-3"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#1a3cff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Editar perfil</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {}
        <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
          Datos personales
        </Text>
        <View className="bg-white rounded-2xl px-4 py-2 shadow-sm mb-5">
          {}
          <View className="flex-row items-center py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Ionicons name="person-outline" size={18} color="#1a3cff" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-xs text-gray-400 mb-0.5">Nombres</Text>
              <TextInput
                className="text-gray-800 font-medium"
                value={nombres}
                onChangeText={setNombres}
                autoCapitalize="words"
                placeholder="Tus nombres"
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          {}
          <View className="flex-row items-center py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Ionicons name="person-outline" size={18} color="#1a3cff" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-xs text-gray-400 mb-0.5">Apellidos</Text>
              <TextInput
                className="text-gray-800 font-medium"
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
                placeholder="Tus apellidos"
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          {}
          <View className="flex-row items-center py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Ionicons name="calendar-outline" size={18} color="#1a3cff" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-xs text-gray-400 mb-0.5">Fecha de nacimiento</Text>
              <TextInput
                className="text-gray-800 font-medium"
                value={fechaNacimiento}
                onChangeText={validarFechaInput}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {}
          <View className="py-3">
            <Text className="text-xs text-gray-400 mb-2">Sexo</Text>
            <View className="flex-row gap-2">
              {SEXOS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{
                    backgroundColor: sexo === s.value ? '#1a3cff' : '#f0f2ff',
                  }}
                  onPress={() => setSexo(s.value)}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: sexo === s.value ? 'white' : '#6b7280' }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {}
        <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
          Tipo de carnet
        </Text>
        <Text className="text-xs text-gray-400 mb-4 leading-5">
          Selecciona el tipo que corresponde a tu situación. El sistema aplicará automáticamente la tarifa correcta al generar tu QR.
        </Text>

        <View className="gap-3 mb-6">
          {CARNETS.map((c) => (
            <TouchableOpacity
              key={c.value}
              className="bg-white rounded-2xl px-4 py-4 flex-row items-center shadow-sm"
              style={tipoCarnet === c.value ? {
                borderWidth: 2,
                borderColor: c.color,
              } : {}}
              onPress={() => setTipoCarnet(c.value)}
            >
              {}
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: tipoCarnet === c.value ? c.color : c.bg }}
              >
                <Ionicons
                  name={c.icono}
                  size={20}
                  color={tipoCarnet === c.value ? 'white' : c.color}
                />
              </View>

              {}
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm">{c.label}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{c.descripcion}</Text>
              </View>

              {}
              <View
                className="rounded-full px-3 py-1 ml-2"
                style={{ backgroundColor: c.gratis ? '#dcfce7' : c.bg }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: c.gratis ? '#16a34a' : c.color }}
                >
                  {c.precio}
                </Text>
              </View>

              {}
              {tipoCarnet === c.value && (
                <Ionicons name="checkmark-circle" size={20} color={c.color} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {}
        <View className="bg-amber-50 rounded-2xl p-4 mb-6 flex-row items-start">
          <Ionicons name="information-circle-outline" size={20} color="#ca8a04" />
          <Text className="text-amber-700 text-xs ml-2 flex-1 leading-5">
            Los carnets de descuento o gratuidad pueden ser verificados por el personal de CPSA. Asegúrate de llevar tu carnet físico al abordar.
          </Text>
        </View>

        {}
        <TouchableOpacity
          className="bg-[#1a3cff] rounded-2xl py-4 items-center"
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
