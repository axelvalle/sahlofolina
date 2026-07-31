import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function walk(directory) {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) output.push(...await walk(relative));
    else output.push(relative);
  }
  return output;
}

test("the reader uses canonical modular content and safe DOM APIs", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  assert.match(html, /content\/framework\/runtime\.js/);
  assert.match(html, /content\/parte-3\/parte3\.runtime\.js/);
  assert.match(html, /content\/parte-4\/parte4\.runtime\.js/);
  assert.match(html, /content\/parte-5\/parte5\.runtime\.js/);
  assert.match(html, /id="view-library"/);
  assert.match(app, /safeLocalAssetUrl/);
  assert.doesNotMatch(app, /innerHTML|insertAdjacentHTML|document\.write|\beval\s*\(/);
});

test("content registration reconstructs the published saga modules", async () => {
  const context = { window: {}, console };
  vm.createContext(context);
  for (const file of [
    "content/framework/runtime.js", "content/framework/routes.js",
    "content/parte-1/parte1.runtime.js", "content/parte-2/parte2.runtime.js",
    "content/parte-3/parte3.runtime.js", "content/parte-4/parte4.runtime.js",
    "content/parte-5/parte5.runtime.js", "content/extras/extras.runtime.js",
  ]) vm.runInContext(await read(file), context, { filename: file });

  assert.equal(context.window.CHAPTERS.length, 46);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap24")?.part, 3);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap25")?.part, 4);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap31")?.part, 4);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "prologo-parte-5")?.part, 5);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "prologo-parte-5")?.arc, 0);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap41")?.part, 5);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "disclaimer")?.kind, "extra");
});

