import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const canonicalFiles = [
  "content/framework/runtime.js",
  "content/framework/routes.js",
  "content/manifest.json",
  "content/parte-1/parte1.runtime.js",
  "content/parte-2/parte2.runtime.js",
  "content/parte-3/parte3.runtime.js",
  "content/parte-4/parte4.runtime.js",
  "content/extras/extras.runtime.js",
];

await rm(resolve(root, "public/content"), { recursive: true, force: true });
for (const relativePath of canonicalFiles) {
  const target = resolve(root, "public", relativePath);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, relativePath), target);
}

const shellFiles = [
  ["index.html", "public/index.html"],
  ["index.html", "public/reader.html"],
  ["app.js", "public/app.js"],
  ["styles.css", "public/styles.css"],
  ["library.js", "public/library.js"],
  ["library.html", "public/library.html"],
];

for (const [sourceRelative, targetRelative] of shellFiles) {
  const target = resolve(root, targetRelative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, sourceRelative), target);
}

for (const directory of ["assets", "downloads"]) {
  await rm(resolve(root, "public", directory), { recursive: true, force: true });
  await cp(resolve(root, directory), resolve(root, "public", directory), {
    recursive: true,
    force: true,
  });
}

console.log(
  "Producción sincronizada: lector, Biblioteca, descargas, assets WebP y contenido de Partes I-IV.",
);
