import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchGananciasHoy } from '../services/conductorService';

/**
 * Hook personalizado para las ganancias del conductor.
 *
 * SRP  → gestiona exclusivamente el estado de ganancias.
 * LSP  → cualquier componente que consuma este hook recibe siempre la
 *         misma "forma" de datos (ganancias, cargando, error, recargar).
 * ISP  → expone solo los datos que la UI necesita; no filtra nada extra.
 *
 * Se recarga automáticamente cada vez que el tab recibe el foco.
 */
export function useGanancias() {
  const [ganancias, setGanancias] = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  const cargar = useCallback(() => {
    let activo = true;

    async function fetchData() {
      setCargando(true);
      setError(null);
      try {
        const data = await fetchGananciasHoy();
        if (activo) setGanancias(data);
      } catch (err) {
        console.error('useGanancias:', err);
        if (activo) setError('No se pudieron cargar las ganancias.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    fetchData();

    // Cleanup: si el tab pierde el foco antes de que termine, evita setState
    return () => { activo = false; };
  }, []);

  // Se recarga cada vez que el tab gana el foco
  useFocusEffect(cargar);

  return { ganancias, cargando, error, recargar: cargar };
}
