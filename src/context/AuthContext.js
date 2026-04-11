import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();

    // Escucha cambios de sesión de Supabase (login, logout, refresco de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await sincronizarUsuario(session);
        } else {
          await AsyncStorage.removeItem('usuario');
          setUsuario(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const cargarSesion = async () => {
    try {
      // Supabase refresca el token automáticamente si tiene refresh token guardado
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await sincronizarUsuario(session);
        return;
      }

      // Fallback: mostrar datos del usuario cacheados mientras se resuelve
      const usuarioGuardado = await AsyncStorage.getItem('usuario');
      if (usuarioGuardado) {
        setUsuario(JSON.parse(usuarioGuardado));
      }
    } catch (error) {
      console.error('Error cargando sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Sincroniza el usuario de Supabase con el backend (busca o crea el registro en la BD).
   * Funciona tanto para email/password como para Google OAuth.
   */
  const sincronizarUsuario = async (session) => {
    try {
      const metadatos = session.user.user_metadata;

      const { data } = await api.post('/auth/registro-google', {
        supabaseId: session.user.id,
        email: session.user.email,
        nombres: metadatos?.full_name?.split(' ')[0] || metadatos?.name || '',
        apellidos: metadatos?.full_name?.split(' ').slice(1).join(' ') || '',
      });

      await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return data.usuario;
    } catch (error) {
      console.error('Error sincronizando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Login con email/password — hace signInWithPassword DIRECTAMENTE en el frontend
   * para que la sesión de Supabase quede guardada localmente.
   * Así api.js puede obtener el token con getSession() sin necesidad de AsyncStorage.
   */
  const login = async (email, password) => {
    // 1. Autenticar directamente con Supabase (guarda la sesión en el cliente)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // 2. Sincronizar con nuestro backend para obtener los datos del usuario (rol, etc.)
    const usuarioData = await sincronizarUsuario(authData.session);
    return usuarioData;
  };

  const registro = async (datos) => {
    const { data } = await api.post('/auth/registro', datos);
    return data;
  };

  const loginConGoogle = async () => {
    const redirectTo = Linking.createURL('/auth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
      if (exchangeError) throw exchangeError;
      // onAuthStateChange detecta la nueva sesión y llama sincronizarUsuario
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Login cancelado');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, login, registro, loginConGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
