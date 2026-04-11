# SubePE App

Esta es la aplicacion cliente para el sistema SubePE. Esta construida usando React Native y Expo, disenada tanto para pasajeros como para conductores.

Esta interaz maneja:

- Registro e inicio de sesion (mediante Supabase Auth)
- Generacion y lectura de QR para el cobro de pasajes
- Sistema de seguimiento de paraderos y cobro automatico
- Sistema de fidelidad y recompensas
- Alertas y comunicados en tiempo real

## Requisitos previos

- Node.js instaldo (se recomienda la version 18 o superior)
- App Expo Go instalada en un dispositivo fisico (Android o iOS) o un emulador instalado (Android Studio / Xcode)

## Configuracion e Instalacion

1. Instalar las dependencias del proyecto:

   ```bash
   npm install
   ```

2. Configuracion de la red:
   Dado que esta aplicacion usa un servidor Express personalizado para su lógica de negocios, asegurate de que la aplicacion apunte correctamente a la direccion IP local de la maquina donde se ejecuta el backend, o al dominio en la nube una vez desplegado.
   Esto se configura habitualmente en `src/services/api.js`.

3. Variables de entorno:
   Si este proyecto manejara claves secretas de APIs fuera de Supabase anon keys, deberias declararlas en un archivo `.env`. (El archivo `.gitignore` evitara que subas claves comprometedoras al repositorio de git).

## Ejecutar el Entorno de Desarrollo

Para iniciar el servidor de empaquetado (Metro Bundler) de Expo:

```bash
npx expo start --clear
o
npx expo start --tunnel
```

Esto desplegara un codigo QR en la terminal.

- En Android: Escanea el codigo QR usando la aplicacion Expo Go.
- En iOS: Escanea el codigo usando la aplicacion nativa de Camara del iPhone (necesitas la app Expo Go instalada).
- Presiona `a` para abrir directamente en el simulador de Android.

## Notas sobre los Estilos

Este proyecto esta configurado con NativeWind, lo que nos permite usar utilidades de Tailwind CSS dirctamente en los componentes mediante la propiedad `className`.

## Construccion del Archivo Ejecutable (APK)

Para compilar la aplicacion a un formato compatible de instalacion para los usuarios finales, se recomienda usar EAS Build de Expo.

1. Instalar EAS CLI globalmente si no lo tienes:

   ```bash
   npm install -g eas-cli
   ```

2. Inicia sesion en tu cuenta de expo:

   ```bash
   eas login
   ```

3. Compilar la aplicacion para Android (APK):
   Para generar un archivo `.apk` local asegúrate de tener correctamente configurado un perfil en `eas.json` (por ejemplo un perfil local o un perfil que especifique que genere un APK en vez de un AAB) y ejecuta:
   ```bash
   eas build -p android --profile preview
   ```
   _El comando anterior asume la existencia de un build profile para generar `.apk` directamente._
