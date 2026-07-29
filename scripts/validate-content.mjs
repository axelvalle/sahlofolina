import { createHash } from "node:crypto";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve, relative } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const read = (path) => readFile(resolve(root, path));
const readText = async (path) => (await read(path)).toString("utf8");

async function walk(directory) {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(relative(root, path)));
    } else {
      files.push(relative(root, path).replaceAll("\\", "/"));
    }
  }
  return files;
}

const canonical = {
  framework: "content/framework/runtime.js",
  routes: "content/framework/routes.js",
  part1: "content/parte-1/parte1.runtime.js",
  part2: "content/parte-2/parte2.runtime.js",
  part3: "content/parte-3/parte3.runtime.js",
  part4: "content/parte-4/parte4.runtime.js",
  extras: "content/extras/extras.runtime.js",
  manifest: "content/manifest.json",
};

for (const path of Object.values(canonical)) {
  const source = await read(path);
  const published = await read(`public/${path}`);
  if (sha256(source) !== sha256(published)) {
    throw new Error(`Archivo público desincronizado: ${path}`);
  }
}

for (const [sourcePath, publicPath] of [
  ["index.html", "public/index.html"],
  ["index.html", "public/reader.html"],
  ["app.js", "public/app.js"],
  ["styles.css", "public/styles.css"],
  ["library.js", "public/library.js"],
  ["library.html", "public/library.html"],
]) {
  if (sha256(await read(sourcePath)) !== sha256(await read(publicPath))) {
    throw new Error(`Shell público desincronizado: ${sourcePath}`);
  }
}

const sourceText = Object.fromEntries(
  await Promise.all(Object.entries(canonical).map(async ([key, path]) => [key, await readText(path)])),
);
const context = { window: {}, console };
vm.createContext(context);
for (const key of ["framework", "routes", "part1", "part2", "part3", "part4", "extras"]) {
  vm.runInContext(sourceText[key], context, { filename: canonical[key] });
}

const chapters = context.window.CHAPTERS;
if (!Array.isArray(chapters) || chapters.length !== 35) {
  throw new Error("El framework debe registrar exactamente 35 entradas.");
}
const ids = chapters.map((chapter) => chapter.id);
if (new Set(ids).size !== ids.length) throw new Error("Existen IDs de contenido duplicados.");
for (let number = 1; number <= 31; number += 1) {
  const chapter = chapters.find((item) => item.id === `cap${number}`);
  const expectedPart = number <= 4 ? 1 : number <= 17 ? 2 : number <= 24 ? 3 : 4;
  if (!chapter || chapter.part !== expectedPart) {
    throw new Error(`cap${number} no está ruteado en la Parte ${expectedPart}.`);
  }
}
for (const chapter of chapters.filter((item) => item.kind !== "extra")) {
  for (const block of chapter.blocks ?? []) {
    if ((block.type === "dialogue" || block.type === "speech") && !block.who) {
      throw new Error(`${chapter.id} contiene diálogo sin atribución.`);
    }
  }
}

const correctedPart3Text = JSON.stringify(
  chapters.filter((item) => item.part === 3).map((item) => item.blocks),
);
for (const requiredText of [
  "Mara sí. En el Archivo, un golpe largo, dos cortos y otro largo significaba página reemplazada.",
  "Su dedo índice repitió el ritmo contra la pared.",
  "Arranqué el micrófono de su soporte. El cable siguió unido al panel.",
  "La carcasa del transmisor estaba rota. Solo un canal respondía.",
  "El responsable episcopal del sabotaje marítimo ha sido identificado y separado de sus funciones.",
]) {
  if (!correctedPart3Text.includes(requiredText)) {
    throw new Error(`La Parte III no contiene la corrección requerida: ${requiredText}`);
  }
}
for (const deprecatedText of [
  "Mara sí.\"",
  "Su dedo índice tocó una vez la pared.",
  "Arranqué el aparato.",
  "La carcasa estaba rota. Solo un canal respondía.",
  "El responsable de la alteración del tránsito ha sido identificado y separado de sus funciones.",
]) {
  if (correctedPart3Text.includes(deprecatedText)) {
    throw new Error(`La Parte III conserva texto reemplazado: ${deprecatedText}`);
  }
}

