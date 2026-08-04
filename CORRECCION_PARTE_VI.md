# Corrección de apertura de Parte VI

La Parte VI no abría porque el selector y el contenido nuevo convivían con una versión anterior de `app.js` servida por el Service Worker.

Se corrigió lo siguiente:

- Ruta limpia `/indice/parte-6`.
- Registro de `parte6.runtime.js` en el catálogo de módulos.
- Cache busting unificado: `20260731-part6-routefix-r19`.
- Service Worker renovado y con recursos de Parte VI incluidos.
- Sincronización entre raíz y `public/`.
- Auditoría de voces extendida hasta los capítulos 42–48.

Después de desplegar, realiza una recarga forzada con `Ctrl + F5` una sola vez. Si Vercel conserva un deployment anterior, publica esta carpeta como un nuevo deployment.
