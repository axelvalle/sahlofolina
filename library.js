(function () {
  "use strict";

  const editions = Object.freeze([
    {
      id: "partes-1-2",
      collection: "Edición I–II",
      title: "Sahlo Folina — Partes I y II",
      description: "La ciudad sin horizonte · El color que no pueden ver",
      cover: "./assets/library/partes-1-2-cover.webp",
      files: Object.freeze([
        { format: "DOCX", size: "8.5 MB", file: "./downloads/Sahlo-Folina-Partes-I-y-II.docx" },
        { format: "PDF", size: "2.0 MB", file: "./downloads/Sahlo-Folina-Partes-I-y-II.pdf" },
      ]),
    },
    {
      id: "parte-3",
      collection: "Edición III",
      title: "La ciudad aprende a sonreír",
      description: "Scaled and Icy · Livestream Experience · Saturday",
      cover: "./assets/library/parte-3-cover.webp",
      files: Object.freeze([
        { format: "DOCX", size: "7.6 MB", file: "./downloads/Sahlo-Folina-Parte-III.docx?v=20260729-r2" },
        { format: "PDF", size: "2.2 MB", file: "./downloads/Sahlo-Folina-Parte-III.pdf?v=20260729-r2" },
      ]),
    },
    {
      id: "parte-4",
      collection: "Edición IV",
      title: "Los que se quedaron",
      description: "No Chances · La torre 9-E · East Is Up Again",
      cover: "./assets/library/parte-4-cover.webp",
      files: Object.freeze([
        { format: "DOCX", size: "2.3 MB", file: "./downloads/Sahlo-Folina-Parte-IV.docx?v=20260729-final" },
        { format: "PDF", size: "1.1 MB", file: "./downloads/Sahlo-Folina-Parte-IV.pdf?v=20260729-final" },
      ]),
    },
  ]);

  function createDownloadButton(edition, downloadable, index) {
    const download = document.createElement("a");
    download.className = index === 0 ? "download-button" : "download-button is-secondary";
    download.href = downloadable.file;
    download.download = "";
    download.setAttribute(
      "aria-label",
      `Descargar ${edition.title} en formato ${downloadable.format}`,
    );

    const information = document.createElement("span");
    information.className = "download-format";

    const format = document.createElement("strong");
    format.textContent = downloadable.format;

    const size = document.createElement("small");
    size.textContent = downloadable.size;

    const arrow = document.createElement("span");
    arrow.className = "download-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↓";

    information.append(format, size);
    download.append(information, arrow);
    return download;
  }

  function createEditionCard(edition) {
    const article = document.createElement("article");
    article.className = "library-volume";
    article.dataset.volume = edition.id;

    const stage = document.createElement("div");
    stage.className = "book-stage";
    stage.setAttribute("aria-hidden", "true");

    const book = document.createElement("div");
    book.className = "book";

    const image = document.createElement("img");
    image.className = "book-cover";
    image.src = edition.cover;
    image.alt = "";
    image.loading = "eager";
    image.decoding = "async";

    const shine = document.createElement("span");
    shine.className = "book-shine";
    book.append(image, shine);
    stage.append(book);

    const information = document.createElement("div");
    information.className = "volume-info";

    const collection = document.createElement("span");
    collection.className = "volume-series";
    collection.textContent = edition.collection;

    const title = document.createElement("h3");
    title.textContent = edition.title;

    const description = document.createElement("p");
    description.textContent = edition.description;

    const metadata = document.createElement("div");
    metadata.className = "volume-meta";

    const type = document.createElement("span");
    type.textContent = "Edición digital";

    const formats = document.createElement("span");
    formats.textContent = edition.files.map((item) => item.format).join(" + ");
    metadata.append(type, formats);

    const actions = document.createElement("div");
    actions.className = "volume-actions";
    edition.files.forEach((item, index) => actions.append(createDownloadButton(edition, item, index)));

    information.append(collection, title, description, metadata, actions);
    article.append(stage, information);
    return article;
  }

  function renderLibrary() {
    const shelf = document.getElementById("bookshelf");
    const counter = document.getElementById("library-count");
    if (!shelf || !counter) return;

    const fragment = document.createDocumentFragment();
    editions.forEach((edition) => fragment.append(createEditionCard(edition)));
    shelf.replaceChildren(fragment);

    counter.textContent = `${editions.length} ediciones disponibles`;
  }

  window.SahloLibrary = Object.freeze({ editions, render: renderLibrary });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLibrary, { once: true });
  } else {
    renderLibrary();
  }
})();
