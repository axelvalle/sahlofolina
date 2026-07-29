// Registro declarativo de módulos. Se utiliza en documentación, pruebas y despliegue.
window.SAHLO_CONTENT_ROUTES = Object.freeze([
  Object.freeze({ id: "runtime", path: "./content/framework/runtime.js", kind: "framework" }),
  Object.freeze({ id: "parte-1", path: "./content/parte-1/parte1.runtime.js", kind: "part", part: 1 }),
  Object.freeze({ id: "parte-2", path: "./content/parte-2/parte2.runtime.js", kind: "part", part: 2 }),
  Object.freeze({ id: "parte-3", path: "./content/parte-3/parte3.runtime.js", kind: "part", part: 3 }),
  Object.freeze({ id: "parte-4", path: "./content/parte-4/parte4.runtime.js", kind: "part", part: 4 }),
  Object.freeze({ id: "extras", path: "./content/extras/extras.runtime.js", kind: "extras" }),
]);

// Rutas públicas del shell. Al utilizar hash funcionan igual en hosting estático,
// Next.js y Cloudflare sin requerir rewrites del servidor.
window.SAHLO_SITE_ROUTES = Object.freeze({
  home: "#/inicio",
  library: "#/biblioteca",
  indexPrefix: "#/indice/parte-",
  readerPrefix: "#/leer/",
});