const downloadsManifest = JSON.parse(await readText("downloads/manifest.json"));
for (const file of downloadsManifest.files) {
  for (const prefix of ["downloads", "public/downloads"]) {
    const path = `${prefix}/${file.name}`;
    const buffer = await read(path);
    if (buffer.length !== file.bytes || sha256(buffer) !== file.sha256) {
      throw new Error(`La edición publicada no coincide con el manifiesto: ${path}`);
    }
  }
}

const imageFiles = [
  ...await walk("assets"),
  ...await walk("public/assets"),
];
for (const path of imageFiles) {
  if (![".webp"].includes(extname(path).toLowerCase())) {
    throw new Error(`Formato visual no optimizado: ${path}`);
  }
}

const appShell = await readText("app.js");
if (!/return Number\.isInteger\(part\) && part >= 1 && PARTS\[part\] \? part : 1;/.test(appShell)) {
  throw new Error("El ruteo del lector debe resolver dinámicamente la parte del capítulo.");
}
if (/if \(part === 3\) return 3;/.test(appShell)) {
  throw new Error("El lector conserva el ruteo heredado que reclasifica la Parte IV como Parte I.");
}

const searchableFiles = [
  "index.html", "styles.css", "app.js", "library.js",
  canonical.part1, canonical.part2, canonical.part3, canonical.part4, canonical.extras,
];
const searchableText = (await Promise.all(searchableFiles.map(readText))).join("\n");
for (const path of await walk("assets")) {
  if (!searchableText.includes(path) && !searchableText.includes(path.replace(/^assets\//, "./assets/"))) {
    throw new Error(`Asset canónico sin referencia: ${path}`);
  }
  await access(resolve(root, "public", path));
}

for (const deprecated of [
  "chapters.js", "part2.js", "parte3.js", "extras.js",
  "content-runtime.js", "content-routes.js",
  "public/chapters.js", "public/part2.js", "public/parte3.js", "public/extras.js",
  "public/content-runtime.js", "public/content-routes.js",
  "content/fuentes", "content/parte-1/manuscritos", "content/parte-2/manuscritos",
  "content/parte-3/manuscritos", "docs",
]) {
  try {
    await stat(resolve(root, deprecated));
    throw new Error(`Sobrante heredado detectado: ${deprecated}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const library = await readText("library.js");
for (const file of downloadsManifest.files) {
  if (!library.includes(file.name)) throw new Error(`La Biblioteca no publica ${file.name}.`);
}
if (/parte-5|parte-6/i.test(library)) {
  throw new Error("La Biblioteca muestra partes todavía no publicadas.");
}
for (const requiredPart4Asset of [
  "assets/library/parte-4-cover.webp",
  "downloads/Sahlo-Folina-Parte-IV.docx",
  "downloads/Sahlo-Folina-Parte-IV.pdf",
]) {
  if (!searchableText.includes(requiredPart4Asset) && !library.includes(requiredPart4Asset.replace(/^assets\//, "./assets/").replace(/^downloads\//, "./downloads/"))) {
    throw new Error(`La publicación de Parte IV no referencia ${requiredPart4Asset}.`);
  }
}
const part4 = chapters.filter((item) => item.part === 4);
if (part4.length !== 7 || part4[0]?.id !== "cap25" || part4.at(-1)?.id !== "cap31") {
  throw new Error("La Parte IV debe contener los capítulos 25–31.");
}
const part4DialogueCount = part4.flatMap((chapter) => chapter.blocks ?? [])
  .filter((block) => block.type === "speech" || block.type === "dialogue").length;
if (part4DialogueCount !== 569) {
  throw new Error(`La Parte IV debe conservar 569 intervenciones atribuidas; se encontraron ${part4DialogueCount}.`);
}
for (const requiredText of [
  "Keons murió antes de que la ciudad despertara con la muerte de Clancy ya redactada.",
  "VIVO NO SIGNIFICA A SALVO.",
  "Era una dirección. Él le dio mi rostro.",
  "Aquella noche comprendí que también podía ser una distancia recorrida por una señal.",
]) {
  if (!JSON.stringify(part4).includes(requiredText)) {
    throw new Error(`La Parte IV no contiene el texto requerido: ${requiredText}`);
  }
}

console.log(
  `Validación completa: ${chapters.length} entradas, ${imageFiles.length} assets WebP y ${downloadsManifest.files.length} descargas vigentes.`,
);
