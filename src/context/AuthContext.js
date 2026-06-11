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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          await AsyncStorage.setItem('token', session.access_token);
          return;
        }
        if (session?.user) {
          await sincronizarUsuario(session);
        } else {
          await AsyncStorage.multiRemove(['token', 'usuario']);
          setUsuario(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const cargarSesion = async () => {
    try {
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await sincronizarUsuario(session);
        return;
      }

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

  const sincronizarUsuario = async (session) => {
    try {
      const metadatos = session.user.user_metadata;

      if (session?.access_token) {
        await AsyncStorage.setItem('token', session.access_token);
      }

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
      
      if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        console.warn('Backend no disponible, usando datos cacheados...');
        try {
          const usuarioGuardado = await AsyncStorage.getItem('usuario');
          if (usuarioGuardado) {
            const usuarioCacheado = JSON.parse(usuarioGuardado);
            setUsuario(usuarioCacheado);
            return usuarioCacheado;
          }
        } catch (_) {}
      } else {
        console.error('Error sincronizando usuario:', error);
      }
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

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
      
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Login cancelado');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['token', 'usuario']);
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
