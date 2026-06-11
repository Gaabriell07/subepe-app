import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchGananciasHoy } from '../services/conductorService';

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

    return () => { activo = false; };
  }, []);

  useFocusEffect(cargar);

  return { ganancias, cargando, error, recargar: cargar };
}
