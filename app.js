(function () {
  "use strict";

  const STORAGE_KEY = "sahlo_folina_state_v2";
  const LEGACY_KEY = "sahlo_folina_state_v1";
  const DISCLAIMER_KEY = "sahlo_folina_disclaimer_ack_v1";
  const ALLOWED_SETTINGS = Object.freeze({
    fontSize: new Set(["sm", "md", "lg", "xl"]),
    lineWidth: new Set(["narrow", "md", "wide"]),
    fontFamily: new Set(["serif", "sans", "mono"]),
    theme: new Set(["dark", "paper"]),
    animations: new Set(["on", "off"])
  });
  const PARTS = Object.freeze({
    1: {
      label: "Parte I",
      indexTitle: "La ciudad sin horizonte",
      context: "Una historia de Dema, Clancy y los Banditos",
      coverLead: "Una historia sobre recordar quién eres cuando una ciudad entera intenta decidirlo por ti.",
      quote: "“Recordar que alguna vez elegiste algo.”",
      quoteBy: "— El hombre de las tuberías"
    },
    2: {
      label: "Parte II",
      indexTitle: "El color que no pueden ver",
      context: "Una historia de Trench, Clancy y los Banditos",
      coverLead: "Una historia sobre cruzar los muros, conservar el color y aprender a elegir incluso cuando todas las rutas parecen cerradas.",
      quote: "“Recordar que alguna vez elegiste algo.”",
      quoteBy: "— Torchbearer"
    },
    3: {
      label: "Parte III",
      indexTitle: "La ciudad aprende a sonreír",
      context: "Una historia de Scaled and Icy",
      coverLead: "OBEDECER ES PERMANECER. RESPETAR LAS REGLAS ES RECORDAR QUIÉN ERES. FUERA DE LOS MUROS SOLO HAY CONFUSIÓN, PÉRDIDA Y PELIGRO. DEMA PROTEGE TU HISTORIA DE LOS QUE QUIEREN DISTORSIONARLA.",
      quote: "“La voluntad no es una habitación con una sola puerta. Yo no puedo entrar donde no existe un acceso.”",
      quoteBy: "— Nico"
    },
    4: {
      label: "Parte IV",
      indexTitle: "Los que se quedaron",
      context: "¿Clancy está muerto?",
      coverLead: "Una historia sobre quienes sostienen la memoria cuando la persona que los unía desaparece y la ciudad intenta convertir su ausencia en una conclusión.",
      quote: "“Recordar que alguna vez elegiste algo.”",
      quoteBy: "— Torchbearer"
    }
  });
  const SITE_ROUTES = window.SAHLO_SITE_ROUTES || Object.freeze({
    home: "#/inicio",
    library: "#/biblioteca",
    indexPrefix: "#/indice/parte-",
    readerPrefix: "#/leer/",
  });
  const state = {
    lastChapter: 0,
    lastNarrativeChapter: 0,
    activePart: 1,
    hasStarted: false,
    readChapters: [],
    chapterProgress: {},
    settings: {
      fontSize: "md",
      lineWidth: "md",
      fontFamily: "serif",
      theme: "dark",
      animations: "on"
    }
  };

  const VIEW_IDS = Object.freeze(["view-cover", "view-toc", "view-library", "view-reader"]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let lastFocusedElement = null;
  let disclaimerLastFocusedElement = null;
  let saveTimer = null;
  let lastAppliedRoute = "";
  let progressFrame = null;
  const readingMinutesCache = new Map();

  function loadState() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const legacy = !current && localStorage.getItem(LEGACY_KEY);
      const parsed = JSON.parse(current || legacy || "null");
      if (!parsed) return;

      if (Number.isInteger(parsed.lastChapter) && parsed.lastChapter >= 0) {
        state.lastChapter = Math.min(parsed.lastChapter, window.CHAPTERS.length - 1);
      }
      if (Number.isInteger(parsed.activePart) && PARTS[parsed.activePart]) {
        state.activePart = parsed.activePart;
      } else {
        const savedChapter = window.CHAPTERS[state.lastChapter];
        if (savedChapter?.kind !== "extra") state.activePart = chapterPart(savedChapter);
      }
      const requestedHasStarted = current ? Boolean(parsed.hasStarted) : true;
      if (Array.isArray(parsed.readChapters)) {
        state.readChapters = [...new Set(parsed.readChapters.filter(
          (index) => Number.isInteger(index) && index >= 0 && index < window.CHAPTERS.length
        ))];
      }
      if (
        parsed.chapterProgress &&
        typeof parsed.chapterProgress === "object" &&
        !Array.isArray(parsed.chapterProgress)
      ) {
        const sanitizedProgress = Object.create(null);
        Object.entries(parsed.chapterProgress).forEach(([chapterIndex, progress]) => {
          const index = Number(chapterIndex);
          const value = Number(progress);
          if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < window.CHAPTERS.length &&
            Number.isFinite(value)
          ) {
            sanitizedProgress[index] = Math.max(0, Math.min(1, value));
          }
        });
        state.chapterProgress = sanitizedProgress;
      }
      const storedNarrativeIndex = Number(parsed.lastNarrativeChapter);
      if (
        Number.isInteger(storedNarrativeIndex) &&
        storedNarrativeIndex >= 0 &&
        storedNarrativeIndex < window.CHAPTERS.length &&
        isNarrativeChapter(window.CHAPTERS[storedNarrativeIndex])
      ) {
        state.lastNarrativeChapter = storedNarrativeIndex;
      } else {
        const progressCandidates = Object.entries(state.chapterProgress)
          .filter(([chapterIndex, progress]) => {
            const index = Number(chapterIndex);
            return Number(progress) > 0 && isNarrativeChapter(window.CHAPTERS[index]);
          })
          .map(([chapterIndex]) => Number(chapterIndex))
          .sort((a, b) => b - a);
        const readCandidates = state.readChapters
          .filter((index) => isNarrativeChapter(window.CHAPTERS[index]))
          .sort((a, b) => b - a);
        const candidates = [
          isNarrativeChapter(window.CHAPTERS[state.lastChapter]) ? state.lastChapter : -1,
          ...progressCandidates,
          ...readCandidates,
        ];
        state.lastNarrativeChapter = candidates.find((index) => index >= 0)
          ?? partChapterIndexes(state.activePart)[0]
          ?? narrativeChapterIndexes()[0]
          ?? 0;
      }

      const hasNarrativeActivity =
        (
          Number.isInteger(storedNarrativeIndex)
          && storedNarrativeIndex >= 0
          && storedNarrativeIndex < window.CHAPTERS.length
          && isNarrativeChapter(window.CHAPTERS[storedNarrativeIndex])
        )
        || isNarrativeChapter(window.CHAPTERS[state.lastChapter])
        || state.readChapters.some((index) => isNarrativeChapter(window.CHAPTERS[index]))
        || Object.entries(state.chapterProgress).some(([chapterIndex, progress]) => (
          Number(progress) > 0 && isNarrativeChapter(window.CHAPTERS[Number(chapterIndex)])
        ));
      state.hasStarted = requestedHasStarted && hasNarrativeActivity;

      if (parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)) {
        Object.entries(ALLOWED_SETTINGS).forEach(([key, allowedValues]) => {
          if (allowedValues.has(parsed.settings[key])) {
            state.settings[key] = parsed.settings[key];
          }
        });
      }
    } catch (error) {
      console.warn("No se pudo cargar el progreso de lectura.", error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("No se pudo guardar el progreso de lectura.", error);
    }
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 250);
  }

  function motionIsReduced() {
    return state.settings.animations === "off"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function chapterMinutes(chapter) {
    const key = chapter?.id || chapter?.title || "unknown";
    if (readingMinutesCache.has(key)) return readingMinutesCache.get(key);
    const text = chapter.blocks
      .flatMap((block) => block.paragraphs || [block.text || ""])
      .join(" ");
    const minutes = Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 210));
    readingMinutesCache.set(key, minutes);
    return minutes;
  }

  function isNarrativeChapter(chapter) {
    return chapter?.kind !== "extra";
  }

  function chapterPart(chapter) {
    const part = Number(chapter?.part);
    return Number.isInteger(part) && part >= 1 && PARTS[part] ? part : 1;
  }

  function narrativeChapterIndexes() {
    return window.CHAPTERS
      .map((chapter, index) => isNarrativeChapter(chapter) ? index : -1)
      .filter((index) => index >= 0);
  }

  function partChapterIndexes(part = state.activePart) {
    return window.CHAPTERS
      .map((chapter, index) => (
        isNarrativeChapter(chapter) && chapterPart(chapter) === part ? index : -1
      ))
      .filter((index) => index >= 0);
  }

  function journalEntryCount(chapter) {
    return chapter.blocks
      .filter((block) => block.type === "journal-index")
      .reduce((total, block) => total + (block.entries || []).length, 0);
  }

  function safeLocalAssetUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;

    try {
      const url = new URL(value, document.baseURI);
      const isSameOrigin = url.origin === window.location.origin;
      const isAsset = url.pathname.includes("/assets/");
      return isSameOrigin && isAsset ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderTOC() {
    const list = $("#toc-list");
    list.replaceChildren();
    const narrativeIndexes = narrativeChapterIndexes();
    let currentGroup = "";

    window.CHAPTERS.forEach((chapter, index) => {
      if (chapter.hiddenFromToc) return;
      const isExtra = !isNarrativeChapter(chapter);
      if (!isExtra && chapterPart(chapter) !== state.activePart) return;

      const partLabel = PARTS[state.activePart].label;
      const group = isExtra
        ? "Extras"
        : chapter.kind === "interlude"
          ? "Interludio"
          : partLabel;
      if (group !== currentGroup) {
        const heading = document.createElement("li");
        heading.className = "toc-group-title";
        const label = document.createElement("span");
        label.textContent = group;
        const description = document.createElement("strong");
        description.textContent = group === partLabel
          ? "Capítulos disponibles"
          : group === "Interludio"
            ? "Documento final"
            : "Archivo complementario";
        heading.append(label, description);
        list.append(heading);
        currentGroup = group;
      }

      const item = document.createElement("li");
      const button = document.createElement("button");
      const isRead = !isExtra && state.readChapters.includes(index);
      item.className = `toc-entry${isExtra ? " toc-entry-extra" : ""}`;

      button.type = "button";
      button.className = `toc-item${isRead ? " is-read" : ""}${isExtra ? " toc-item-extra" : ""}`;
      button.dataset.chapter = index;
      button.setAttribute("aria-label", `${chapter.number}: ${chapter.title}`);

      const number = document.createElement("span");
      number.className = "toc-number";
      const chapterNumber = Number.parseInt(chapter.number.match(/\d+/)?.[0] || "", 10);
      const isDisclaimer = chapter.id === "disclaimer";
      number.textContent = isExtra
        ? isDisclaimer ? "AV" : "EX"
        : chapter.kind === "interlude"
          ? "IN"
          : String(Number.isFinite(chapterNumber) ? chapterNumber : narrativeIndexes.indexOf(index) + 1)
              .padStart(2, "0");

      const content = document.createElement("span");
      content.className = "toc-content";
      const name = document.createElement("strong");
      name.className = "toc-name";
      name.textContent = chapter.title;
      const subtitle = document.createElement("span");
      subtitle.className = "toc-chapter";
      subtitle.textContent = chapter.subtitle || chapter.number;
      content.append(name, subtitle);

      const meta = document.createElement("span");
      meta.className = "toc-meta";
      const time = document.createElement("span");
      const availableEntries = journalEntryCount(chapter);
      time.textContent = isExtra
        ? isDisclaimer
          ? `${chapterMinutes(chapter)} min`
          : `${availableEntries} entradas disponibles`
        : `${chapterMinutes(chapter)} min`;
      const status = document.createElement("span");
      status.className = "toc-state";
      status.textContent = isExtra
        ? isDisclaimer ? "Leer" : "Explorar"
        : isRead
          ? "Leído ✓"
          : index === state.lastChapter && state.hasStarted
            ? "En curso"
            : "Leer";
      const arrow = document.createElement("span");
      arrow.className = "toc-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      meta.append(time, status);
      button.append(number, content, meta, arrow);
      button.addEventListener("click", () => goToReader(index));
      item.append(button);
      list.append(item);
    });

    updateSummary();
  }

  function renderChapter(index) {
    const chapter = window.CHAPTERS[index];
    const reader = $("#reader");
    reader.replaceChildren();

    if (chapter.id === "capitulo-18") {
      const notice = document.createElement("aside");
      notice.className = "sai-authorized-notice";
      notice.setAttribute("aria-label", "Mensaje autorizado de DMA ORG");

      const noticeLabel = document.createElement("p");
      noticeLabel.className = "sai-authorized-label";
      noticeLabel.textContent = "DMA ORG // MENSAJE AUTORIZADO";

      const noticeBody = document.createElement("div");
      noticeBody.className = "sai-authorized-body";
      [
        "OBEDECER ES PERMANECER.",
        "RESPETAR LAS REGLAS ES RECORDAR QUIÉN ERES.",
        "FUERA DE LOS MUROS SOLO HAY CONFUSIÓN, PÉRDIDA Y PELIGRO.",
        "DEMA PROTEGE TU HISTORIA DE LOS QUE QUIEREN DISTORSIONARLA."
      ].forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        noticeBody.append(paragraph);
      });

      const noticeStamp = document.createElement("p");
      noticeStamp.className = "sai-authorized-stamp";
      noticeStamp.textContent = "VERSIÓN CÍVICA APROBADA // INICIO DE TRANSMISIÓN";
      notice.append(noticeLabel, noticeBody, noticeStamp);
      reader.append(notice);
    }

    const header = document.createElement("header");
    header.className = "chapter-head";
    const eyebrow = document.createElement("p");
    eyebrow.className = "chapter-eyebrow";
    eyebrow.textContent = chapter.number;
    const title = document.createElement("h1");
    title.className = "chapter-title";
    title.textContent = chapter.title;
    header.append(eyebrow, title);

    if (chapter.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "chapter-sub";
      subtitle.textContent = chapter.subtitle;
      header.append(subtitle);
    }
    reader.append(header);

    chapter.blocks.forEach((block, blockIndex) => {
      const node = renderBlock(block, { chapterIndex: index, blockIndex });
      if (node) reader.append(node);
    });

    const narrativeIndexes = narrativeChapterIndexes();
    const narrativePosition = narrativeIndexes.indexOf(index);
    const isExtra = narrativePosition === -1;
    const currentPartIndexes = isExtra ? [] : partChapterIndexes(chapterPart(chapter));
    const currentPartPosition = currentPartIndexes.indexOf(index);
    $("#reader-position").textContent = isExtra
      ? "Extras"
      : `${currentPartPosition + 1} / ${currentPartIndexes.length}`;
    $("#reader-kicker").textContent = chapter.number;
    $("#reader-current-title").textContent = chapter.title;

    const previous = $("#prev-chapter");
    const next = $("#next-chapter");
    const previousIndex = narrativePosition > 0 ? narrativeIndexes[narrativePosition - 1] : -1;
    const nextIndex = narrativePosition >= 0 && narrativePosition < narrativeIndexes.length - 1
      ? narrativeIndexes[narrativePosition + 1]
      : -1;
    previous.hidden = isExtra;
    next.hidden = isExtra;
    previous.disabled = previousIndex === -1;
    next.disabled = nextIndex === -1;
    previous.dataset.chapterTarget = String(previousIndex);
    next.dataset.chapterTarget = String(nextIndex);
    $("#prev-title").textContent = previousIndex >= 0 ? window.CHAPTERS[previousIndex].title : "";
    $("#next-title").textContent = nextIndex >= 0 ? window.CHAPTERS[nextIndex].title : "";
  }

  function renderBlock(block) {
    if (block.type === "p") {
      const paragraph = document.createElement("p");
      paragraph.textContent = block.text;
      return paragraph;
    }

    if (block.type === "h2" || block.type === "h3") {
      const heading = document.createElement(block.type);
      heading.className = block.type === "h2" ? "section-title" : "section-subtitle";
      heading.textContent = block.text;
      return heading;
    }

    if (block.type === "dialogue") {
      const paragraph = document.createElement("p");
      paragraph.className = "dialogue";
      if (block.who) {
        const speaker = document.createElement("strong");
        speaker.className = "dialogue-speaker";
        speaker.textContent = `${block.who}: `;
        paragraph.append(speaker);
      }
      paragraph.append(document.createTextNode(`“${block.text}”`));
      return paragraph;
    }

    if (block.type === "speech") {
      const paragraph = document.createElement("p");
      paragraph.className = "dialogue speech-dialogue";
      if (block.who) {
        const speaker = document.createElement("strong");
        speaker.className = "dialogue-speaker";
        speaker.textContent = `${block.who}: `;
        paragraph.append(speaker);
      }
      paragraph.append(document.createTextNode(block.text));
      return paragraph;
    }

    if (block.type === "epigraph") {
      const quote = document.createElement("blockquote");
      quote.className = "pull-quote";
      const text = document.createElement("p");
      text.textContent = block.text;
      quote.append(text);
      if (block.attr) {
        const attribution = document.createElement("cite");
        attribution.textContent = `— ${block.attr}`;
        quote.append(attribution);
      }
      return quote;
    }

    if (block.type === "transmission") {
      const transmission = document.createElement("aside");
      transmission.className = "dema-transmission";
      const label = document.createElement("span");
      label.textContent = "TRANSMISIÓN // DEMA";
      const text = document.createElement("p");
      text.textContent = block.text;
      transmission.append(label, text);
      return transmission;
    }

    if (block.type === "scene") {
      const separator = document.createElement("div");
      separator.className = "scene-break";
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = block.text || "· · ·";
      return separator;
    }

    if (block.type === "chronology") {
      const marker = document.createElement("aside");
      marker.className = "reader-chronology";
      const label = document.createElement("span");
      label.textContent = block.label || "REGISTRO TEMPORAL";
      const text = document.createElement("p");
      text.textContent = block.text;
      marker.append(label, text);
      return marker;
    }

    if (block.type === "case-file") {
      const panel = document.createElement("section");
      panel.className = "reader-case-file";
      const header = document.createElement("header");
      const status = document.createElement("span");
      status.textContent = block.label || "ARCHIVO // REGISTRO INTERNO";
      const indicator = document.createElement("i");
      indicator.setAttribute("aria-hidden", "true");
      header.append(status, indicator);
      const body = document.createElement("div");
      (block.rows || []).forEach((rowText) => {
        const row = document.createElement("p");
        row.textContent = rowText;
        body.append(row);
      });
      panel.append(header, body);
      return panel;
    }

    if (block.type === "signal") {
      const signal = document.createElement("section");
      signal.className = "reader-signal";
      const label = document.createElement("span");
      label.textContent = block.label || "SEÑAL";
      const pulses = document.createElement("div");
      pulses.className = "reader-signal-pulses";
      (block.pulses || []).forEach((pulseText, pulseIndex) => {
        const pulse = document.createElement("span");
        pulse.style.setProperty("--pulse-index", String(pulseIndex));
        pulse.textContent = pulseText;
        pulses.append(pulse);
      });
      signal.append(label, pulses);
      return signal;
    }

    if (block.type === "image") {
      const assetUrl = safeLocalAssetUrl(block.src);
      if (!assetUrl) return null;

      const figure = document.createElement("figure");
      figure.className = "documentary-figure";

      const link = document.createElement("a");
      link.className = "documentary-image-link";
      link.href = assetUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", `Abrir imagen completa: ${block.alt}`);

      const image = document.createElement("img");
      image.src = assetUrl;
      image.alt = block.alt || "";
      image.loading = "lazy";
      image.decoding = "async";
      link.append(image);
      figure.append(link);

      if (block.caption) {
        const caption = document.createElement("figcaption");
        const label = document.createElement("span");
        label.textContent = block.caption;
        const action = document.createElement("span");
        action.setAttribute("aria-hidden", "true");
        action.textContent = "Ampliar ↗";
        caption.append(label, action);
        figure.append(caption);
      }

      return figure;
    }

    if (block.type === "dema-document") {
      const logoUrl = safeLocalAssetUrl(block.logo);
      const deniedImageUrl = safeLocalAssetUrl(block.deniedImage);
      const documentPanel = document.createElement("section");
      documentPanel.className = "dema-document";

      const officialLabel = document.createElement("span");
      officialLabel.className = "dema-document-label";
      officialLabel.textContent = "DOCUMENTO OFICIAL // CIRCULACIÓN RESTRINGIDA";

      const documentHeader = document.createElement("header");
      documentHeader.className = "dema-document-header";
      if (logoUrl) {
        const logo = document.createElement("img");
        logo.className = "dema-document-logo";
        logo.src = logoUrl;
        logo.alt = "Sello de la Municipalidad Sagrada de Dema";
        logo.loading = "lazy";
        logo.decoding = "async";
        documentHeader.append(logo);
      }

      const heading = document.createElement("div");
      const agency = document.createElement("span");
      agency.className = "dema-document-agency";
      agency.textContent = block.agency || "MUNICIPALIDAD SAGRADA DE DEMA";
      const title = document.createElement("h2");
      title.textContent = block.title || "CUENTA CANCELADA";
      const department = document.createElement("p");
      department.textContent = block.department || "";
      heading.append(agency, title, department);
      documentHeader.append(heading);

      documentPanel.append(officialLabel, documentHeader);

      if (deniedImageUrl) {
        const deniedFigure = document.createElement("figure");
        deniedFigure.className = "dema-denied-figure";
        const deniedImage = document.createElement("img");
        deniedImage.src = deniedImageUrl;
        deniedImage.alt = "Error 404: acceso denegado por el Consejo de Dema";
        deniedImage.loading = "lazy";
        deniedImage.decoding = "async";
        deniedFigure.append(deniedImage);
        documentPanel.append(deniedFigure);
      }

      const body = document.createElement("div");
      body.className = "dema-document-body";
      (block.paragraphs || []).forEach((paragraphText) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = paragraphText;
        body.append(paragraph);
      });
      documentPanel.append(body);

      const documentFooter = document.createElement("footer");
      documentFooter.className = "dema-document-footer";
      const violation = document.createElement("span");
      violation.textContent = block.violation || "";
      const verdict = document.createElement("strong");
      verdict.textContent = block.verdict || "";
      const signature = document.createElement("small");
      signature.textContent = block.signature || "";
      documentFooter.append(violation, verdict, signature);
      documentPanel.append(documentFooter);

      return documentPanel;
    }

    if (block.type === "diary") {
      const letter = document.createElement("section");
      letter.className = "clancy-letter";
      if (typeof block.id === "string" && /^[a-z0-9-]+$/.test(block.id)) {
        letter.id = block.id;
        letter.tabIndex = -1;
      }
      if (block.title) {
        const title = document.createElement("h2");
        title.textContent = block.title;
        letter.append(title);
      }
      if (block.intro) {
        const meta = document.createElement("div");
        meta.className = "letter-meta";
        meta.textContent = block.intro;
        letter.append(meta);
      }
      (block.paragraphs || []).forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        letter.append(paragraph);
      });
      if (block.sign) {
        const sign = document.createElement("p");
        sign.className = "letter-sign";
        sign.textContent = block.sign;
        letter.append(sign);
      }
      if (block.coda) {
        const coda = document.createElement("p");
        coda.textContent = block.coda;
        letter.append(coda);
      }
      return letter;
    }

    if (block.type === "journal-index") {
      const module = document.createElement("section");
      module.className = "extras-module journal-module";

      const heading = document.createElement("header");
      heading.className = "extras-module-head";
      const label = document.createElement("span");
      label.textContent = "Archivo de Clancy";
      const title = document.createElement("h2");
      title.textContent = block.title || "Clancy's Journal";
      heading.append(label, title);
      if (block.intro) {
        const intro = document.createElement("p");
        intro.textContent = block.intro;
        heading.append(intro);
      }
      module.append(heading);

      const list = document.createElement("div");
      list.className = "journal-entry-list";
      (block.entries || []).forEach((entry, entryIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "journal-entry-link";
        button.dataset.action = "journal-entry";
        button.dataset.chapterId = entry.chapterId || "";
        button.dataset.targetId = entry.targetId || "";
        button.setAttribute(
          "aria-label",
          `${entry.title}, ${entry.code}. Ir a ${entry.chapterLabel}`
        );

        const number = document.createElement("span");
        number.className = "journal-entry-number";
        number.textContent = String(entryIndex + 1).padStart(2, "0");
        const content = document.createElement("span");
        content.className = "journal-entry-content";
        const name = document.createElement("strong");
        name.textContent = entry.title;
        const code = document.createElement("span");
        code.textContent = entry.code;
        content.append(name, code);
        const destination = document.createElement("span");
        destination.className = "journal-entry-destination";
        destination.textContent = `${entry.chapterLabel} →`;
        button.append(number, content, destination);
        list.append(button);
      });
      module.append(list);
      return module;
    }

    return null;
  }

  function effectiveTheme() {
    return document.body.dataset.view === "reader" ? state.settings.theme : "dark";
  }

  function applyEffectiveTheme() {
    document.body.dataset.theme = effectiveTheme();
    updateThemeColor();
  }

  function preparePartBackdrop(part) {
    const backdrop = document.querySelector(`.toc-backdrop[data-part="${part}"]`);
    if (backdrop) backdrop.dataset.loaded = "true";
  }

  function currentRoute() {
    return window.location.hash;
  }

  function writeRoute(route, { replace = false } = {}) {
    const normalized = route.startsWith("#/") ? route : `#/${route.replace(/^#?\/?/, "")}`;
    if (window.location.hash === normalized) {
      lastAppliedRoute = normalized;
      return;
    }
    const url = `${window.location.pathname}${window.location.search}${normalized}`;
    try {
      window.history[replace ? "replaceState" : "pushState"]({ route: normalized }, "", url);
    } catch (error) {
      console.warn("No se pudo actualizar la ruta mediante History API; se usará el hash.", error);
      window.location.hash = normalized;
    }
    lastAppliedRoute = normalized;
  }

  function chapterRoute(chapter, targetId = "") {
    const chapterId = encodeURIComponent(chapter.id || String(state.lastChapter));
    const target = targetId && /^[a-z0-9-]+$/.test(targetId)
      ? `/${encodeURIComponent(targetId)}`
      : "";
    return `${SITE_ROUTES.readerPrefix}${chapterId}${target}`;
  }

  function routeToPart(part) {
    return `${SITE_ROUTES.indexPrefix}${part}`;
  }

  function swapVisibleView(viewId) {
    if (viewId !== "view-reader") {
      delete document.body.dataset.readerChapter;
      delete document.body.dataset.readerPart;
    }

    VIEW_IDS.forEach((id) => {
      const view = document.getElementById(id);
      if (!view) return;
      const isActive = id === viewId;
      view.hidden = !isActive;
      view.classList.toggle("is-active", isActive);
    });

    document.body.dataset.view = viewId.replace("view-", "");
    applyEffectiveTheme();
    closeDrawer(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function show(viewId, { instant = false } = {}) {
    const active = document.querySelector(".view.is-active");
    if (active?.id === viewId) {
      swapVisibleView(viewId);
      return;
    }

    const reduceMotion = motionIsReduced();
    if (!instant && !reduceMotion && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => swapVisibleView(viewId));
      return;
    }
    swapVisibleView(viewId);
  }

  function goToCover(options = {}) {
    updatePartPresentation();
    document.title = "Sahlo Folina — Una historia de Trench";
    show("view-cover", options);
    updateCover();
    if (options.updateRoute !== false) {
      writeRoute(SITE_ROUTES.home, { replace: Boolean(options.replaceRoute) });
    }
  }

  function goToTOC(options = {}) {
    preparePartBackdrop(state.activePart);
    updatePartPresentation();
    renderTOC();
    document.title = `Índice · ${PARTS[state.activePart].indexTitle} — Sahlo Folina`;
    show("view-toc", options);
    if (options.updateRoute !== false) {
      writeRoute(routeToPart(state.activePart), { replace: Boolean(options.replaceRoute) });
    }
  }

  function goToLibrary(options = {}) {
    window.SahloLibrary?.render?.();
    document.title = "Biblioteca — Sahlo Folina";
    show("view-library", options);
    if (options.updateRoute !== false) {
      writeRoute(SITE_ROUTES.library, { replace: Boolean(options.replaceRoute) });
    }
  }

  function goToReader(index, options = {}) {
    if (index < 0 || index >= window.CHAPTERS.length) return;
    const previousChapter = window.CHAPTERS[state.lastChapter];
    const chapter = window.CHAPTERS[index];
    const reduceMotion = motionIsReduced();
    const entersFinalInterlude = chapter.id === "interludio-cuenta-cancelada" && previousChapter?.id === "cap24";
    const entersPartFour = chapter.id === "cap25" && previousChapter?.id === "interludio-cuenta-cancelada";

    if (entersFinalInterlude && !reduceMotion) {
      document.body.classList.remove("part3-terminal-glitch");
      void document.body.offsetWidth;
      document.body.classList.add("part3-terminal-glitch");
      window.setTimeout(() => document.body.classList.remove("part3-terminal-glitch"), 1000);
    }
    if (entersPartFour && !reduceMotion) {
      document.body.classList.remove("part4-glitch-transition");
      void document.body.offsetWidth;
      document.body.classList.add("part4-glitch-transition");
      window.setTimeout(() => document.body.classList.remove("part4-glitch-transition"), 1250);
    }
    const resolvedReaderPart = isNarrativeChapter(chapter) ? chapterPart(chapter) : null;
    document.body.dataset.readerChapter = chapter.id || "";
    document.body.dataset.readerPart = resolvedReaderPart ? String(resolvedReaderPart) : "";
    if (resolvedReaderPart) {
      state.activePart = resolvedReaderPart;
      updatePartPresentation();
    }
    state.lastChapter = index;
    if (isNarrativeChapter(chapter)) {
      state.lastNarrativeChapter = index;
      state.hasStarted = true;
    }
    document.title = `${chapter.number} · ${chapter.title} — Sahlo Folina`;
    renderChapter(index);
    show("view-reader", options);
    saveState();
    if (options.updateRoute !== false) {
      writeRoute(chapterRoute(chapter, options.targetId), {
        replace: Boolean(options.replaceRoute),
      });
    }

    requestAnimationFrame(() => {
      if (options.targetId) {
        const target = document.getElementById(options.targetId);
        if (target && target.closest("#reader")) {
          target.scrollIntoView({
            behavior: motionIsReduced() ? "auto" : "smooth",
            block: "start"
          });
          target.focus({ preventScroll: true });
          updateReadingProgress();
          return;
        }
      }
      const saved = options.resetScroll
        ? 0
        : Math.max(0, Math.min(1, Number(state.chapterProgress[index]) || 0));
      const article = $("#reader");
      const start = article.offsetTop;
      const available = Math.max(0, article.offsetHeight - window.innerHeight * 0.65);
      window.scrollTo({ top: start + available * saved, behavior: "auto" });
      updateReadingProgress();
      article.focus({ preventScroll: true });
    });
  }

  function applyRouteFromLocation({ initial = false } = {}) {
    const rawRoute = currentRoute();
    const route = rawRoute || SITE_ROUTES.home;
    if (!initial && route === lastAppliedRoute) return;
    lastAppliedRoute = route;

    const segments = route
      .replace(/^#\/?/, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    if (!segments.length || segments[0] === "inicio") {
      goToCover({ updateRoute: false, instant: initial });
      if (!rawRoute) writeRoute(SITE_ROUTES.home, { replace: true });
      return;
    }

    if (segments[0] === "biblioteca") {
      goToLibrary({ updateRoute: false, instant: initial });
      return;
    }

    if (segments[0] === "indice") {
      const matchedPart = /^parte-(\d+)$/.exec(segments[1] || "");
      const part = matchedPart ? Number(matchedPart[1]) : state.activePart;
      if (PARTS[part]) state.activePart = part;
      goToTOC({ updateRoute: false, instant: initial });
      return;
    }

    if (segments[0] === "leer" && segments[1]) {
      const chapterIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === segments[1]);
      if (chapterIndex >= 0) {
        const targetId = /^[a-z0-9-]+$/.test(segments[2] || "") ? segments[2] : "";
        goToReader(chapterIndex, {
          targetId,
          updateRoute: false,
          instant: initial,
        });
        return;
      }
    }

    goToCover({ updateRoute: false, instant: initial });
    writeRoute(SITE_ROUTES.home, { replace: true });
  }

  function goToJournalEntry(chapterId, targetId) {
    const chapterIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
    if (chapterIndex === -1 || !/^[a-z0-9-]+$/.test(targetId || "")) return;
    goToReader(chapterIndex, { targetId });
  }

  function overallProgress() {
    if (!state.hasStarted) return 0;
    const narrativeIndexes = narrativeChapterIndexes();
    const completed = new Set(
      state.readChapters.filter((index) => narrativeIndexes.includes(index))
    );
    const current = narrativeIndexes.includes(state.lastNarrativeChapter) && !completed.has(state.lastNarrativeChapter)
      ? Number(state.chapterProgress[state.lastNarrativeChapter]) || 0
      : 0;
    return Math.min(100, Math.round(((completed.size + current) / narrativeIndexes.length) * 100));
  }

  function updatePartPresentation() {
    const part = PARTS[state.activePart] || PARTS[1];
    document.body.dataset.activePart = String(state.activePart);
    updateThemeColor();
    $("#cover-part-label").textContent = part.label;
    $("#cover-context").textContent = part.context;
    $("#cover-lead").textContent = part.coverLead;
    $("#toc-part-label").textContent = part.label;
    $("#toc-part-title").textContent = part.indexTitle;
    $("#toc-quote").textContent = part.quote;
    $("#toc-quote-by").textContent = part.quoteBy;

    $$(".toc-backdrop").forEach((backdrop) => {
      backdrop.classList.toggle("is-active", Number(backdrop.dataset.part) === state.activePart);
    });
    $$("[data-action='switch-part']").forEach((button) => {
      const isActive = Number(button.dataset.part) === state.activePart;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function updateCover() {
    updatePartPresentation();
    const progress = overallProgress();
    $("#stat-progress").textContent = `${progress}%`;
    $("#cover-progress-bar").style.width = `${progress}%`;
    const resumeChapter = window.CHAPTERS[state.lastNarrativeChapter];
    $("#stat-last").textContent = state.hasStarted && resumeChapter
      ? `${resumeChapter.number} · ${resumeChapter.title}`
      : "Aún no comenzaste";
    $("#start-label").textContent = state.hasStarted ? "Continuar leyendo" : "Comenzar a leer";
  }

  function updateSummary() {
    const narrativeIndexes = partChapterIndexes().filter(
      (index) => window.CHAPTERS[index].kind !== "interlude"
    );
    const count = new Set(
      state.readChapters.filter((index) => narrativeIndexes.includes(index))
    ).size;
    $("#toc-progress").textContent = `${count} de ${narrativeIndexes.length} capítulos leídos`;
    $("#toc-progress-bar").style.width = `${Math.round((count / narrativeIndexes.length) * 100)}%`;
  }

  function scheduleReadingProgress() {
    if (progressFrame !== null) return;
    progressFrame = window.requestAnimationFrame(() => {
      progressFrame = null;
      updateReadingProgress();
    });
  }

  function updateReadingProgress() {
    if ($("#view-reader").hidden) return;
    const article = $("#reader");
    const start = article.offsetTop;
    const end = start + article.offsetHeight - window.innerHeight;
    const progress = end <= start ? 1 : Math.max(0, Math.min(1, (window.scrollY - start) / (end - start)));
    const percent = Math.round(progress * 100);
    $("#reader-progress-bar").style.width = `${percent}%`;
    $("#reader-percent").textContent = `${percent}%`;
    if (!isNarrativeChapter(window.CHAPTERS[state.lastChapter])) return;

    state.chapterProgress[state.lastChapter] = progress;

    if (progress > 0.92 && !state.readChapters.includes(state.lastChapter)) {
      state.readChapters.push(state.lastChapter);
    }
    queueSave();
  }

  function updateThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const contextPart = Number(document.body.dataset.readerPart)
      || Number(document.body.dataset.activePart)
      || state.activePart
      || 1;
    const palette = effectiveTheme() === "paper"
      ? { 1: "#e9e5d7", 2: "#e9e5d7", 3: "#ffd9e8", 4: "#e7eef3" }
      : { 1: "#0b0c0a", 2: "#0b0c0a", 3: "#081c30", 4: "#04101d" };
    meta.content = palette[contextPart] || palette[1];
  }

  function applySettings() {
    const body = document.body;
    const settings = state.settings;
    body.dataset.fontsize = settings.fontSize;
    body.dataset.linewidth = settings.lineWidth;
    body.dataset.fontfamily = settings.fontFamily;
    body.dataset.preferredTheme = settings.theme;
    body.dataset.animations = settings.animations;
    applyEffectiveTheme();

    $$("[data-setting]").forEach((group) => {
      const key = group.dataset.setting;
      $$("button[data-value]", group).forEach((button) => {
        const active = button.dataset.value === settings[key];
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
  }

  function disclaimerWasAccepted() {
    try {
      return localStorage.getItem(DISCLAIMER_KEY) === "accepted";
    } catch (error) {
      console.warn("No se pudo consultar la aceptación del disclaimer.", error);
      return false;
    }
  }

  function rememberDisclaimerAcceptance() {
    try {
      localStorage.setItem(DISCLAIMER_KEY, "accepted");
    } catch (error) {
      console.warn("No se pudo guardar la aceptación del disclaimer.", error);
    }
  }

  function openDisclaimer() {
    const dialog = $("#copyright-disclaimer");
    const backdrop = $("#disclaimer-backdrop");
    if (!dialog || !backdrop || !dialog.hidden) return;

    disclaimerLastFocusedElement = document.activeElement;
    dialog.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add("disclaimer-open");
    requestAnimationFrame(() => {
      dialog.classList.add("is-open");
      backdrop.classList.add("is-open");
      $("[data-action='accept-disclaimer']", dialog)?.focus();
    });
  }

  function closeDisclaimer({ openFullText = false } = {}) {
    const dialog = $("#copyright-disclaimer");
    const backdrop = $("#disclaimer-backdrop");
    if (!dialog || !backdrop || dialog.hidden) return;

    rememberDisclaimerAcceptance();
    dialog.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("disclaimer-open");
    dialog.hidden = true;
    backdrop.hidden = true;

    if (openFullText) {
      const disclaimerIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === "disclaimer");
      if (disclaimerIndex >= 0) goToReader(disclaimerIndex, { resetScroll: true });
      return;
    }

    if (disclaimerLastFocusedElement instanceof HTMLElement) {
      disclaimerLastFocusedElement.focus({ preventScroll: true });
    }
  }

  function maybeShowDisclaimer() {
    if (!disclaimerWasAccepted()) openDisclaimer();
  }

  function openDrawer(trigger) {
    const drawer = $("#settings-drawer");
    const overlay = $("#overlay");
    lastFocusedElement = trigger || document.activeElement;
    drawer.hidden = false;
    overlay.hidden = false;
    document.body.classList.add("drawer-open");
    requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      $(".close-btn", drawer).focus();
    });
  }

  function closeDrawer(restoreFocus = true) {
    const drawer = $("#settings-drawer");
    const overlay = $("#overlay");
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("drawer-open");
    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        drawer.hidden = true;
        overlay.hidden = true;
      }
    }, 310);
    if (restoreFocus && lastFocusedElement) lastFocusedElement.focus();
  }

  function handleAction(action, trigger) {
    switch (action) {
      case "accept-disclaimer":
        closeDisclaimer();
        break;
      case "read-disclaimer":
        closeDisclaimer({ openFullText: true });
        break;
      case "start":
        goToReader(
          state.hasStarted
            ? state.lastNarrativeChapter
            : partChapterIndexes(state.activePart)[0] ?? 0
        );
        break;
      case "goto-toc":
      case "back-toc":
        goToTOC();
        break;
      case "goto-library":
        goToLibrary();
        break;
      case "back-cover":
        goToCover();
        break;
      case "prev-chapter":
        goToReader(Number(trigger.dataset.chapterTarget), { resetScroll: true });
        break;
      case "next-chapter":
        if (Number(trigger.dataset.chapterTarget) >= 0) {
          if (!state.readChapters.includes(state.lastChapter)) state.readChapters.push(state.lastChapter);
          goToReader(Number(trigger.dataset.chapterTarget), { resetScroll: true });
        }
        break;
      case "switch-part": {
        const part = Number(trigger.dataset.part);
        if (!PARTS[part]) break;
        state.activePart = part;
        preparePartBackdrop(part);
        updatePartPresentation();
        renderTOC();
        document.title = `Índice · ${PARTS[part].indexTitle} — Sahlo Folina`;
        saveState();
        writeRoute(routeToPart(part), { replace: true });
        break;
      }
      case "journal-entry":
        goToJournalEntry(trigger.dataset.chapterId, trigger.dataset.targetId);
        break;
      case "toggle-settings":
        $("#settings-drawer").hidden ? openDrawer(trigger) : closeDrawer();
        break;
      case "reset-progress":
        if (window.confirm("¿Quieres borrar todo tu progreso de lectura?")) {
          state.lastChapter = 0;
          state.lastNarrativeChapter = 0;
          state.activePart = 1;
          state.hasStarted = false;
          state.readChapters = [];
          state.chapterProgress = {};
          saveState();
          renderTOC();
          updateCover();
          closeDrawer();
        }
        break;
    }
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (!trigger) return;
      if (trigger.tagName === "A") event.preventDefault();
      handleAction(trigger.dataset.action, trigger);
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-setting] button[data-value]");
      if (!button) return;
      const key = button.parentElement.dataset.setting;
      if (!(key in state.settings)) return;
      state.settings[key] = button.dataset.value;
      applySettings();
      saveState();
      requestAnimationFrame(updateReadingProgress);
    });

    $("#overlay").addEventListener("click", () => closeDrawer());
    document.addEventListener("keydown", (event) => {
      const disclaimer = $("#copyright-disclaimer");
      if (disclaimer && !disclaimer.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          $("[data-action='accept-disclaimer']", disclaimer)?.focus();
          return;
        }
        if (event.key === "Tab") {
          const focusable = $$('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])', disclaimer)
            .filter((element) => !element.hidden);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (event.key === "Escape" && !$("#settings-drawer").hidden) closeDrawer();
    });
    window.addEventListener("scroll", scheduleReadingProgress, { passive: true });
    window.addEventListener("resize", scheduleReadingProgress, { passive: true });
    window.addEventListener("popstate", () => applyRouteFromLocation());
    window.addEventListener("hashchange", () => applyRouteFromLocation());
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    const secureContext = location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    if (!secureContext) return;
    const register = () => navigator.serviceWorker
      .register("./sw.js?v=20260729-performance-r1")
      .catch((error) => console.warn("No se pudo registrar la caché offline.", error));
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(register, { timeout: 3000 });
    } else {
      window.setTimeout(register, 1200);
    }
  }

  function init() {
    if (!Array.isArray(window.CHAPTERS) || !window.CHAPTERS.length) {
      console.error("No se encontraron capítulos.");
      return;
    }
    loadState();
    applySettings();
    updatePartPresentation();
    renderTOC();
    updateCover();
    bindEvents();
    applyRouteFromLocation({ initial: true });
    requestAnimationFrame(maybeShowDisclaimer);
    window.addEventListener("load", registerServiceWorker, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
