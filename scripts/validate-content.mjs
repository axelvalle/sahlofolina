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
  part5: "content/parte-5/parte5.runtime.js",
  part6: "content/parte-6/parte6.runtime.js",
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
  ["sw.js", "public/sw.js"],
  ["_headers", "public/_headers"],
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
for (const key of ["framework", "routes", "part1", "part2", "part3", "part4", "part5", "part6", "extras"]) {
  vm.runInContext(sourceText[key], context, { filename: canonical[key] });
}

const chapters = context.window.CHAPTERS;
if (!Array.isArray(chapters) || chapters.length !== 54) {
  throw new Error("El framework debe registrar exactamente 54 entradas.");
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
const part5Prologue = chapters.find((item) => item.id === "prologo-parte-5");
if (!part5Prologue || part5Prologue.part !== 5 || part5Prologue.arc !== 0 || part5Prologue.kind !== "prologue") {
  throw new Error("El prólogo de la Parte V debe permanecer independiente de los tres arcos.");
}
const part5Chapters = chapters.filter((item) => item.part === 5);
if (part5Chapters.length !== 11 || part5Chapters.at(-1)?.id !== "cap41") {
  throw new Error("La Parte V debe contener el prólogo y los capítulos 32–41.");
}
const part6Prologue = chapters.find((item) => item.id === "prologo-parte-6");
if (!part6Prologue || part6Prologue.part !== 6 || part6Prologue.kind !== "prologue") {
  throw new Error("La Parte VI debe publicar su prólogo independiente.");
}
const part6Chapters = chapters.filter((item) => item.part === 6);
if (part6Chapters.length !== 8 || part6Chapters.at(-1)?.id !== "cap48") {
  throw new Error("La Parte VI debe contener el prólogo y los capítulos 42–48.");
}
for (let number = 42; number <= 48; number += 1) {
  const chapter = chapters.find((item) => item.id === `cap${number}`);
  if (!chapter || chapter.part !== 6) throw new Error(`cap${number} no está ruteado en la Parte VI.`);
}
if (!part6Prologue.hero?.background?.includes("the-contract-cover.webp")) {
  throw new Error("El prólogo de la Parte VI necesita su portada de The Contract.");
}
for (let number = 32; number <= 41; number += 1) {
  const chapter = chapters.find((item) => item.id === `cap${number}`);
  const expectedArc = number <= 34 ? 1 : number <= 38 ? 2 : 3;
  if (!chapter || chapter.part !== 5 || chapter.arc !== expectedArc) {
    throw new Error(`cap${number} no está ruteado en el arco ${expectedArc} de la Parte V.`);
  }
}
if (!part5Prologue.hero?.background?.includes("prologo-voldsoy.webp")) {
  throw new Error("El prólogo de la Parte V necesita su portada costera.");
}
if (!part5Prologue.blocks.some((block) => block.type === "diary")) {
  throw new Error("El prólogo debe conservar las páginas del diario como módulos editoriales.");
}

const diaryBlocks = chapters.flatMap((chapter) =>
  (chapter.blocks ?? [])
    .filter((block) => block.type === "diary")
    .map((block) => ({ chapterId: chapter.id, id: block.id, intro: block.intro })),
);
const extrasChapter = chapters.find((item) => item.id === "extras");
const journalIndex = extrasChapter?.blocks?.find((block) => block.type === "journal-index");
const journalEntries = journalIndex?.entries ?? [];
if (diaryBlocks.length !== 12 || journalEntries.length !== 12) {
  throw new Error(`El Diario de Clancy debe reunir 12 entradas; hay ${diaryBlocks.length} módulos y ${journalEntries.length} accesos.`);
}
const indexedDiaryIds = new Set(journalEntries.map((entry) => entry.targetId));
for (const diary of diaryBlocks) {
  if (!diary.id || !indexedDiaryIds.has(diary.id)) {
    throw new Error(`Entrada del diario ausente del visor independiente: ${diary.id || diary.intro || diary.chapterId}`);
  }
}
for (const requiredPart5Diary of ["diario-022-03moon-17", "diario-022-03moon-18", "diario-024-02moon-09", "diario-024-02moon-25", "diario-024-02moon-28"]) {
  if (!indexedDiaryIds.has(requiredPart5Diary)) {
    throw new Error(`El prólogo de Parte V no está integrado en el Diario de Clancy: ${requiredPart5Diary}`);
  }
}

const definitivePart5Text = JSON.stringify(part5Chapters);
for (const requiredText of [
  "La tela de mi camisa no se hundió bajo sus dedos.",
  "Bram no permitió que la página de la visión entrara de inmediato al archivo.",
  "024 02MOON 25",
  "Las fogatas se sienten como hogar",
  "—Nadie lo derribó —dijo Lena.",
  "Una garra se cerraba y abría contra la tierra sin encontrar apoyo.",
  "La resistencia avanzaba mediante decisiones pequeñas, no como una sola fuerza.",
  "Mara mantuvo la espalda recta hasta que la estructura dejó de verse desde el frente.",
  "Tenía una quemadura reciente en la base del pulgar y sangre seca bajo una uña.",
]) {
  if (!definitivePart5Text.includes(requiredText)) {
    throw new Error(`La Parte V no contiene la corrección maestra requerida: ${requiredText}`);
  }
}
for (const deprecatedText of [
  "No lo derribamos.",
  "La resistencia no avanzaba como una sola fuerza. Se abría en decisiones pequeñas.",
  '"title":"Página del diario","intro":"024 02MOON 25"',
]) {
  if (definitivePart5Text.includes(deprecatedText)) {
    throw new Error(`La Parte V conserva texto de la edición sustituida: ${deprecatedText}`);
  }
}

for (const chapter of chapters.filter((item) => item.kind !== "extra")) {
  for (const block of chapter.blocks ?? []) {
    if ((block.type === "dialogue" || block.type === "speech") && !block.who) {
      throw new Error(`${chapter.id} contiene diálogo sin atribución.`);
    }
  }
}

for (const [chapterId, requiredText] of [
  ["cap13", "Dema, la noche de Nico and the Niners."],
  ["cap31", "Durante la semana siguiente."],
]) {
  const chapter = chapters.find((item) => item.id === chapterId);
  const marker = chapter?.blocks?.find((block) => block.text === requiredText);
  if (marker?.type !== "chronology") {
    throw new Error(`${chapterId} debe conservar su coordenada temporal como bloque inmersivo.`);
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

const assetFiles = [
  ...await walk("assets"),
  ...await walk("public/assets"),
];
const rasterImageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png"]);
for (const path of assetFiles) {
  if (rasterImageExtensions.has(extname(path).toLowerCase())) {
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

const subtitlePattern = /^.{24,100}$/u;
for (const chapter of chapters.filter((item) => item.kind !== "extra")) {
  if (typeof chapter.subtitle !== "string" || !subtitlePattern.test(chapter.subtitle.trim())) {
    throw new Error(`${chapter.id} necesita una sinopsis breve de una sola línea.`);
  }
}
const shellHtml = await readText("index.html");
if (!shellHtml.includes('defer src="./content/framework/runtime.js')) {
  throw new Error("Los módulos de contenido deben cargarse con defer para evitar cascadas de red.");
}
if (!appShell.includes('document.body.dataset.view === "reader" ? state.settings.theme : "dark"')) {
  throw new Error("El tema Papel debe limitarse al reader.");
}

const routeRegistry = await readText("content/framework/routes.js");
for (const cleanRoute of ['home: "/inicio"', 'library: "/biblioteca"', 'indexPrefix: "/indice/parte-"', 'readerPrefix: "/leer/"']) {
  if (!routeRegistry.includes(cleanRoute)) throw new Error(`Ruta pública limpia ausente: ${cleanRoute}`);
}
if (!shellHtml.includes('<base href="/" />')) {
  throw new Error("El shell necesita una base raíz para resolver assets desde rutas profundas.");
}
if (!appShell.includes("window.location.pathname") || !appShell.includes('addEventListener("popstate"')) {
  throw new Error("El SPA debe navegar mediante pathname, pushState y popstate.");
}
if (appShell.includes('addEventListener("hashchange"')) {
  throw new Error("El listener hashchange heredado todavía está activo.");
}
const nextRoutingConfig = await readText("next.config.ts");
if (!nextRoutingConfig.includes("beforeFiles: spaRoutes.map") || !nextRoutingConfig.includes('destination: "/index.html"')) {
  throw new Error("Next.js debe aplicar los rewrites SPA antes del filesystem.");
}
const vercelConfig = JSON.parse(await readText("vercel.json"));
const requiredRewrites = ["/", "/inicio", "/biblioteca", "/indice", "/indice/:part", "/indice/:part/:arc", "/leer/:chapter", "/leer/:chapter/:target"];
for (const source of requiredRewrites) {
  const rewrite = vercelConfig.rewrites?.find((entry) => entry.source === source);
  if (!rewrite || rewrite.destination !== "/index.html") {
    throw new Error(`Rewrite de Vercel ausente o incorrecto: ${source}`);
  }
}
for (const staleStub of ["app/page.tsx", "app/biblioteca/page.tsx", "app/indice/page.tsx", "app/leer/[chapter]/page.tsx"]) {
  try {
    await stat(resolve(root, staleStub));
    throw new Error(`Stub de redirección Next heredado: ${staleStub}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const searchableFiles = [
  "index.html", "styles.css", "app.js", "library.js",
  "assets/fonts/google-fonts.css",
  canonical.part1, canonical.part2, canonical.part3, canonical.part4, canonical.part5, canonical.part6, canonical.extras,
];
const searchableText = (await Promise.all(searchableFiles.map(readText))).join("\n");
for (const path of await walk("assets")) {
  const isLocalFont = path.startsWith("assets/fonts/")
    && searchableText.includes(path.replace(/^assets\/fonts\//, "./"));
  if (!isLocalFont && !searchableText.includes(path) && !searchableText.includes(path.replace(/^assets\//, "./assets/"))) {
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
if (!library.includes('image.loading = "lazy"') || library.includes('document.addEventListener("DOMContentLoaded", renderLibrary')) {
  throw new Error("La Biblioteca debe renderizarse bajo demanda y usar imágenes diferidas.");
}
for (const file of downloadsManifest.files) {
  if (!library.includes(file.name)) throw new Error(`La Biblioteca no publica ${file.name}.`);
}


for (const requiredPart6Asset of [
  "assets/library/parte-6-cover.webp",
  "downloads/Sahlo-Folina-Parte-VI.docx",
  "downloads/Sahlo-Folina-Parte-VI.pdf",
]) {
  if (!searchableText.includes(requiredPart6Asset) && !library.includes(requiredPart6Asset.replace(/^assets\//, "./assets/").replace(/^downloads\//, "./downloads/"))) {
    throw new Error(`La publicación de Parte VI no referencia ${requiredPart6Asset}.`);
  }
}
for (const requiredPart5Asset of [
  "assets/library/parte-5-cover.webp",
  "downloads/Sahlo-Folina-Parte-V.docx",
  "downloads/Sahlo-Folina-Parte-V.pdf",
]) {
  if (!searchableText.includes(requiredPart5Asset) && !library.includes(requiredPart5Asset.replace(/^assets\//, "./assets/").replace(/^downloads\//, "./downloads/"))) {
    throw new Error(`La publicación de Parte V no referencia ${requiredPart5Asset}.`);
  }
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
if (part4DialogueCount !== 582) {
  throw new Error(`La Parte IV debe conservar 582 intervenciones atribuidas; se encontraron ${part4DialogueCount}.`);
}
for (const requiredText of [
  "Keons murió antes de que la ciudad despertara con la muerte de Clancy ya redactada.",
  "Durante las horas siguientes reaparecía dentro de un radio corto, como si la marea o la imprecisión de la triangulación desplazaran la señal entre las mismas rocas.",
  "La patrulla encontró al pasajero en tierra, cubierto por una lona, con una botella cerrada a su lado y el panel asegurado entre dos piedras.",
  "Mi última ubicación verificable antes del naufragio estaba en Trench",
  "Ahora sé que su relato coloca mi rostro en un lugar donde no puedo verificar mi cuerpo.",
  "POSIBILIDAD NO CONFIRMADA.",
  "VIVO NO SIGNIFICA A SALVO.",
  "Aquella noche comprendí que también podía ser una distancia recorrida por una señal.",
]) {
  if (!JSON.stringify(part4).includes(requiredText)) {
    throw new Error(`La Parte IV no contiene el texto canónico requerido: ${requiredText}`);
  }
}
for (const deprecatedText of [
  "regreso posterior hacia el oeste",
  "No Chances detectó el transmisor cuando el panel volvió hacia el oeste.",
  "Durante Saturday yo estaba en Trench",
  "Era una dirección. Él le dio mi rostro.",
  "Torchbearer",
]) {
  if (JSON.stringify(part4).includes(deprecatedText)) {
    throw new Error(`La Parte IV conserva texto de la edición sustituida: ${deprecatedText}`);
  }
}

console.log(
  `Validación completa: ${chapters.length} entradas, ${assetFiles.filter((path) => extname(path).toLowerCase() === ".webp").length} assets WebP y ${downloadsManifest.files.length} descargas vigentes.`,
);
