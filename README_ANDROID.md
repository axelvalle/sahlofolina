# Sahlo Folina — edición Android con progresión

Esta carpeta es una copia independiente del sitio de producción. La edición Android funciona sin conexión y conserva el progreso únicamente en el dispositivo mediante Capacitor Preferences, con respaldo compatible en `localStorage` para la versión web.

## Reglas de progresión

- Las Partes II, III, IV, V y VI se abren al completar todos los capítulos narrativos de la parte anterior.
- La Parte V se abre por tramos: prólogo y luego cada arco consecutivo.
- Cada capítulo se marca al tocar **Marcar capítulo como leído**; desplazarse por accidente no cuenta.
- Los logros y el Archivo se revelan según capítulos y partes completadas.
- El modo **Lectura libre** desactiva los bloqueos sin borrar el progreso. Puede cambiarse en Registro o Preferencias.
- No hay cuenta, anuncios, telemetría, compras ni dependencia de un servidor.

## Comandos

```powershell
npm install
npm run verify
npm run android:sync
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

Los artefactos finales también se copian a `deliverables/`.

## Firma de Android

La edición entregada usa `android/sahlo-folina-upload.jks` y `android/keystore.properties`. Ambos están excluidos de Git. Guarda una copia privada de los dos archivos: la misma clave es necesaria para publicar futuras actualizaciones con el mismo identificador `com.sahlofolina.reader`.

No subas `keystore.properties` ni compartas sus contraseñas. Para una publicación oficial, verifica primero el nombre de paquete, la ficha de Play Store, la política de privacidad y la titularidad de todos los recursos.
