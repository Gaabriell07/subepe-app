import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Instancia de axios ───────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://192.168.1.141:3000/api',
  timeout: 10000, // 10s max por request
  headers: { 'Content-Type': 'application/json' },
});

// ─── Cache en memoria (TTL por ruta) ─────────────────────────────────────────
// Las rutas de GET que no cambian frecuentemente se cachean brevemente
// para evitar refetch en cada cambio de tab.
const CACHE_TTL_MS = {
  '/pasajero/comunicados': 5 * 60 * 1000, // 5 min — cambia poco
  '/pasajero/puntos':      60 * 1000,      // 1 min — puede canjear
  '/pasajero/saldo':       30 * 1000,      // 30s — puede recargar
  '/pasajero/viajes':      30 * 1000,      // 30s
};

const memCache = new Map(); // key → { data, expiresAt }

function getCached(url) {
  const entry = memCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memCache.delete(url); return null; }
  return entry.data;
}

function setCache(url, data) {
  const ttl = CACHE_TTL_MS[url];
  if (!ttl) return; // No cachear rutas no listadas
  memCache.set(url, { data, expiresAt: Date.now() + ttl });
}

// Invalidar cache de una ruta específica (llamar después de mutaciones)
export function invalidateCache(url) {
  memCache.delete(url);
}

// Invalidar todo el cache del pasajero (p.ej. al hacer logout)
export function clearAllCache() {
  memCache.clear();
}

// ─── Interceptor de request — adjunta JWT ────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ─── Interceptor de response — aplica cache + maneja 401 ────────────────────
api.interceptors.response.use(
  (response) => {
    // Solo cachear GETs exitosos
    if (response.config.method === 'get') {
      const url = response.config.url;
      setCache(url, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es un reintento ya → intentar refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { supabase } = require('./supabase');
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          // Sesión expirada sin posibilidad de refrescar → limpia token
          await AsyncStorage.removeItem('token');
          return Promise.reject(error);
        }

        // Guarda el nuevo token y reintenta
        const nuevoToken = data.session.access_token;
        await AsyncStorage.setItem('token', nuevoToken);
        originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.removeItem('token');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Wrapper get con cache ────────────────────────────────────────────────────
const originalGet = api.get.bind(api);
api.get = (url, config) => {
  const cached = getCached(url);
  if (cached) {
    // Devuelve datos cacheados inmediatamente como si fuera una respuesta de axios
    return Promise.resolve({ data: cached, status: 200, cached: true });
  }
  return originalGet(url, config);
};

export default api;
