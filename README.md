## Corrección Parte IV

- El índice resuelve dinámicamente `chapter.part`, por lo que los capítulos 25–31 aparecen en Parte IV.
- El lector asigna `data-reader-part="4"` antes de renderizar, activando la paleta azul oscuro y blanca.
- Los recursos principales incluyen una revisión de caché para evitar servir el JavaScript o CSS anterior.

# Sahlo Folina — edición web

Versión de producción del lector y Biblioteca de *Sahlo Folina*. Incluye las Partes I, II, III y IV, progreso de lectura, ajustes tipográficos, extras, disclaimer editorial, Anexo Visual y descargas gratuitas en DOCX y PDF.

## Navegación

El lector usa rutas internas por hash para funcionar tanto en hosting estático como en Next.js y Cloudflare:

```text
/inicio
/indice/parte-1
/indice/parte-2
/indice/parte-3
/indice/parte-4
/biblioteca
/leer/cap25
```

Las rutas `/biblioteca`, `/indice` y `/leer/[chapter]` redirigen al mismo lector sin mantener páginas duplicadas de contenido.

## Estructura canónica

```text
content/
├── framework/
├── parte-1/parte1.runtime.js
├── parte-2/parte2.runtime.js
├── parte-3/parte3.runtime.js
├── parte-4/parte4.runtime.js
├── extras/extras.runtime.js
└── manifest.json
```

Los módulos dentro de `content/` son la fuente editable. `npm run content:sync` genera las copias necesarias dentro de `public/`. No deben editarse directamente los archivos publicados.

Los archivos descargables vigentes se encuentran en `downloads/` y se validan mediante `downloads/manifest.json`.

## Comandos

```bash
npm install
npm run content:sync
npm run content:validate
npm run verify
npm run dev
```

Para producción:

```bash
npm run build
npm run start
```

## Optimización

- Todos los recursos visuales externos usan WebP.
- No se conservan alias JavaScript del framework anterior.
- Las fuentes editoriales antiguas y documentos reemplazados fueron retirados del paquete.
- Las copias de `public/` son intencionales y necesarias para el despliegue; se regeneran desde las fuentes canónicas.

## Distribución

Obra fan no oficial y 100% gratuita. No está autorizada para venta, alquiler ni monetización.


## Rutas limpias en Vercel

El SPA usa `history.pushState()` y publica rutas como `/inicio`, `/biblioteca`,
`/indice/parte-4` y `/leer/cap25`. `vercel.json` reescribe esas solicitudes a
`/index.html` sin redirecciones visibles. Las antiguas URLs `index.html#/...` se
reconocen una vez y se sustituyen automáticamente por su equivalente limpio.
