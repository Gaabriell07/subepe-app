import { registerRootComponent } from 'expo';
import App from './App';

/**
 * NativeWind 4.x + React Native New Architecture bug workaround.
 *
 * La función `printUpgradeWarning` de NativeWind llama JSON.stringify()
 * sobre los props del componente para generar un mensaje de advertencia.
 * Si el componente es una pantalla de React Navigation, sus props incluyen
 * el objeto `navigation`, que tiene referencias a `NavigationStateContext`.
 * JSON.stringify llama los getters de ese contexto fuera del árbol de React,
 * lo que lanza "Couldn't find a navigation context" y rompe el render.
 *
 * Fix: parchear JSON.stringify para que capture errores de getters silenciosamente.
 * Solo aplica en DEV para no impactar el bundle de producción.
 */
if (__DEV__) {
  const _nativeStringify = JSON.stringify;
  JSON.stringify = function patchedStringify(value, replacer, space) {
    try {
      return _nativeStringify(value, replacer, space);
    } catch (_e) {
      // Si JSON.stringify falla (ej: por un getter que lanza), devolver undefined
      // para que printUpgradeWarning falle silenciosamente en lugar de crashear.
      return undefined;
    }
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
