# Rutas limpias en Vercel

La navegación pública utiliza History API y rutas sin hash:

- `/inicio`
- `/biblioteca`
- `/indice`
- `/indice/parte-1` … `/indice/parte-4`
- `/leer/cap1` … `/leer/cap31`
- `/leer/:chapter/:target` para enlaces internos del lector

## Implementación

- `app.js` usa `location.pathname`, `history.pushState()` / `replaceState()` y `popstate`.
- `content/framework/routes.js` contiene únicamente paths públicos limpios.
- `vercel.json` reescribe las rutas SPA a `/index.html` sin cambiar la URL visible.
- `next.config.ts` replica esos rewrites en `beforeFiles` para evitar que Next.js o el filesystem se interpongan.
- Los antiguos stubs de redirección de `app/` fueron eliminados.
- `<base href="/">` garantiza que CSS, JavaScript, imágenes y contenido se resuelvan desde rutas profundas.
- Las antiguas URLs `index.html#/...` se reconocen y se sustituyen mediante `replaceState()` por su equivalente limpio.

## Validación después del despliegue

Comprobar directamente, incluyendo recarga manual:

1. `/inicio`
2. `/biblioteca`
3. `/indice/parte-4`
4. `/leer/cap26`
5. Atrás y Adelante desde el navegador entre lector e índice.
6. Una URL heredada como `/index.html#/biblioteca`, que debe convertirse en `/biblioteca`.

No deben aparecer respuestas 307 hacia `index.html#...`.
