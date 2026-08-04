// Registro declarativo de módulos. Se utiliza en documentación, pruebas y despliegue.
window.SAHLO_CONTENT_ROUTES = Object.freeze([
  Object.freeze({ id: "runtime", path: "./content/framework/runtime.js", kind: "framework" }),
  Object.freeze({ id: "parte-1", path: "./content/parte-1/parte1.runtime.js", kind: "part", part: 1 }),
  Object.freeze({ id: "parte-2", path: "./content/parte-2/parte2.runtime.js", kind: "part", part: 2 }),
  Object.freeze({ id: "parte-3", path: "./content/parte-3/parte3.runtime.js", kind: "part", part: 3 }),
  Object.freeze({ id: "parte-4", path: "./content/parte-4/parte4.runtime.js", kind: "part", part: 4 }),
  Object.freeze({ id: "parte-5", path: "./content/parte-5/parte5.runtime.js", kind: "part", part: 5 }),
  Object.freeze({ id: "parte-6", path: "./content/parte-6/parte6.runtime.js", kind: "part", part: 6 }),
  Object.freeze({ id: "extras", path: "./content/extras/extras.runtime.js", kind: "extras" }),
]);

// Rutas públicas limpias del shell. Vercel sirve index.html mediante rewrites
// y la History API conserva estas rutas sin recargar la aplicación.
window.SAHLO_SITE_ROUTES = Object.freeze({
  home: "/inicio",
  library: "/biblioteca",
  about: "/sobre",
  indexPrefix: "/indice/parte-",
  readerPrefix: "/leer/",
});
