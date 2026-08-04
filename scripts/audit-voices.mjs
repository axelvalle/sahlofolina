import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const chapters = [];

for (let part = 1; part <= 6; part += 1) {
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

if (speechCount !== 4376) {
  errors.push(`Se esperaban 4376 intervenciones y se encontraron ${speechCount}.`);
}

const expectedChapterIds = Array.from({ length: 48 }, (_, index) => `cap${index + 1}`);
for (const id of expectedChapterIds) {
  if (!chapters.some((chapter) => chapter.id === id)) {
    errors.push(`Falta ${id} en la auditoría.`);
  }
}

const part6 = chapters.filter((chapter) => chapter.part === 6);
const allowedPart6Voices = new Set(["Clancy", "Nico", "Mara", "James", "Bram", "Lena", "Portador", "Karta", "Pierre", "Elias", "Keons", "Sacarver", "Lisden", "Vetomo", "Bandito", "Bandita", "Técnica", "Mujer", "Ciudadano", "Joven", "Consejero", "Secretario", "Pasajero", "Huésped", "Figura", "Soren", "Carmen"]);
for (const chapter of part6) {
  chapter.blocks.forEach((block, index) => {
    if (!isSpeech(block)) return;
    if (!allowedPart6Voices.has(block.who)) errors.push(`${chapter.id}#${index}: etiqueta de voz no canónica (${block.who}).`);
  });
}
const part6Expected = new Map([
  ["cap44|—No puedes sacarme —dije.", "Clancy"],
  ["cap44|—No.", "Portador"],
  ["cap44|—No firmé nada —añadí.", "Clancy"],
  ["cap44|—Soy el Portador de la Antorcha —dijo—. Y no voy a rendirme contigo.", "Portador"],
  ["cap45|—Ahora —dijo.", "Portador"],
  ["cap46|—Siempre vuelve —dijo.", "Nico"],
  ["cap48|—El circuito inferior responde —dijo—. El central está dividido.", "James"],
]);
for (const [key, who] of part6Expected) {
  const [chapterId, dialogue] = key.split("|");
  const block = chapters.find((chapter) => chapter.id === chapterId)?.blocks.find((item) => item.text === dialogue);
  if (block?.who !== who) errors.push(`${chapterId}: ${dialogue} debe ser de ${who} y figura ${block?.who ?? "sin voz"}`);
}

const cap12 = chapters.find((chapter) => chapter.id === "cap12");
const contextualExpected = new Map([
  ["cap9|—Arriba.", "James"],
  ["cap10|—Otra vez.", "Mara"],
  ["cap10|—No tienes que verme con esto.", "Mara"],
  ["cap10|—Pero no pongas las manos así. Elias lo hacía cuando estaba fingiendo que no tenía miedo.", "Mara"],
]);
for (const [key, who] of contextualExpected) {
  const [chapterId, text] = key.split("|");
  const block = chapters.find((chapter) => chapter.id === chapterId)?.blocks.find((item) => item.text === text);
  if (block?.who !== who) errors.push(`${chapterId}: ${text} debe ser de ${who}`);
}
const manualExpected = new Map([
  ["cap11#98", "Clancy"],
  ["cap14#53", "Clancy"],
  ["cap14#109", "Torchbearer"],
  ["cap15#47", "Torchbearer"],
  ["cap16#26", "Bram"],
  ["cap16#28", "Bram"],
  ["cap16#86", "Nico"],
  ["cap17#26", "Mara"],
  ["cap17#35", "Mara"],
]);
for (const [key, who] of manualExpected) {
  const [chapterId, rawIndex] = key.split("#");
  const block = chapters.find((chapter) => chapter.id === chapterId)?.blocks[Number(rawIndex)];
  if (block?.who !== who) errors.push(`${key}: debe ser de ${who}`);
}
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

const interlude = chapters.find((chapter) => chapter.id === "cap13");
const interludeExpected = new Map([
  ["—Pueden rastrearla.", "Mara"],
  ["—No sé si es de Clancy.", "Mara"],
  ["—Entonces no la borres.", "James"],
  ["—Ese es el propósito.", "James"],
  ["—¿Y las personas?", "Mara"],
  ["—Entonces no lo guardes sola.", "James"],
  ["—Eso dijiste antes.", "Mara"],
  ["—Nos van a encontrar algún día.", "Mara"],
  ["—Sí.", "James"],
  ["—Él te lo dijo.", "James"],
  ["—No quería obligarte a despedirte antes de tiempo.", "James"],
  ["—Las puertas se pueden reparar.", "James"],
  ["—¿Querías ir con él? —preguntó.", "James"],
]);
for (const [text, who] of interludeExpected) {
  const block = interlude?.blocks.find((item) => item.text === text);
  if (block?.who !== who) {
    errors.push(`cap13 interludio: ${text} debe ser de ${who} y figura ${block?.who ?? "sin voz"}`);
  }
}

if (errors.length) {
  throw new Error(`Auditoría de voces fallida:\n${errors.join("\n")}`);
}

console.log(`Auditoría completa: ${speechCount} intervenciones de los capítulos 1–48, prólogos y transiciones tienen hablante; el tramo conflictivo del capítulo 12 coincide con la revisión narrativa y la Parte VI quedó incluida.`);
