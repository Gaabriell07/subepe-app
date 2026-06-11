import api from './api';

export async function fetchGananciasHoy() {
  const { data } = await api.get('/conductor/ganancias-hoy');
  return data;
}
