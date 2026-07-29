// Sahlo Folina content runtime v1
// Registra las partes como módulos independientes y reconstruye window.CHAPTERS
// en orden canónico, sin depender del orden de carga de los archivos.
(function initSahloContentRuntime(global) {
  "use strict";

  if (global.SahloContent?.version === 1) return;

  const state = {
    parts: new Map(),
    extras: null,
  };

  function assertPlainObject(value, message) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(message);
    }
  }

  function validateChapter(chapter, expectedPart) {
    assertPlainObject(chapter, "Cada capítulo debe ser un objeto.");
    if (typeof chapter.id !== "string" || !/^[a-z0-9-]+$/.test(chapter.id)) {
      throw new TypeError("Cada capítulo necesita un id seguro y estable.");
    }
    if (!Array.isArray(chapter.blocks)) {
      throw new TypeError(`${chapter.id} no contiene un array de bloques.`);
    }
    if (expectedPart != null && chapter.part !== expectedPart) {
      throw new TypeError(`${chapter.id} debe declarar part: ${expectedPart}.`);
    }
  }

  function rebuild() {
    const ordered = [];
    [...state.parts.keys()]
      .sort((left, right) => left - right)
      .forEach((partId) => ordered.push(...state.parts.get(partId).chapters));
    if (state.extras) ordered.push(...state.extras.chapters);

    const ids = new Set();
    ordered.forEach((chapter) => {
      if (ids.has(chapter.id)) throw new Error(`ID de capítulo duplicado: ${chapter.id}`);
      ids.add(chapter.id);
    });

    global.CHAPTERS = ordered;
    global.SAHLO_CONTENT_STATE = Object.freeze({
      partIds: Object.freeze([...state.parts.keys()].sort((a, b) => a - b)),
      chapterIds: Object.freeze(ordered.map((chapter) => chapter.id)),
      hasExtras: Boolean(state.extras),
    });
  }

  function registerPart(definition) {
    assertPlainObject(definition, "La definición de una parte debe ser un objeto.");
    const { id, slug, title, chapters } = definition;
    if (!Number.isInteger(id) || id < 1) throw new TypeError("El id de parte debe ser entero positivo.");
    if (typeof slug !== "string" || !/^parte-[1-9][0-9]*$/.test(slug)) {
      throw new TypeError("La ruta de una parte debe usar el formato parte-N.");
    }
    if (typeof title !== "string" || !title.trim()) throw new TypeError("La parte necesita título.");
    if (!Array.isArray(chapters) || !chapters.length) throw new TypeError("La parte necesita capítulos.");
    chapters.forEach((chapter) => validateChapter(chapter, id));

    state.parts.set(id, Object.freeze({ id, slug, title, chapters: Object.freeze(chapters) }));
    rebuild();
  }

  function registerExtras(definition) {
    assertPlainObject(definition, "La definición de extras debe ser un objeto.");
    if (!Array.isArray(definition.chapters) || !definition.chapters.length) {
      throw new TypeError("Extras necesita al menos una entrada.");
    }
    definition.chapters.forEach((chapter) => validateChapter(chapter, null));
    state.extras = Object.freeze({ chapters: Object.freeze(definition.chapters) });
    rebuild();
  }

  function getManifest() {
    return Object.freeze({
      parts: Object.freeze(
        [...state.parts.values()]
          .sort((left, right) => left.id - right.id)
          .map(({ id, slug, title, chapters }) => Object.freeze({
            id,
            slug,
            title,
            chapterIds: Object.freeze(chapters.map((chapter) => chapter.id)),
          }))
      ),
      extras: state.extras
        ? Object.freeze(state.extras.chapters.map((chapter) => chapter.id))
        : Object.freeze([]),
    });
  }

  global.CHAPTERS = Array.isArray(global.CHAPTERS) ? global.CHAPTERS : [];
  global.SahloContent = Object.freeze({
    version: 1,
    registerPart,
    registerExtras,
    getManifest,
  });
})(window);
