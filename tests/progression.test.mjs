import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("la progresión guiada exige completar la parte anterior", () => {
  assert.match(app, /function partIsUnlocked\(part\)/);
  assert.match(app, /return partIsComplete\(part - 1\);/);
});

test("la Parte V se desbloquea por prólogo y arcos consecutivos", () => {
  assert.match(app, /function partFiveSectionIsUnlocked\(section\)/);
  assert.match(app, /partFiveSectionIsComplete\(section - 1\)/);
});

test("un capítulo solo se completa por una acción explícita", () => {
  assert.match(app, /button\.dataset\.action = "complete-chapter"/);
  assert.match(app, /function completeChapter\(/);
  assert.doesNotMatch(app, /progress\s*>?=\s*0\.9[0-9][\s\S]{0,180}readChapters\.add/);
});

test("el lector permite desactivar los bloqueos sin borrar el progreso", () => {
  assert.match(html, /data-progression-mode="guided"/);
  assert.match(html, /data-progression-mode="free"/);
  assert.match(app, /state\.progressionMode === "free"/);
});

test("logros y archivo se derivan de la lectura, no de datos remotos", () => {
  assert.match(app, /const ACHIEVEMENTS = Object\.freeze\(\[/);
  assert.match(app, /const ARCHIVE_TIERS = Object\.freeze\(\[/);
  assert.match(app, /Capacitor\?\.Plugins\?\.Preferences/);
  assert.doesNotMatch(app, /fetch\([^)]*(progress|achievement|unlock)/i);
});
