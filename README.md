# Sahlo Folina — edición web de producción

Lector editorial y Biblioteca digital de *Sahlo Folina*. Publica las Partes I–V, progreso de lectura, preferencias tipográficas, Diario de Clancy, Extras, aviso legal, Biblioteca y descargas gratuitas en DOCX y PDF.

## Ediciones canónicas publicadas

- Partes I y II: edición literaria maestra definitiva consolidada en los capítulos 1–17.
- Parte III: edición canónica consolidada.
- Parte IV: edición canónica consolidada.
- Parte V: edición literaria maestra definitiva, organizada mediante prólogo y tres arcos internos.

La fuente editable del contenido web está dentro de `content/`. Las copias de `public/content/` se generan mediante sincronización y no deben editarse manualmente.

## Rutas principales

```text
/inicio
/sobre
/biblioteca
/indice/parte-1
/indice/parte-2
/indice/parte-3
/indice/parte-4
/indice/parte-5
/indice/parte-5/prologo
/indice/parte-5/arco-1
/indice/parte-5/arco-2
/indice/parte-5/arco-3
/leer/cap1
/leer/cap41
```

El SPA utiliza `history.pushState()` y Vercel reescribe las rutas hacia `index.html` sin alterar la URL visible.

## Estructura canónica

```text
content/
├── framework/
├── parte-1/parte1.runtime.js
├── parte-2/parte2.runtime.js
├── parte-3/parte3.runtime.js
├── parte-4/parte4.runtime.js
├── parte-5/parte5.runtime.js
├── extras/extras.runtime.js
└── manifest.json
```

Los documentos descargables vigentes están en `downloads/` y se verifican mediante `downloads/manifest.json`.

## Instalación y desarrollo

```bash
npm install
npm run verify
npm run dev
```

Producción:

```bash
npm run build
npm run start
```

## Validación

```bash
npm run content:sync
npm run content:validate
npm test
```

`npm run verify` ejecuta sincronización, auditoría de contenido, comprobación de descargas, validación de assets WebP y pruebas automatizadas.

## Distribución

Obra fan no oficial y 100% gratuita. No está autorizada para venta, alquiler ni monetización.
