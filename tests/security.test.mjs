import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, readdir, stat } from "node:fs/promises";
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
    "content/extras/extras.runtime.js",
  ]) vm.runInContext(await read(file), context, { filename: file });

  assert.equal(context.window.CHAPTERS.length, 35);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap24")?.part, 3);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap25")?.part, 4);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "cap31")?.part, 4);
  assert.equal(context.window.CHAPTERS.find((item) => item.id === "disclaimer")?.kind, "extra");
});

test("the corrected Part III revision is the canonical website text", async () => {
  const part3 = await read("content/parte-3/parte3.runtime.js");
  for (const text of [
    "Mara sí. En el Archivo, un golpe largo, dos cortos y otro largo significaba página reemplazada.",
    "Su dedo índice repitió el ritmo contra la pared.",
    "Arranqué el micrófono de su soporte. El cable siguió unido al panel.",
    "La carcasa del transmisor estaba rota. Solo un canal respondía.",
    "El responsable episcopal del sabotaje marítimo ha sido identificado y separado de sus funciones.",
  ]) assert.match(part3, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const text of [
    "Su dedo índice tocó una vez la pared.",
    "Arranqué el aparato.",
    "El responsable de la alteración del tránsito ha sido identificado y separado de sus funciones.",
  ]) assert.doesNotMatch(part3, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
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
    "content/extras/extras.runtime.js",
  ]) vm.runInContext(await read(file), context, { filename: file });
  for (const chapter of context.window.CHAPTERS.filter((item) => item.kind !== "extra")) {
    assert.ok(typeof chapter.subtitle === "string" && chapter.subtitle.length >= 24 && chapter.subtitle.length <= 100, chapter.id);
  }
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
