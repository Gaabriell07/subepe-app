import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://sube-pe-backend.onrender.com/api',
  timeout: 10000, 
  headers: { 'Content-Type': 'application/json' },
});

const CACHE_TTL_MS = {
  '/pasajero/comunicados': 5 * 60 * 1000, 
  '/pasajero/puntos':      60 * 1000,      
  '/pasajero/saldo':       30 * 1000,      
  '/pasajero/viajes':      30 * 1000,      
};

const memCache = new Map(); 

function getCached(url) {
  const entry = memCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memCache.delete(url); return null; }
  return entry.data;
}

function setCache(url, data) {
  const ttl = CACHE_TTL_MS[url];
  if (!ttl) return; 
  memCache.set(url, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache(url) {
  memCache.delete(url);
}

export function clearAllCache() {
  memCache.clear();
}

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

api.interceptors.response.use(
  (response) => {
    
    if (response.config.method === 'get') {
      const url = response.config.url;
      setCache(url, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { supabase } = require('./supabase');
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          
          await AsyncStorage.removeItem('token');
          return Promise.reject(error);
        }

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

const originalGet = api.get.bind(api);
api.get = (url, config) => {
  const cached = getCached(url);
  if (cached) {
    
    return Promise.resolve({ data: cached, status: 200, cached: true });
  }
  return originalGet(url, config);
};

export default api;
