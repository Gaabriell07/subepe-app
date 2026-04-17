import api from './api';

/**
 * Servicio de acceso a datos del conductor.
 * SRP: solo se encarga de comunicarse con la API del conductor.
 * Las pantallas y hooks NO importan `api` directamente.
 */

/**
 * Obtiene las ganancias del conductor para el día de hoy.
 * @returns {Promise<{ totalHoy: number, totalViajes: number, desglose: Array, ultimosViajes: Array }>}
 */
export async function fetchGananciasHoy() {
  const { data } = await api.get('/conductor/ganancias-hoy');
  return data;
}
