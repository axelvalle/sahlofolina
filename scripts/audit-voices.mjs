import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const chapters = [];

for (let part = 1; part <= 5; part += 1) {
  const file = resolve(root, `content/parte-${part}/parte${part}.runtime.js`);
  const source = await readFile(file, "utf8");
  const context = {
    window: {
      SahloContent: {
        registerPart(entry) {
          chapters.push(...entry.chapters);
        },
      },
    },
  };
  vm.runInNewContext(source, context, { filename: file });
}

const isSpeech = (block) => block.type === "speech" || block.type === "dialogue";
const errors = [];
let speechCount = 0;

for (const chapter of chapters.filter((item) => item.kind !== "extra")) {
  chapter.blocks.forEach((block, index) => {
    if (!isSpeech(block)) return;
    speechCount += 1;
    if (typeof block.who !== "string" || !block.who.trim()) {
      errors.push(`${chapter.id}#${index}: intervención sin hablante`);
    }
  });
}

if (speechCount !== 3335) {
  errors.push(`Se esperaban 3335 intervenciones y se encontraron ${speechCount}.`);
}

const expectedChapterIds = Array.from({ length: 41 }, (_, index) => `cap${index + 1}`);
for (const id of expectedChapterIds) {
  if (!chapters.some((chapter) => chapter.id === id)) {
    errors.push(`Falta ${id} en la auditoría.`);
  }
}

const cap12 = chapters.find((chapter) => chapter.id === "cap12");
const cap12Expected = new Map([
  [78, "Bram"],
  [84, "Torchbearer"],
  [88, "Torchbearer"],
  [89, "Lena"],
  [91, "Mara"],
  [95, "Clancy"],
  [97, "Clancy"],
  [98, "Mara"],
]);
for (const [index, who] of cap12Expected) {
  if (cap12?.blocks[index]?.who !== who) {
    errors.push(`cap12#${index}: se esperaba ${who} y figura ${cap12?.blocks[index]?.who ?? "sin voz"}`);
  }
}

if (errors.length) {
  throw new Error(`Auditoría de voces fallida:\n${errors.join("\n")}`);
}

console.log(`Auditoría completa: ${speechCount} intervenciones de los capítulos 1–41 y sus transiciones tienen hablante; el tramo conflictivo del capítulo 12 coincide con la revisión narrativa.`);