test("the Parts I and II master literary edition is the published website text", async () => {
  const part1 = await read("content/parte-1/parte1.runtime.js");
  const part2 = await read("content/parte-2/parte2.runtime.js");

  for (const text of [
    "El árbol muerto regresaba junto a la ventana cada poco minuto: el mismo tronco partido, la misma rama doblada hacia la carretera.",
    "Las flores se aplastaron contra el vidrio con un roce seco.",
    "Desde afuera el muro no era pequeño. Era medible.",
    "Esta aldea, después de todo este tiempo, era mi trampa.",
  ]) assert.match(part1, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "El uniforme funerario fue el primero que Mara me hizo repetir.",
    "Ahora sostenían un archivo, una señal y un fuego pequeño que Dema todavía no había conseguido apagar.",
    "La primera comida llegó en un cuenco de metal.",
    "El ritmo no me elevó por encima del miedo; lo repartió entre demasiadas manos para que pudiera aplastarme a solas.",
  ]) assert.match(part2, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "Yo iba en el asiento trasero, con las manos apoyadas sobre las rodillas",
    "Las flores se pegaron al vidrio como insectos.",
    "Desde afuera parecía pequeño.",
    "El primer día después del valle caminé como si alguien estuviera tirando de una cuerda atada a mi garganta.",
  ]) {
    assert.doesNotMatch(part1 + part2, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("the Part III canonical edition is the published website text", async () => {
  const part3 = await read("content/parte-3/parte3.runtime.js");
  for (const text of [
    "Mara sí. En el Archivo, un golpe largo, dos cortos y otro largo significaba página reemplazada.",
    "Su dedo índice repitió el ritmo contra la pared.",
    "Arranqué el micrófono de su soporte. El cable siguió unido al panel.",
    "La carcasa del transmisor estaba rota. Solo un canal respondía.",
    "El responsable episcopal del sabotaje marítimo ha sido identificado y separado de sus funciones.",
    "Su voz ofrecía calor; su pecho no acompañó la frase con un movimiento que yo pudiera ver.",
    "Los cuerpos de Sally y Dan mostraban un deterioro mayor.",
    "Quise creer que el Portador de la Antorcha había encontrado la forma de guiarme hasta allí.",
  ]) assert.match(part3, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "Su dedo índice tocó una vez la pared.",
    "Arranqué el aparato.",
    "El responsable de la alteración del tránsito ha sido identificado y separado de sus funciones.",
    "Sally y Dan estaban peor.",
    "Torchbearer había encontrado la forma de guiarme hasta allí.",
  ]) assert.doesNotMatch(part3, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("the Part IV canonical edition is the published website text", async () => {
  const part4 = await read("content/parte-4/parte4.runtime.js");
  for (const text of [
    "Durante las horas siguientes reaparecía dentro de un radio corto, como si la marea o la imprecisión de la triangulación desplazaran la señal entre las mismas rocas.",
    "La patrulla encontró al pasajero en tierra, cubierto por una lona, con una botella cerrada a su lado y el panel asegurado entre dos piedras.",
    "Mi última ubicación verificable antes del naufragio estaba en Trench",
    "Ahora sé que su relato coloca mi rostro en un lugar donde no puedo verificar mi cuerpo.",
    "POSIBILIDAD NO CONFIRMADA.",
  ]) assert.match(part4, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "regreso posterior hacia el oeste",
    "No Chances detectó el transmisor cuando el panel volvió hacia el oeste.",
    "Durante Saturday yo estaba en Trench",
    "Era una dirección. Él le dio mi rostro.",
    "Torchbearer",
  ]) assert.doesNotMatch(part4, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("published downloads match the production manifest", async () => {
  const manifest = JSON.parse(await read("downloads/manifest.json"));
  for (const file of manifest.files) {
    const source = await readFile(resolve(root, "downloads", file.name));
    const published = await readFile(resolve(root, "public/downloads", file.name));
    assert.equal(source.length, file.bytes);
    assert.equal(sha256(source), file.sha256);
    assert.equal(sha256(source), sha256(published));
  }
});

test("all external visual assets are WebP", async () => {
  for (const directory of ["assets", "public/assets"]) {
    for (const path of await walk(directory)) {
      assert.equal(extname(path).toLowerCase(), ".webp", path);
    }
  }
});

test("legacy aliases and superseded editions are absent", async () => {
  for (const path of [
    "chapters.js", "part2.js", "parte3.js", "extras.js",
    "content-runtime.js", "content-routes.js", "content/fuentes",
    "content/parte-1/manuscritos", "content/parte-2/manuscritos",
    "content/parte-3/manuscritos", "docs",
  ]) {
    await assert.rejects(stat(resolve(root, path)), { code: "ENOENT" });
  }
});

test("Part IV reader uses the blue-white theme and narrative glitches", async () => {
  const styles = await read("styles.css");
  const app = await read("app.js");
  assert.match(styles, /body\[data-reader-part="4"\]/);
  assert.match(styles, /#04101d/);
  assert.match(styles, /part3-terminal-glitch/);
  assert.match(styles, /part4-glitch-transition/);
  assert.match(app, /entersFinalInterlude/);
  assert.match(app, /chapter\.id === "interludio-cuenta-cancelada"/);
  assert.match(app, /previousChapter\?\.id === "cap24"/);
  assert.match(app, /block\.type === "case-file"/);
  assert.match(app, /return Number\.isInteger\(part\) && part >= 1 && PARTS\[part\] \? part : 1;/);
  assert.doesNotMatch(app, /if \(part === 3\) return 3;/);
  assert.match(app, /block\.type === "signal"/);
  assert.match(styles, /reader-case-file/);
  assert.match(styles, /reader-signal/);
});

test("extras do not replace the narrative resume and preferences control motion", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const styles = await read("styles.css");
  assert.match(html, /class="site-link site-preferences"/);
  assert.match(html, /class="index-preferences"/);
  assert.match(html, /data-setting="animations"/);
  assert.match(app, /lastNarrativeChapter/);
  assert.match(app, /if \(isNarrativeChapter\(chapter\)\)/);
  assert.match(app, /state\.settings\.animations === "off"/);
  assert.match(styles, /body\[data-animations="off"\]/);
  assert.match(styles, /part3-terminal-glitch/);
  assert.match(styles, /part4-glitch-transition/);
});


test("paper appearance is limited to the reader and preserves Parts III and IV", async () => {
  const styles = await read("styles.css");
  const app = await read("app.js");
  assert.match(styles, /TEMA PAPEL ADAPTATIVO · PARTES I–IV/);
  assert.match(styles, /body\[data-theme="paper"\]\[data-reader-part="3"\]/);
  assert.match(styles, /body\[data-theme="paper"\]\[data-reader-part="4"\]/);
  assert.match(styles, /body\[data-theme="paper"\]\[data-reader-chapter="interludio-cuenta-cancelada"\]/);
  assert.match(app, /document\.body\.dataset\.view === "reader" \? state\.settings\.theme : "dark"/);
  assert.match(app, /body\.dataset\.preferredTheme = settings\.theme/);
  assert.match(app, /3: "#ffd9e8"/);
  assert.match(app, /4: "#e7eef3"/);
});

test("the shell defers heavy work and chapter subtitles are concise synopses", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const library = await read("library.js");
  const styles = await read("styles.css");
  assert.match(html, /<script defer src="\.\/content\/framework\/runtime\.js/);
  assert.match(html, /display=swap/);
  assert.match(app, /scheduleReadingProgress/);
  assert.match(app, /registerServiceWorker/);
  assert.match(library, /image\.loading = "lazy"/);
  assert.doesNotMatch(library, /DOMContentLoaded", renderLibrary/);
  assert.match(styles, /content-visibility: auto/);
  assert.match(styles, /\.toc-chapter[\s\S]*white-space: nowrap/);

  const context = { window: {}, console };
  vm.createContext(context);
  for (const file of [
    "content/framework/runtime.js",
    "content/parte-1/parte1.runtime.js",
    "content/parte-2/parte2.runtime.js",
    "content/parte-3/parte3.runtime.js",
    "content/parte-4/parte4.runtime.js",
    "content/parte-5/parte5.runtime.js",
    "content/extras/extras.runtime.js",
  ]) vm.runInContext(await read(file), context, { filename: file });
  for (const chapter of context.window.CHAPTERS.filter((item) => item.kind !== "extra")) {
    assert.ok(typeof chapter.subtitle === "string" && chapter.subtitle.length >= 24 && chapter.subtitle.length <= 100, chapter.id);
    assert.doesNotMatch(chapter.subtitle, /^Donde\b/i, chapter.id);
  }
});



test("Part V uses three arc indexes and a cinematic Voldsøy prologue", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const styles = await read("styles.css");
  const part5 = await read("content/parte-5/parte5.runtime.js");

  assert.match(html, /id="part5-arc-switcher"/);
  for (const arc of ["El regreso imposible", "El peso de Clancy", "La brecha"]) {
    assert.match(html, new RegExp(arc));
  }
  assert.match(app, /const PART5_ARCS/);
  assert.match(app, /activeArc/);
  assert.match(app, /chapterArc/);
  assert.match(app, /renderChapterHero/);
  assert.match(styles, /chapter-cinematic-hero/);
  assert.match(styles, /body\[data-reader-part="5"\]/);
  assert.match(styles, /toc-backdrop\[data-part="5"\]/);
  assert.match(part5, /"id": "prologo-parte-5"/);
  assert.match(part5, /"arc": 0/);
  assert.match(part5, /"id": "cap41"/);
  assert.match(app, /const PART5_SECTIONS/);
  assert.match(app, /Parte V · Mapa de lectura/);
  assert.doesNotMatch(html, /data-section="0"/);
  assert.match(html, /data-section="-1"/);
  assert.match(styles, /data-reader-arc="1"/);
  assert.match(styles, /data-reader-arc="2"/);
  assert.match(styles, /data-reader-arc="3"/);
  assert.match(part5, /"type": "diary"/);
  assert.match(part5, /prologo-voldsoy\.webp/);
});



test("each published part opens with a cinematic internal cover", async () => {
  const app = await read("app.js");
  const styles = await read("styles.css");
  const modules = {
    cap1: await read("content/parte-1/parte1.runtime.js"),
    cap5: await read("content/parte-2/parte2.runtime.js"),
    cap18: await read("content/parte-3/parte3.runtime.js"),
    cap25: await read("content/parte-4/parte4.runtime.js"),
  };

  for (const [chapterId, source] of Object.entries(modules)) {
    assert.match(source, new RegExp(`"id": "${chapterId}"[\\s\\S]*?"hero": \\{`));
    assert.match(styles, new RegExp(`data-reader-chapter="${chapterId}"`));
  }
  assert.match(app, /hero\.location \|\| chronology\?\.text/);
  assert.match(styles, /data-reader-chapter="cap35"[\s\S]*chapter-cinematic-title/);
  assert.match(styles, /parte-v-mapa\.webp/);
});

test("Vercel clean routes use History API without Next redirect stubs", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  const routes = await read("content/framework/routes.js");
  const nextConfig = await read("next.config.ts");
  const vercel = JSON.parse(await read("vercel.json"));

  assert.match(html, /<base href="\/" \/>/);
  assert.match(routes, /home: "\/inicio"/);
  assert.match(routes, /library: "\/biblioteca"/);
  assert.match(routes, /indexPrefix: "\/indice\/parte-"/);
  assert.match(routes, /readerPrefix: "\/leer\/"/);
  assert.match(app, /window\.location\.pathname/);
  assert.match(app, /history\[replace \? "replaceState" : "pushState"\]/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.doesNotMatch(app, /addEventListener\("hashchange"/);
  assert.match(nextConfig, /beforeFiles: spaRoutes\.map/);
  assert.match(nextConfig, /destination: "\/index\.html"/);

  const rewriteSources = new Set(vercel.rewrites.map((entry) => entry.source));
  for (const source of [
    "/", "/inicio", "/biblioteca", "/indice", "/indice/:part", "/indice/:part/:arc",
    "/leer/:chapter", "/leer/:chapter/:target",
  ]) assert.ok(rewriteSources.has(source), source);
  assert.ok(vercel.rewrites.every((entry) => entry.destination === "/index.html"));

  for (const path of [
    "app/page.tsx", "app/biblioteca/page.tsx", "app/indice/page.tsx",
    "app/leer/[chapter]/page.tsx",
  ]) await assert.rejects(stat(resolve(root, path)), { code: "ENOENT" });
});

test("clean route helpers parse paths and migrate legacy hashes", async () => {
  const app = await read("app.js");
  const start = app.indexOf("  function normalizeSiteRoute");
  const end = app.indexOf("  function chapterRoute", start);
  assert.ok(start >= 0 && end > start);

  const calls = [];
  const location = { pathname: "/leer/cap26", search: "", hash: "" };
  const window = {
    location,
    history: {
      pushState(_state, _title, url) {
        calls.push(["push", url]);
        location.pathname = url.split("?")[0];
        location.hash = "";
      },
      replaceState(_state, _title, url) {
        calls.push(["replace", url]);
        location.pathname = url.split("?")[0];
        location.hash = "";
      },
    },
  };
  const context = {
    window,
    console,
    SITE_ROUTES: { home: "/inicio" },
    lastAppliedRoute: "",
  };
  vm.createContext(context);
  vm.runInContext(`${app.slice(start, end)}\nthis.routesApi = { normalizeSiteRoute, currentRoute, writeRoute };`, context);

  assert.equal(context.routesApi.currentRoute(), "/leer/cap26");
  location.pathname = "/index.html";
  location.hash = "#/biblioteca";
  assert.equal(context.routesApi.currentRoute(), "/biblioteca");
  context.routesApi.writeRoute("/biblioteca", { replace: true });
  assert.deepEqual(calls.at(-1), ["replace", "/biblioteca"]);
  assert.equal(location.hash, "");

  location.pathname = "/";
  assert.equal(context.routesApi.currentRoute(), "");
  context.routesApi.writeRoute("/inicio", { replace: true });
  assert.deepEqual(calls.at(-1), ["replace", "/inicio"]);
});

test("Clancy journal opens as an independent eleven-slide viewer", async () => {
  const app = await read("app.js");
  const extras = await read("content/extras/extras.runtime.js");
  const styles = await read("styles.css");

  assert.match(extras, /"title": "Diario de Clancy"/);
  assert.match(extras, /visor independiente/);
  assert.equal((extras.match(/"targetId":/g) || []).length, 11);
  assert.match(extras, /"targetId": "diario-022-03moon-17"/);
  assert.match(extras, /"targetId": "diario-022-03moon-18"/);
  assert.match(extras, /"targetId": "diario-024-02moon-09"/);
  assert.match(extras, /"targetId": "diario-024-02moon-25"/);
  assert.match(app, /function openJournalViewer/);
  assert.match(app, /function showJournalSlide/);
  assert.match(app, /case "journal-next"/);
  assert.match(app, /case "journal-prev"/);
  assert.match(app, /Abrir entrada →/);
  assert.doesNotMatch(app, /case "journal-entry":\s*goToJournalEntry/);
  assert.match(styles, /journal-viewer-slide/);
  assert.match(styles, /journal-viewer-dots/);
  assert.match(styles, /\.journal-viewer\[hidden\],[\s\S]*display: none !important/);
  assert.match(styles, /\.journal-viewer\.is-open \{ opacity: 1; pointer-events: auto/);
  assert.match(app, /dialog\.inert = true/);
  assert.match(app, /dialog\.setAttribute\("aria-hidden", "true"\)/);
});

test("security headers remain enabled for Next and Cloudflare", async () => {
  const headers = await read("security-headers.ts");
  const nextConfig = await read("next.config.ts");
  const worker = await read("worker/index.ts");
  for (const name of [
    "Content-Security-Policy", "Permissions-Policy", "Referrer-Policy",
    "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options",
  ]) assert.match(headers, new RegExp(name));
  assert.match(nextConfig, /SECURITY_HEADERS/);
  assert.match(worker, /SECURITY_HEADERS/);
});


test("the public shell exposes editorial identity, About page and share metadata", async () => {
  const html = await read("index.html");
  const app = await read("app.js");
  assert.match(html, /id="view-about"/);
  assert.match(html, /data-action="goto-about"/);
  assert.match(html, /property="og:title" content="Sahlo Folina/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /assets\/social\/sahlo-folina-og\.webp/);
  assert.match(html, /<span>Sahlo Folina<\/span>/);
  assert.doesNotMatch(html, /integrado(?:s)?<\/span>/);
  assert.match(app, /function goToAbout/);
  assert.match(app, /Continúa desde/);
  assert.match(app, /Prólogo disponible/);
});
