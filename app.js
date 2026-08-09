(function () {
  "use strict";

  const STORAGE_KEY = "sahlo_folina_state_v2";
  const LEGACY_KEY = "sahlo_folina_state_v1";
  const DISCLAIMER_KEY = "sahlo_folina_disclaimer_ack_v1";
  const NATIVE_STORAGE_KEY = "sahlo_folina_reader_state";
  const ALLOWED_SETTINGS = Object.freeze({
    fontSize: new Set(["sm", "md", "lg", "xl"]),
    lineWidth: new Set(["narrow", "md", "wide"]),
    fontFamily: new Set(["serif", "sans", "mono"]),
    theme: new Set(["dark", "paper"]),
    animations: new Set(["on", "off"]),
    voices: new Set(["show", "hide"])
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
      context: "Consecuencias de Saturday · Dema sin Clancy",
      coverLead: "Una historia sobre quienes sostienen la memoria cuando la persona que los unía desaparece y la ciudad intenta convertir su ausencia en una conclusión.",
      quote: "“Recordar que alguna vez elegiste algo.”",
      quoteBy: "— Torchbearer"
    },
    5: {
      label: "Parte V",
      indexTitle: "La brecha",
      context: "The Outside · Overcompensate · Navigating · Paladin Strait",
      coverLead: "Una historia sobre volver como presencia, decidir quién está regresando y atravesar la brecha que Dema no pudo cerrar.",
      quote: "“Una voz puede cruzar una muralla antes que un cuerpo.”",
      quoteBy: "— Epígrafe editorial de La brecha"
    },
    6: {
      label: "Parte VI",
      indexTitle: "Siempre",
      context: "The Contract · I Am Torchbearer · City Walls",
      coverLead: "Una historia sobre el precio de abrir la torre, rechazar otra corona y aprender que la libertad también necesita límites para no repetirse como control.",
      quote: "“Lo peligroso es aprender a describir el control como cuidado.”",
      quoteBy: "— Prólogo: Intenciones"
    }
  });
  const PART5_ARCS = Object.freeze({
    1: Object.freeze({
      label: "Arco I",
      title: "El regreso imposible",
      verb: "Volver",
      range: "Capítulos 32–34",
      summary: "Clancy regresa primero como presencia, mensaje y símbolo antes de volver verdaderamente como hombre."
    }),
    2: Object.freeze({
      label: "Arco II",
      title: "El peso de Clancy",
      verb: "Decidir",
      range: "Capítulos 35–38",
      summary: "Antes de abrir una brecha, Clancy debe decidir qué significa cargar con su nombre."
    }),
    3: Object.freeze({
      label: "Arco III",
      title: "La brecha",
      verb: "Atravesar",
      range: "Capítulos 39–41",
      summary: "La resistencia abre el camino colectivamente, pero Clancy debe atravesarlo solo."
    })
  });
  const PART5_SECTIONS = Object.freeze({
    "-1": Object.freeze({
      label: "Prólogo",
      title: "The Outside — El otro lado",
      verb: "Sobrevivir",
      range: "Prólogo",
      context: "Voldsøy · The Outside · Seizing",
      lead: "Sobrevivir no basta cuando el regreso comienza dentro de otro cuerpo.",
      summary: "Clancy sobrevive al naufragio, llega a Voldsøy y descubre el mecanismo que permite que su voz alcance Dema."
    }),
    0: Object.freeze({
      label: "Parte V",
      title: "La brecha",
      verb: "Explorar",
      range: "Prólogo · Tres arcos · Capítulos 32–41",
      context: "The Outside · Overcompensate · Navigating · Paladin Strait",
      lead: "Volver. Decidir quién está regresando. Atravesar lo que estaba esperando.",
      summary: "Una parte extensa organizada como un mapa de lectura: prólogo independiente y tres arcos con identidades visuales propias."
    }),
    1: Object.freeze({
      ...PART5_ARCS[1],
      context: "I Am Clancy · Overcompensate · Navigating",
      lead: "Regresar primero como señal, antes que como hombre."
    }),
    2: Object.freeze({
      ...PART5_ARCS[2],
      context: "El hijo pródigo · Paladin Strait I–II",
      lead: "Cargar el nombre sin permitir que se convierta en otra corona."
    }),
    3: Object.freeze({
      ...PART5_ARCS[3],
      context: "Paladin Strait III–V · La torre",
      lead: "La brecha se abre entre todos; la torre se atraviesa solo."
    })
  });
  const ACHIEVEMENTS = Object.freeze([
    { id: "first-record", code: "01", title: "Primera huella", description: "Completa tu primer capítulo.", test: ({ read }) => read.size >= 1 },
    { id: "dema-record", code: "02", title: "La ciudad sin horizonte", description: "Completa la Parte I.", test: ({ completePart }) => completePart(1) },
    { id: "trench-record", code: "03", title: "El color que no pueden ver", description: "Completa la Parte II.", test: ({ completePart }) => completePart(2) },
    { id: "sai-record", code: "04", title: "La ciudad aprende a sonreír", description: "Completa la Parte III.", test: ({ completePart }) => completePart(3) },
    { id: "those-left", code: "05", title: "Los que se quedaron", description: "Completa la Parte IV.", test: ({ completePart }) => completePart(4) },
    { id: "outside", code: "06", title: "El otro lado", description: "Sobrevive al prólogo de la Parte V.", test: ({ readId }) => readId("prologo-parte-5") },
    { id: "return", code: "07", title: "Volver", description: "Completa el Arco I de la Parte V.", test: ({ completeSection }) => completeSection(1) },
    { id: "name-weight", code: "08", title: "Decidir", description: "Completa el Arco II de la Parte V.", test: ({ completeSection }) => completeSection(2) },
    { id: "breach", code: "09", title: "Atravesar", description: "Completa el Arco III de la Parte V.", test: ({ completeSection }) => completeSection(3) },
    { id: "contract", code: "10", title: "El contrato", description: "Abre el expediente de la Parte VI.", test: ({ readId }) => readId("prologo-parte-6") },
    { id: "always", code: "11", title: "Siempre", description: "Completa la Parte VI.", test: ({ completePart }) => completePart(6) },
    { id: "full-archive", code: "12", title: "Archivo completo", description: "Completa toda la historia.", test: ({ completeStory }) => completeStory }
  ]);
  const ARCHIVE_TIERS = Object.freeze([
    { id: "journal", title: "Diario de Clancy", requirement: "Las entradas aparecen al completar sus capítulos." },
    { id: "parts-1-2", title: "Mapas y cartas de Dema y Trench", part: 2, requirement: "Completa la Parte II." },
    { id: "part-3", title: "Archivo audiovisual de Scaled and Icy", part: 3, requirement: "Completa la Parte III." },
    { id: "part-5", title: "Cartas y propaganda de La brecha", part: 5, requirement: "Completa la Parte V." },
    { id: "part-6", title: "Expedientes de Siempre", part: 6, requirement: "Completa la Parte VI." }
  ]);
  const SITE_ROUTES = window.SAHLO_SITE_ROUTES || Object.freeze({
    home: "/inicio",
    library: "/biblioteca",
    about: "/sobre",
    indexPrefix: "/indice/parte-",
    readerPrefix: "/leer/",
  });
  const state = {
    lastChapter: 0,
    lastNarrativeChapter: 0,
    activePart: 1,
    activeArc: 0,
    hasStarted: false,
    readChapters: [],
    chapterProgress: {},
    bookmarks: [],
    savedQuotes: [],
    progressionMode: "guided",
    freeReadingWarningDismissed: false,
    achievementSeen: [],
    settings: {
      fontSize: "md",
      lineWidth: "md",
      fontFamily: "serif",
      theme: "dark",
      animations: "on",
      voices: "show"
    }
  };

  const VIEW_IDS = Object.freeze(["view-cover", "view-toc", "view-library", "view-about", "view-reader"]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let lastFocusedElement = null;
  let accountProgressionMounted = false;
  let accountGuestTab = "auth";
  let accountUserTab = "overview";
  let disclaimerLastFocusedElement = null;
  let journalViewerLastFocusedElement = null;
  let journalViewerIndex = 0;
  let journalViewerTouchStartX = null;
  let saveTimer = null;
  let lastAppliedRoute = "";
  let progressFrame = null;
  const readingMinutesCache = new Map();
  const indexBackdropAssets = Object.freeze({
    1: "./assets/indice-parte-1.webp",
    2: "./assets/indice-parte-2.webp",
    3: "./assets/indice-parte-3.webp",
    4: "./assets/parte-4/habitacion-azul.webp",
    5: "./assets/parte-5/parte-v-mapa.webp",
    6: "./assets/parte-6/the-contract-index.webp"
  });
  const indexBackdropPreloads = new Map();
  let chapterIndexCache = null;
  let lastTocRenderKey = "";

  const AVATARS = Object.freeze([
    { key: "clancy-masked", label: "Clancy enmascarado", src: "./assets/avatars/clancy-masked.webp" },
    { key: "clancy", label: "Clancy", src: "./assets/avatars/clancy.webp" },
    { key: "mara-bandito", label: "Mara Bandito", src: "./assets/avatars/mara-bandito.webp" },
    { key: "ned", label: "Ned", src: "./assets/avatars/ned.webp" },
    { key: "nico", label: "Nico", src: "./assets/avatars/nico.webp" },
    { key: "torchbearer", label: "Torchbearer", src: "./assets/avatars/torchbearer.webp" },
    { key: "mara", label: "Mara", src: "./assets/avatars/mara.webp" }
  ]);
  const AUTH_STORAGE_KEY = "sahlo_folina_auth_session_v1";
  const auth = {
    session: null,
    user: null,
    mode: "signin",
    selectedAvatar: "clancy",
    hydrating: false,
    syncing: false,
    configured: Boolean(window.SAHLO_SUPABASE_CONFIG?.url && window.SAHLO_SUPABASE_CONFIG?.anonKey)
  };

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
      if (Number.isInteger(parsed.activeArc) && PART5_SECTIONS[String(parsed.activeArc)]) {
        state.activeArc = parsed.activeArc;
      }
      const requestedHasStarted = current ? Boolean(parsed.hasStarted) : true;
      if (Array.isArray(parsed.readChapters)) {
        state.readChapters = [...new Set(parsed.readChapters.filter(
          (index) => Number.isInteger(index) && index >= 0 && index < window.CHAPTERS.length
        ))];
      }
      if (Array.isArray(parsed.bookmarks)) {
        state.bookmarks = [...new Set(parsed.bookmarks.filter((value) => typeof value === "string" && value.length < 180))];
      }
      if (Array.isArray(parsed.savedQuotes)) {
        state.savedQuotes = parsed.savedQuotes
          .filter((quote) => quote && typeof quote === "object" && typeof quote.text === "string")
          .slice(0, 200)
          .map((quote) => ({
            text: quote.text.slice(0, 500),
            chapterId: typeof quote.chapterId === "string" ? quote.chapterId.slice(0, 120) : "",
            savedAt: typeof quote.savedAt === "string" ? quote.savedAt : ""
          }));
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
      if (["guided", "free"].includes(parsed.progressionMode)) {
        state.progressionMode = parsed.progressionMode;
      }
      state.freeReadingWarningDismissed = Boolean(parsed.freeReadingWarningDismissed);
      if (Array.isArray(parsed.achievementSeen)) {
        state.achievementSeen = [...new Set(parsed.achievementSeen.filter(
          (id) => ACHIEVEMENTS.some((achievement) => achievement.id === id)
        ))];
      }
    } catch (error) {
      console.warn("No se pudo cargar el progreso de lectura.", error);
    }
  }

  function saveState() {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
      const preferences = window.Capacitor?.Plugins?.Preferences;
      if (preferences) {
        preferences.set({ key: NATIVE_STORAGE_KEY, value: serialized }).catch((error) => {
          console.warn("No se pudo respaldar el progreso en Android.", error);
        });
      }
      if (auth.user && !auth.hydrating) queueCloudSync();
    } catch (error) {
      console.warn("No se pudo guardar el progreso de lectura.", error);
    }
  }

  function authMessage(error, fallback = "No se pudo completar la operación.") {
    const message = error?.message || error?.error_description || fallback;
    const normalized = String(message).toLowerCase();
    if (normalized.includes("invalid login credentials")) return "El correo o la contraseña no son correctos.";
    if (normalized.includes("user already registered")) return "Ese correo ya tiene una cuenta. Prueba entrar.";
    if (normalized.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (normalized.includes("email not confirmed")) return "Revisa tu correo y confirma la cuenta antes de entrar.";
    return String(message || fallback);
  }

  function supabaseHeaders(accessToken, extra = {}) {
    const headers = { apikey: window.SAHLO_SUPABASE_CONFIG.anonKey, ...extra };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }

  async function supabaseFetch(path, options = {}, accessToken = "") {
    const response = await fetch(`${window.SAHLO_SUPABASE_CONFIG.url.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: supabaseHeaders(accessToken, { "Content-Type": "application/json", ...(options.headers || {}) })
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new Error(authMessage(data, `Supabase respondió con ${response.status}.`));
    return data;
  }

  function persistSession() {
    try {
      if (auth.session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth.session));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn("No se pudo guardar la sesión.", error);
    }
  }

  function readPersistedSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null"); } catch { return null; }
  }

  function mergeReaderState(remote) {
    if (!remote || typeof remote !== "object") return;
    const remoteRead = Array.isArray(remote.readChapters) ? remote.readChapters : [];
    state.readChapters = [...new Set([...state.readChapters, ...remoteRead])]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < window.CHAPTERS.length);
    const remoteProgress = remote.chapterProgress && typeof remote.chapterProgress === "object" ? remote.chapterProgress : {};
    Object.entries(remoteProgress).forEach(([index, value]) => {
      const number = Number(value);
      if (Number.isFinite(number)) state.chapterProgress[index] = Math.max(Number(state.chapterProgress[index] || 0), number);
    });
    ["bookmarks", "savedQuotes", "achievementSeen"].forEach((key) => {
      if (!Array.isArray(remote[key])) return;
      const merged = [...(state[key] || []), ...remote[key]];
      state[key] = key === "savedQuotes" ? merged.slice(-200) : [...new Set(merged)];
    });
    ["lastChapter", "lastNarrativeChapter"].forEach((key) => {
      if (Number.isInteger(remote[key])) state[key] = Math.max(state[key], remote[key]);
    });
    if (remote.settings && typeof remote.settings === "object") {
      Object.entries(ALLOWED_SETTINGS).forEach(([key, allowed]) => {
        if (allowed.has(remote.settings[key])) state.settings[key] = remote.settings[key];
      });
    }
    if (["guided", "free"].includes(remote.progressionMode)) state.progressionMode = remote.progressionMode;
    state.hasStarted = state.hasStarted || Boolean(remote.hasStarted);
  }

  async function loadCloudProfile() {
    if (!auth.session?.access_token || !auth.user) return;
    const rows = await supabaseFetch(`/rest/v1/reader_profiles?select=display_name,avatar_key,reader_state&user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`, {}, auth.session.access_token);
    const profile = Array.isArray(rows) ? rows[0] : null;
    if (profile?.reader_state) mergeReaderState(profile.reader_state);
    auth.selectedAvatar = AVATARS.some((avatar) => avatar.key === profile?.avatar_key) ? profile.avatar_key : "clancy";
    $("#account-display-name").value = profile?.display_name || "";
    saveState();
  }

  async function queueCloudSync() {
    if (!auth.user || !auth.session?.access_token || auth.syncing) return;
    clearTimeout(auth.syncTimer);
    auth.syncTimer = setTimeout(syncStateToCloud, 700);
  }

  async function syncStateToCloud() {
    if (!auth.user || !auth.session?.access_token || auth.syncing) return;
    auth.syncing = true;
    setAccountStatus("Sincronizando tu recorrido…");
    try {
      await supabaseFetch("/rest/v1/reader_profiles?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: auth.user.id,
          display_name: $("#account-display-name")?.value?.trim() || "",
          avatar_key: auth.selectedAvatar,
          reader_state: state
        })
      }, auth.session.access_token);
      setAccountStatus("Sincronizado ahora");
    } catch (error) {
      setAccountStatus(authMessage(error, "No se pudo sincronizar. Tu copia local sigue guardada."), true);
    } finally {
      auth.syncing = false;
    }
  }

  function setAccountStatus(message, isError = false) {
    const targets = [$("#account-auth-status"), $("#account-user-status"), $("#account-sync-status")].filter(Boolean);
    targets.forEach((target) => {
      target.textContent = message;
      target.classList.toggle("is-error", isError);
    });
  }

  function renderAvatarOptions() {
    const container = $("#avatar-options");
    if (!container) return;
    container.replaceChildren(...AVATARS.map((avatar) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `avatar-option${auth.selectedAvatar === avatar.key ? " is-selected" : ""}`;
      button.dataset.avatarKey = avatar.key;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(auth.selectedAvatar === avatar.key));
      button.title = avatar.label;
      const image = document.createElement("img");
      image.src = avatar.src;
      image.alt = avatar.label;
      const label = document.createElement("span");
      label.textContent = avatar.label;
      button.append(image, label);
      return button;
    }));
    const selected = AVATARS.find((avatar) => avatar.key === auth.selectedAvatar) || AVATARS[1];
    const preview = $("#account-avatar-preview");
    if (preview) { preview.src = selected.src; preview.alt = selected.label; }
  }

  function renderAccountState() {
    const guest = $("#account-guest-panel");
    const userPanel = $("#account-user-panel");
    if (!guest || !userPanel) return;
    guest.hidden = Boolean(auth.user);
    userPanel.hidden = !auth.user;
    const submitButton = $("[data-auth-submit]");
    const signupMode = auth.mode === "signup";
    const authForm = $("#account-auth-form");
    const confirmField = $("#account-confirm-password-field");
    const confirmInput = $("#account-confirm-password");
    if (submitButton) submitButton.textContent = signupMode ? "Crear cuenta" : "Entrar";
    authForm?.classList.toggle("is-signup", signupMode);
    if (confirmField) {
      confirmField.classList.toggle("is-visible", signupMode);
      confirmField.setAttribute("aria-hidden", String(!signupMode));
    }
    if (confirmInput) {
      confirmInput.disabled = !signupMode;
      confirmInput.required = signupMode;
      if (!signupMode) confirmInput.value = "";
    }
    const modeButton = $("[data-action='toggle-auth-mode']");
    if (modeButton) modeButton.textContent = signupMode ? "Ya tengo una cuenta · Entrar" : "Primera vez · Crear cuenta";
    $$("[data-auth-mode]").forEach((tab) => {
      const selected = tab.dataset.authMode === auth.mode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const modeKicker = $("#account-auth-mode-kicker");
    const modeTitle = $("#account-auth-mode-title");
    const modeCopy = $("#account-auth-mode-copy");
    if (modeKicker) modeKicker.textContent = signupMode ? "Nuevo registro" : "Acceso del lector";
    if (modeTitle) modeTitle.textContent = signupMode ? "Crear cuenta de lector" : "Entrar a mi cuenta";
    if (modeCopy) modeCopy.textContent = signupMode
      ? "Guarda tu recorrido y llévalo contigo entre el sitio y la app."
      : "Continúa tu recorrido y sincroniza lo que ya has leído.";
    if (auth.user) {
      $("#account-user-email").textContent = auth.user.email || "Lector";
      $("#account-user-alias").textContent = $("#account-display-name")?.value?.trim() || "Lector";
    }
    const progressState = $("#account-progress-state");
    if (progressState) progressState.textContent = auth.user
      ? "Cuenta conectada · recorrido sincronizado"
      : "Invitado · guardado en este dispositivo";
    const guestCopy = $("#account-guest-copy");
    if (guestCopy) guestCopy.textContent = auth.user
      ? ""
      : "Tu recorrido ya está guardado en este dispositivo. Entra o crea una cuenta para sincronizarlo entre el sitio y la app.";
    renderAccountUserTab();
    renderAccountGuestTab();
    renderAccountTriggers();
    updateAccountProgressSummary();
    renderAvatarOptions();
  }

  function renderAccountGuestTab() {
    const inner = $(".account-dialog-inner");
    const dialog = $("#account-dialog");
    const guestTabs = $("#account-guest-tabs");
    const authForm = $("#account-auth-form");
    const mount = $("#account-progress-mount");
    const stack = $("#account-guest-view-stack");
    if (!inner || !dialog || !guestTabs || !authForm || !mount || !stack) return;
    const isGuest = !auth.user;
    const showProgress = !isGuest || accountGuestTab === "progress";
    const showAuth = isGuest && !showProgress;
    inner.classList.toggle("is-authenticated", Boolean(auth.user));
    inner.classList.toggle("is-guest-auth", isGuest && !showProgress);
    inner.classList.toggle("is-guest-progress", isGuest && showProgress);
    stack.classList.toggle("is-auth-active", showAuth);
    stack.classList.toggle("is-progress-active", showProgress);
    authForm.classList.toggle("is-view-active", showAuth);
    authForm.classList.toggle("is-view-inactive", !showAuth);
    mount.classList.toggle("is-view-active", showProgress);
    mount.classList.toggle("is-view-inactive", !showProgress);
    authForm.setAttribute("aria-hidden", String(!showAuth));
    mount.setAttribute("aria-hidden", String(!showProgress));
    authForm.inert = !showAuth;
    mount.inert = !showProgress;
    dialog.classList.toggle("is-guest-auth-view", isGuest && !showProgress);
    dialog.classList.toggle("is-guest-progress-view", isGuest && showProgress);
    dialog.classList.toggle("is-authenticated-view", Boolean(auth.user));
    guestTabs.hidden = !isGuest;
    $$("[data-account-tab]", guestTabs).forEach((tab) => {
      const selected = isGuest && tab.dataset.accountTab === accountGuestTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  function renderAccountUserTab() {
    const tabs = $("#account-user-tabs");
    const settings = $("#account-user-settings");
    if (!tabs || !settings) return;
    const showSettings = Boolean(auth.user) && accountUserTab === "settings";
    settings.hidden = !showSettings;
    $$(`[data-account-user-tab]`, tabs).forEach((tab) => {
      const selected = Boolean(auth.user) && tab.dataset.accountUserTab === accountUserTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  function switchAccountUserTab(tab) {
    if (!auth.user || !["overview", "settings"].includes(tab)) return;
    accountUserTab = tab;
    renderAccountUserTab();
    if (tab === "settings") $("#account-display-name")?.focus();
  }

  function switchAccountTab(tab) {
    if (!["auth", "progress"].includes(tab) || auth.user) return;
    accountGuestTab = tab;
    renderAccountGuestTab();
    if (tab === "progress") {
      renderProgressionPanel();
      $("#progression-panel")?.scrollIntoView({ behavior: motionIsReduced() ? "auto" : "smooth", block: "nearest" });
    } else {
      $("#account-email")?.focus();
    }
  }

  function setAuthMode(mode) {
    if (!["signin", "signup"].includes(mode) || auth.user) return;
    auth.mode = mode;
    renderAccountState();
    setAccountStatus("");
    if (mode === "signup") $("#account-confirm-password")?.focus();
    else $("#account-email")?.focus();
  }

  function renderAccountTriggers() {
    const selected = AVATARS.find((avatar) => avatar.key === auth.selectedAvatar) || AVATARS[1];
    const alias = $("#account-display-name")?.value?.trim() || "Lector";
    $$('[data-action="open-account"]').forEach((button) => {
      const label = $("[data-account-label]", button);
      if (label) label.textContent = auth.user ? alias : "Cuenta";
      let avatar = $("[data-account-avatar]", button);
      if (!auth.user) {
        avatar?.remove();
        button.classList.remove("is-authenticated");
        button.setAttribute("aria-label", "Abrir cuenta");
        return;
      }
      if (!avatar) {
        avatar = document.createElement("img");
        avatar.dataset.accountAvatar = "";
        avatar.className = "account-trigger-avatar";
        button.prepend(avatar);
      }
      avatar.src = selected.src;
      avatar.alt = selected.label;
      button.classList.add("is-authenticated");
      button.setAttribute("aria-label", `Abrir mi cuenta de ${alias}`);
    });
  }

  function updateAccountProgressSummary() {
    const completed = narrativeChapterIndexes().filter((index) => state.readChapters.includes(index)).length;
    const progress = $("#account-progress-percent");
    const readCount = $("#account-read-count");
    const achievementCount = $("#account-achievement-count");
    if (progress) progress.textContent = `${overallProgress()}%`;
    if (readCount) readCount.textContent = `${completed} / ${narrativeChapterIndexes().length}`;
    if (achievementCount) achievementCount.textContent = `${unlockedAchievements().length} / ${ACHIEVEMENTS.length}`;
  }

  function mountProgressionPanelIntoAccount() {
    const panel = $("#progression-panel");
    const mount = $("#account-progress-mount");
    if (!panel || !mount) return;
    if (panel.parentElement !== mount) mount.append(panel);
    panel.hidden = false;
    accountProgressionMounted = true;
    renderProgressionPanel();
    renderAccountGuestTab();
  }

  function restoreProgressionPanel() {
    const panel = $("#progression-panel");
    const anchor = $("#progression-panel-anchor");
    if (!panel || !anchor || !accountProgressionMounted) return;
    anchor.after(panel);
    panel.hidden = true;
    accountProgressionMounted = false;
    accountGuestTab = "auth";
    renderAccountGuestTab();
  }

  function openAccountDialog(trigger) {
    const dialog = $("#account-dialog");
    const backdrop = $("#account-backdrop");
    if (!dialog || !backdrop) return;
    lastFocusedElement = trigger || document.activeElement;
    renderAccountState();
    mountProgressionPanelIntoAccount();
    dialog.hidden = false;
    backdrop.hidden = false;
    dialog.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.body.classList.add("account-open");
    $(auth.user ? "#account-user-tabs [aria-selected='true']" : "#account-email")?.focus();
  }

  function closeAccountDialog() {
    const dialog = $("#account-dialog");
    const backdrop = $("#account-backdrop");
    if (!dialog || !backdrop) return;
    restoreProgressionPanel();
    dialog.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("account-open");
    window.setTimeout(() => { dialog.hidden = true; backdrop.hidden = true; }, 220);
    lastFocusedElement?.focus?.();
  }

  async function submitAuthForm(event) {
    event.preventDefault();
    if (!auth.configured) { setAccountStatus("Falta configurar Supabase: añade URL y clave pública en supabase-config.js.", true); return; }
    const email = $("#account-email").value.trim();
    const password = $("#account-password").value;
    const confirmation = $("#account-confirm-password")?.value || "";
    if (!email || password.length < 6) { setAccountStatus("Escribe un correo válido y una contraseña de al menos 6 caracteres.", true); return; }
    if (auth.mode === "signup" && password !== confirmation) { setAccountStatus("Las contraseñas no coinciden.", true); return; }
    const button = $("[data-auth-submit]");
    button.disabled = true;
    setAccountStatus(auth.mode === "signup" ? "Creando tu cuenta…" : "Entrando…");
    try {
      const data = await supabaseFetch(auth.mode === "signup" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password", {
        method: "POST", body: JSON.stringify({ email, password })
      });
      if (auth.mode === "signup" && !data.access_token) {
        setAccountStatus("Cuenta creada. Revisa tu correo para confirmarla y después entra.");
      } else {
        auth.session = data;
        auth.user = data.user || null;
        persistSession();
        renderAccountState();
        await loadCloudProfile();
        renderAccountState();
        setAccountStatus("Cuenta conectada y recorrido sincronizado.");
        updateCover();
        renderTOC();
      }
    } catch (error) {
      setAccountStatus(authMessage(error), true);
    } finally { button.disabled = false; }
  }

  async function initializeAuth() {
    renderAccountState();
    if (!auth.configured) return;
    const persisted = readPersistedSession();
    if (!persisted?.access_token) return;
    try {
      auth.session = persisted;
      auth.user = await supabaseFetch("/auth/v1/user", {}, persisted.access_token);
      renderAccountState();
      await loadCloudProfile();
      renderAccountState();
    } catch {
      auth.session = null;
      auth.user = null;
      persistSession();
      renderAccountState();
    }
  }

  async function signOut() {
    try { if (auth.session?.access_token) await supabaseFetch("/auth/v1/logout", { method: "POST" }, auth.session.access_token); } catch { /* sesión ya caducada */ }
    auth.session = null;
    auth.user = null;
    accountUserTab = "overview";
    persistSession();
    renderAccountState();
    setAccountStatus("Sesión cerrada. Tu progreso local permanece en este dispositivo.");
    updateCover();
  }

  async function hydrateNativeState() {
    const preferences = window.Capacitor?.Plugins?.Preferences;
    if (!preferences) return;
    try {
      const { value } = await preferences.get({ key: NATIVE_STORAGE_KEY });
      if (value) localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      console.warn("No se pudo recuperar el progreso guardado en Android.", error);
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

  function getChapterIndexCache() {
    if (chapterIndexCache) return chapterIndexCache;

    const narrative = [];
    const byPart = new Map();
    window.CHAPTERS.forEach((chapter, index) => {
      if (!isNarrativeChapter(chapter)) return;
      narrative.push(index);
      const part = chapterPart(chapter);
      if (!byPart.has(part)) byPart.set(part, []);
      byPart.get(part).push(index);
    });
    chapterIndexCache = { narrative, byPart };
    return chapterIndexCache;
  }

  function narrativeChapterIndexes() {
    return getChapterIndexCache().narrative;
  }

  function partChapterIndexes(part = state.activePart) {
    return getChapterIndexCache().byPart.get(part) || [];
  }

  function chapterArc(chapter) {
    if (chapterPart(chapter) !== 5) return 0;
    if (chapter?.kind === "prologue") return 0;
    const arc = Number(chapter?.arc);
    return Number.isInteger(arc) && PART5_ARCS[arc] ? arc : 1;
  }

  function chapterSection(chapter) {
    if (chapterPart(chapter) !== 5) return 0;
    return chapter?.kind === "prologue" ? -1 : chapterArc(chapter);
  }

  function activeTocChapterIndexes() {
    const indexes = partChapterIndexes();
    if (state.activePart !== 5 || state.activeArc === 0) return indexes;
    return indexes.filter((index) => chapterSection(window.CHAPTERS[index]) === state.activeArc);
  }

  function readChapterSet() {
    return new Set(state.readChapters);
  }

  function indexesAreComplete(indexes, read = readChapterSet()) {
    return indexes.length > 0 && indexes.every((index) => read.has(index));
  }

  function partIsComplete(part, read = readChapterSet()) {
    return indexesAreComplete(partChapterIndexes(part), read);
  }

  function partFiveSectionIndexes(section) {
    return partChapterIndexes(5).filter((index) => chapterSection(window.CHAPTERS[index]) === section);
  }

  function partFiveSectionIsComplete(section, read = readChapterSet()) {
    return indexesAreComplete(partFiveSectionIndexes(section), read);
  }

  function partIsUnlocked(part) {
    if (state.progressionMode === "free" || part <= 1) return true;
    return partIsComplete(part - 1);
  }

  function partFiveSectionIsUnlocked(section) {
    if (state.progressionMode === "free") return true;
    if (!partIsUnlocked(5)) return false;
    if (section <= 0 || section === -1) return true;
    if (section === 1) return partFiveSectionIsComplete(-1);
    return partFiveSectionIsComplete(section - 1);
  }

  function unlockedJournalEntries(block) {
    if (state.progressionMode === "free") return block.entries || [];
    const read = readChapterSet();
    return (block.entries || []).filter((entry) => {
      const chapterIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === entry.chapterId);
      return chapterIndex >= 0 && read.has(chapterIndex);
    });
  }

  function unlockedArchiveTier() {
    if (state.progressionMode === "free") return 6;
    for (let part = 6; part >= 1; part -= 1) {
      if (partIsComplete(part)) return part;
    }
    return 0;
  }

  function extrasAreUnlocked() {
    if (state.progressionMode === "free") return true;
    const extrasChapter = window.CHAPTERS.find((chapter) => chapter.id === "extras");
    const journal = extrasChapter?.blocks?.find((block) => block.type === "journal-index");
    return unlockedArchiveTier() >= 2 || Boolean(journal && unlockedJournalEntries(journal).length);
  }

  function isExtraBlockUnlocked(chapter, block, blockIndex) {
    if (chapter.id !== "extras" || state.progressionMode === "free") return true;
    if (block.type === "journal-index") return unlockedJournalEntries(block).length > 0;

    let requiredPart = 2;
    for (let index = 0; index <= blockIndex; index += 1) {
      const candidate = chapter.blocks[index];
      if (candidate?.type !== "scene") continue;
      const label = String(candidate.text || "");
      if (label.includes("Parte III")) requiredPart = 3;
      if (label.includes("Parte V")) requiredPart = 5;
      if (label.includes("Parte VI")) requiredPart = 6;
    }
    return partIsComplete(requiredPart);
  }

  function isChapterUnlocked(index) {
    const chapter = window.CHAPTERS[index];
    if (!chapter) return false;
    if (!isNarrativeChapter(chapter)) {
      return chapter.id === "disclaimer" || (chapter.id === "extras" && extrasAreUnlocked());
    }
    const part = chapterPart(chapter);
    if (!partIsUnlocked(part)) return false;
    return part !== 5 || partFiveSectionIsUnlocked(chapterSection(chapter));
  }

  function partLockReason(part) {
    if (part <= 1 || partIsUnlocked(part)) return "Disponible";
    return `Completa la Parte ${part - 1} para abrir esta ruta.`;
  }

  function sectionLockReason(section) {
    if (partFiveSectionIsUnlocked(section)) return "Disponible";
    if (!partIsUnlocked(5)) return "Completa la Parte IV para abrir La brecha.";
    if (section === 1) return "Completa el prólogo para abrir el Arco I.";
    return `Completa el Arco ${["", "I", "II", "III"][section - 1]} para continuar.`;
  }

  function chapterLockReason(index) {
    const chapter = window.CHAPTERS[index];
    if (!chapter) return "Contenido no disponible.";
    if (chapter.id === "extras") return "Completa los capítulos asociados para recuperar archivos.";
    const part = chapterPart(chapter);
    return part === 5 ? sectionLockReason(chapterSection(chapter)) : partLockReason(part);
  }

  function completionContext() {
    const read = readChapterSet();
    const readId = (id) => {
      const index = window.CHAPTERS.findIndex((chapter) => chapter.id === id);
      return index >= 0 && read.has(index);
    };
    const completePart = (part) => partIsComplete(part, read);
    const completeSection = (section) => partFiveSectionIsComplete(section, read);
    return {
      read,
      readId,
      completePart,
      completeSection,
      completeStory: [1, 2, 3, 4, 5, 6].every(completePart)
    };
  }

  function unlockedAchievements() {
    const context = completionContext();
    return ACHIEVEMENTS.filter((achievement) => achievement.test(context));
  }

  function showProgressionNotice(message) {
    const notice = $("#progression-notice");
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.remove("is-visible");
    void notice.offsetWidth;
    notice.classList.add("is-visible");
    window.clearTimeout(showProgressionNotice.timer);
    showProgressionNotice.timer = window.setTimeout(() => {
      notice.classList.remove("is-visible");
      window.setTimeout(() => { notice.hidden = true; }, 260);
    }, 3200);
  }

  function syncAchievementSeen({ announce = false } = {}) {
    const unlocked = unlockedAchievements();
    const unseen = unlocked.filter((achievement) => !state.achievementSeen.includes(achievement.id));
    unseen.forEach((achievement) => state.achievementSeen.push(achievement.id));
    if (announce && unseen.length) {
      const latest = unseen.at(-1);
      showProgressionNotice(`Registro recuperado: ${latest.title}.`);
    }
    return unlocked;
  }

  function journalEntryCount(chapter) {
    return chapter.blocks
      .filter((block) => block.type === "journal-index")
      .reduce((total, block) => total + unlockedJournalEntries(block).length, 0);
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

  function renderPartFiveMap(fragment) {
    const heading = document.createElement("li");
    heading.className = "toc-group-title toc-part5-map-heading";
    const label = document.createElement("span");
    label.textContent = "Parte V · Mapa de lectura";
    const description = document.createElement("strong");
    description.textContent = "Prólogo independiente y tres arcos";
    heading.append(label, description);
    fragment.append(heading);

    const map = document.createElement("li");
    map.className = "part5-section-map";
    const definitions = [
      { section: -1, index: "P", title: PART5_SECTIONS["-1"].title, verb: PART5_SECTIONS["-1"].verb, range: PART5_SECTIONS["-1"].range, summary: PART5_SECTIONS["-1"].summary },
      { section: 1, index: "I", title: PART5_ARCS[1].title, verb: PART5_ARCS[1].verb, range: PART5_ARCS[1].range, summary: PART5_ARCS[1].summary },
      { section: 2, index: "II", title: PART5_ARCS[2].title, verb: PART5_ARCS[2].verb, range: PART5_ARCS[2].range, summary: PART5_ARCS[2].summary },
      { section: 3, index: "III", title: PART5_ARCS[3].title, verb: PART5_ARCS[3].verb, range: PART5_ARCS[3].range, summary: PART5_ARCS[3].summary },
    ];

    definitions.forEach((definition) => {
      const button = document.createElement("button");
      const isLocked = !partFiveSectionIsUnlocked(definition.section);
      button.type = "button";
      button.className = `part5-section-card${isLocked ? " is-locked" : ""}`;
      button.dataset.action = "switch-part5-section";
      button.dataset.section = String(definition.section);
      button.dataset.sectionVisual = definition.section === -1 ? "prologue" : `arc-${definition.section}`;
      button.setAttribute("aria-disabled", String(isLocked));

      const index = document.createElement("span");
      index.className = "part5-section-index";
      index.textContent = definition.index;
      const copy = document.createElement("span");
      copy.className = "part5-section-copy";
      const verb = document.createElement("small");
      verb.textContent = definition.verb;
      const title = document.createElement("strong");
      title.textContent = definition.title;
      const range = document.createElement("em");
      range.textContent = definition.range;
      const summary = document.createElement("p");
      summary.textContent = definition.summary;
      const arrow = document.createElement("i");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = isLocked ? sectionLockReason(definition.section) : "Abrir índice →";
      copy.append(verb, title, range, summary, arrow);
      button.append(index, copy);
      map.append(button);
    });
    fragment.append(map);
  }

  function renderTOC() {
    const list = $("#toc-list");
    const renderKey = [
      state.activePart,
      state.activeArc,
      state.lastChapter,
      state.hasStarted ? 1 : 0,
      state.progressionMode,
      state.readChapters.join(",")
    ].join("|");

    if (renderKey === lastTocRenderKey && list.childElementCount) {
      updateSummary();
      return;
    }

    const fragment = document.createDocumentFragment();
    const narrativeIndexes = narrativeChapterIndexes();
    const narrativeOrder = new Map(narrativeIndexes.map((index, order) => [index, order + 1]));
    const readChapters = new Set(state.readChapters);
    const arc = state.activePart === 5 && state.activeArc > 0 ? PART5_ARCS[state.activeArc] : null;
    const indexedNarrative = activeTocChapterIndexes();
    let currentGroup = "";

    if (state.activePart === 5 && state.activeArc === 0) {
      renderPartFiveMap(fragment);
      currentGroup = "Parte V · Mapa de lectura";
    }

    if (arc && !indexedNarrative.length) {
      const heading = document.createElement("li");
      heading.className = "toc-group-title toc-arc-heading";
      const label = document.createElement("span");
      label.textContent = `${arc.label} · ${arc.title}`;
      const description = document.createElement("strong");
      description.textContent = arc.range;
      heading.append(label, description);

      const empty = document.createElement("li");
      empty.className = "toc-arc-empty";
      const emptyKicker = document.createElement("span");
      emptyKicker.textContent = arc.verb;
      const emptyTitle = document.createElement("strong");
      emptyTitle.textContent = "Índice preparado";
      const emptyText = document.createElement("p");
      emptyText.textContent = "Los capítulos de este arco aparecerán aquí a medida que se incorporen al lector.";
      empty.append(emptyKicker, emptyTitle, emptyText);
      fragment.append(heading, empty);
      currentGroup = `${arc.label} · ${arc.title}`;
    }

    window.CHAPTERS.forEach((chapter, index) => {
      if (chapter.hiddenFromToc) return;
      const isExtra = !isNarrativeChapter(chapter);
      if (!isExtra && chapterPart(chapter) !== state.activePart) return;
      if (!isExtra && state.activePart === 5) {
        if (state.activeArc === 0) return;
        if (chapterSection(chapter) !== state.activeArc) return;
      }

      const partLabel = PARTS[state.activePart].label;
      const sectionDefinition = state.activePart === 5 ? PART5_SECTIONS[String(state.activeArc)] : null;
      const arcLabel = state.activePart === 5
        ? state.activeArc === 0
          ? "Parte V"
          : state.activeArc === -1
            ? "Prólogo · The Outside"
            : `${PART5_ARCS[state.activeArc].label} · ${PART5_ARCS[state.activeArc].title}`
        : "";
      const group = isExtra
        ? "Extras"
        : state.activePart === 5
          ? arcLabel
          : chapter.kind === "interlude"
            ? "Interludio"
            : partLabel;

      if (group !== currentGroup) {
        const heading = document.createElement("li");
        heading.className = "toc-group-title";
        const label = document.createElement("span");
        label.textContent = group;
        const description = document.createElement("strong");
        description.textContent = state.activePart === 5 && group === arcLabel
          ? sectionDefinition?.range || "Contenido disponible"
          : group === partLabel
            ? "Capítulos disponibles"
            : group === "Interludio"
              ? "Documento final"
              : "Archivo complementario";
        heading.append(label, description);
        fragment.append(heading);
        currentGroup = group;
      }

      const item = document.createElement("li");
      const button = document.createElement("button");
      const isRead = !isExtra && readChapters.has(index);
      const isLocked = !isChapterUnlocked(index);
      item.className = `toc-entry${isExtra ? " toc-entry-extra" : ""}${isLocked ? " is-locked" : ""}`;

      button.type = "button";
      button.className = `toc-item${isRead ? " is-read" : ""}${isExtra ? " toc-item-extra" : ""}${isLocked ? " is-locked" : ""}`;
      button.dataset.action = "open-chapter";
      button.dataset.chapter = String(index);
      button.setAttribute("aria-disabled", String(isLocked));
      button.setAttribute("aria-label", isLocked
        ? `${chapter.number}: ${chapter.title}. Bloqueado. ${chapterLockReason(index)}`
        : `${chapter.number}: ${chapter.title}`);

      const number = document.createElement("span");
      number.className = "toc-number";
      const chapterNumber = Number.parseInt(chapter.number.match(/\d+/)?.[0] || "", 10);
      const isDisclaimer = chapter.id === "disclaimer";
      number.textContent = isExtra
        ? isDisclaimer ? "AV" : "EX"
        : chapter.kind === "interlude"
          ? "IN"
          : chapter.kind === "prologue"
            ? "PR"
            : String(Number.isFinite(chapterNumber) ? chapterNumber : narrativeOrder.get(index) || index + 1)
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
          : isLocked ? "Archivo clasificado" : `${availableEntries} entradas disponibles`
        : `${chapterMinutes(chapter)} min`;
      const status = document.createElement("span");
      status.className = "toc-state";
      status.textContent = isLocked
        ? "Bloqueado"
        : isExtra
        ? isDisclaimer ? "Leer" : "Explorar"
        : isRead
          ? "Leído ✓"
          : index === state.lastChapter && state.hasStarted
            ? "En curso"
            : "Leer";
      const arrow = document.createElement("span");
      arrow.className = "toc-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = isLocked ? "⊘" : "→";
      meta.append(time, status);
      button.append(number, content, meta, arrow);
      item.append(button);
      fragment.append(item);
    });

    list.replaceChildren(fragment);
    lastTocRenderKey = renderKey;
    updateSummary();
  }



  function renderChapterHero(chapter) {
    const hero = chapter?.hero;
    const background = safeLocalAssetUrl(hero?.background);
    if (!hero || !background) return null;

    const section = document.createElement("section");
    section.className = `chapter-cinematic-hero part-cinematic-hero part-cinematic-part-${chapterPart(chapter)} part5-cinematic-arc-${chapterArc(chapter)}`;
    section.style.setProperty("--chapter-hero-image", `url("${background}")`);
    const titleId = `chapter-cinematic-title-${chapter.id}`;
    section.setAttribute("aria-labelledby", titleId);

    const overlay = document.createElement("div");
    overlay.className = "chapter-cinematic-overlay";

    const content = document.createElement("div");
    content.className = "chapter-cinematic-content";

    const eyebrow = document.createElement("p");
    eyebrow.className = "chapter-cinematic-eyebrow";
    eyebrow.textContent = hero.eyebrow || chapter.number;

    const title = document.createElement("h1");
    title.id = titleId;
    title.className = "chapter-cinematic-title";
    title.textContent = hero.title || chapter.title;

    const subtitle = document.createElement("p");
    subtitle.className = "chapter-cinematic-subtitle";
    subtitle.textContent = hero.subtitle || "";

    const lead = document.createElement("blockquote");
    lead.className = "chapter-cinematic-quote";
    lead.textContent = hero.lead || chapter.subtitle || "";

    const chronology = chapter.blocks?.[0]?.type === "chronology" ? chapter.blocks[0] : null;
    const location = document.createElement("p");
    location.className = "chapter-cinematic-location";
    location.textContent = hero.location || chronology?.text || "";

    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.className = "chapter-cinematic-continue";
    continueButton.dataset.action = "scroll-reader-content";
    const continueLabel = document.createElement("span");
    continueLabel.textContent = chapter.kind === "prologue" ? "Comenzar el prólogo" : "Comenzar el capítulo";
    const continueIcon = document.createElement("i");
    continueIcon.setAttribute("aria-hidden", "true");
    continueIcon.textContent = "↓";
    continueButton.append(continueLabel, continueIcon);

    content.append(eyebrow, title, subtitle, lead, location, continueButton);
    section.append(overlay, content);
    return section;
  }

  function createCompletionCard(chapter, index) {
    const complete = state.readChapters.includes(index);
    const card = document.createElement("section");
    card.className = `chapter-completion${complete ? " is-complete" : ""}`;
    card.dataset.chapterCompletion = String(index);
    card.setAttribute("aria-label", complete ? "Capítulo completado" : "Completar capítulo");

    const marker = document.createElement("span");
    marker.className = "chapter-completion-marker";
    marker.textContent = complete ? "REGISTRO // COMPLETADO" : "REGISTRO // FIN DE CAPÍTULO";
    const title = document.createElement("strong");
    title.textContent = complete ? "La ruta quedó registrada." : "¿Terminaste esta entrada?";
    const text = document.createElement("p");
    text.textContent = complete
      ? "Tu progreso está guardado en este dispositivo."
      : "Márcala como leída para avanzar en el recorrido narrativo y recuperar nuevos archivos.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-completion-button";
    button.dataset.action = "complete-chapter";
    button.dataset.chapter = String(index);
    button.disabled = complete;
    button.textContent = complete ? "Completado ✓" : `Completar ${chapter.number.toLowerCase()}`;
    card.append(marker, title, text, button);
    return card;
  }

  function createExtrasProgressCard() {
    const card = document.createElement("section");
    card.className = "extras-progress-card";
    const label = document.createElement("span");
    label.textContent = "ARCHIVO // RECUPERACIÓN PROGRESIVA";
    const title = document.createElement("strong");
    title.textContent = state.progressionMode === "free"
      ? "Todos los documentos están disponibles."
      : "El archivo crecerá con tu lectura.";
    const text = document.createElement("p");
    const next = ARCHIVE_TIERS.find((tier) => tier.part && !partIsComplete(tier.part));
    text.textContent = next
      ? `Próxima recuperación: ${next.title}. ${next.requirement}`
      : "Has recuperado todos los documentos disponibles.";
    card.append(label, title, text);
    return card;
  }

  function renderChapter(index) {
    const chapter = window.CHAPTERS[index];
    const reader = $("#reader");
    reader.replaceChildren();

    let saiNotice = null;
    if (chapter.id === "cap18") {
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
      saiNotice = notice;
    }

    const hero = renderChapterHero(chapter);
    if (hero) {
      reader.append(hero);
      const contentStart = document.createElement("div");
      contentStart.id = "reader-content-start";
      contentStart.className = "reader-content-start";
      contentStart.tabIndex = -1;
      reader.append(contentStart);
      if (saiNotice) reader.append(saiNotice);
    } else {
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
      if (saiNotice) reader.append(saiNotice);
    }

    chapter.blocks.forEach((block, blockIndex) => {
      if (hero && blockIndex === 0 && block.type === "chronology") return;
      if (!isExtraBlockUnlocked(chapter, block, blockIndex)) return;
      const node = renderBlock(block, { chapterIndex: index, blockIndex });
      if (node) reader.append(node);
    });

    if (isNarrativeChapter(chapter)) {
      reader.append(createReaderMemoryTools(chapter, index));
      reader.append(createCompletionCard(chapter, index));
    } else if (chapter.id === "extras") {
      reader.append(createExtrasProgressCard());
    }

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
    next.disabled = nextIndex === -1 || !isChapterUnlocked(nextIndex);
    previous.dataset.chapterTarget = String(previousIndex);
    next.dataset.chapterTarget = String(nextIndex);
    $("#prev-title").textContent = previousIndex >= 0 ? window.CHAPTERS[previousIndex].title : "";
    $("#next-title").textContent = nextIndex >= 0 ? window.CHAPTERS[nextIndex].title : "";
  }

  function createReaderMemoryTools(chapter, index) {
    const tools = document.createElement("div");
    tools.className = "reader-memory-tools";
    const bookmark = document.createElement("button");
    bookmark.type = "button";
    bookmark.className = "memory-tool";
    bookmark.dataset.action = "toggle-bookmark";
    bookmark.dataset.chapter = String(index);
    const bookmarked = state.bookmarks.includes(chapter.id);
    bookmark.textContent = bookmarked ? "Marcador guardado" : "Guardar marcador";
    bookmark.setAttribute("aria-pressed", String(bookmarked));
    const quote = document.createElement("button");
    quote.type = "button";
    quote.className = "memory-tool";
    quote.dataset.action = "save-chapter-quote";
    quote.dataset.chapter = String(index);
    quote.textContent = "Guardar cita";
    tools.append(bookmark, quote);
    return tools;
  }

  function saveChapterQuote(index) {
    const chapter = window.CHAPTERS[index];
    if (!chapter) return;
    const block = chapter.blocks.find((entry) => ["quote", "pull-quote", "epigraph"].includes(entry.type) && entry.text);
    const text = block?.text || chapter.subtitle || chapter.title;
    const quote = { text: String(text).slice(0, 500), chapterId: chapter.id || "", savedAt: new Date().toISOString() };
    state.savedQuotes = [...state.savedQuotes.filter((entry) => entry.text !== quote.text), quote].slice(-200);
    saveState();
    showProgressionNotice("Cita guardada en tu registro.");
  }

  function renderBlock(block) {
    if (block.who && state.settings.voices === "hide") return null;

    if (block.type === "p") {
      const paragraph = document.createElement("p");
      paragraph.textContent = block.text;
      return paragraph;
    }

    if (block.type === "author-note") {
      const note = document.createElement("aside");
      note.className = "author-note";
      note.setAttribute("aria-label", "Nota del autor");

      const label = document.createElement("span");
      label.className = "author-note-label";
      label.textContent = "Nota del autor";

      const text = document.createElement("p");
      text.textContent = block.text;

      note.append(label, text);
      return note;
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
      const chronologyText = String(block.text || "").trim();
      const dividerIndex = chronologyText.indexOf(",");

      if (dividerIndex > 0 && dividerIndex < chronologyText.length - 1) {
        marker.dataset.chronologyKind = "place-time";

        const place = document.createElement("strong");
        place.className = "reader-chronology-place";
        place.textContent = chronologyText.slice(0, dividerIndex).trim();

        const separator = document.createElement("span");
        separator.className = "reader-chronology-separator";
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = "·";

        const moment = document.createElement("em");
        moment.className = "reader-chronology-moment";
        moment.textContent = chronologyText.slice(dividerIndex + 1).trim();

        text.append(place, separator, moment);
        marker.setAttribute("aria-label", `${label.textContent}: ${chronologyText}`);
        label.setAttribute("aria-hidden", "true");
        text.setAttribute("aria-hidden", "true");
      } else {
        text.textContent = chronologyText;
      }

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

    if (block.type === "diary" || block.type === "archive-letter") {
      const letter = document.createElement("section");
      letter.className = block.type === "diary" ? "clancy-letter" : "clancy-letter archive-letter";
      letter.dataset.label = block.type === "diary" ? "DIARIO DE CLANCY" : (block.intro || "ARCHIVO DE LA BRECHA");
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
      const visibleEntries = unlockedJournalEntries(block);
      visibleEntries.forEach((entry) => {
        const entryIndex = (block.entries || []).indexOf(entry);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "journal-entry-link";
        button.dataset.action = "journal-entry";
        button.dataset.journalIndex = String(entryIndex);
        button.setAttribute(
          "aria-label",
          `${entry.title}, ${entry.code}. Abrir entrada en el visor del Diario de Clancy`
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
        destination.textContent = "Abrir entrada →";
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

  function preloadPartBackdrop(part) {
    if (indexBackdropPreloads.has(part)) return indexBackdropPreloads.get(part);
    const source = indexBackdropAssets[part];
    if (!source) return Promise.resolve();

    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = part === state.activePart ? "high" : "low";
      image.onload = () => {
        const decoded = typeof image.decode === "function" ? image.decode().catch(() => {}) : Promise.resolve();
        decoded.finally(resolve);
      };
      image.onerror = resolve;
      image.src = new URL(source, document.baseURI).href;
    });
    indexBackdropPreloads.set(part, promise);
    return promise;
  }

  function preparePartBackdrop(part) {
    const backdrop = document.querySelector(`.toc-backdrop[data-part="${part}"]`);
    if (!backdrop || backdrop.dataset.loaded === "true") return;
    preloadPartBackdrop(part).then(() => {
      backdrop.dataset.loaded = "true";
    });
  }

  function warmIndexBackdrops() {
    const warm = () => Object.keys(indexBackdropAssets).forEach((part) => preparePartBackdrop(Number(part)));
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warm, { timeout: 2200 });
    } else {
      window.setTimeout(warm, 900);
    }
  }

  function normalizeSiteRoute(route) {
    let normalized = String(route || "").trim();
    normalized = normalized.replace(/^#\/?/, "/");
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    normalized = normalized.replace(/\/{2,}/g, "/");
    if (normalized.length > 1) normalized = normalized.replace(/\/+$/, "");
    return normalized === "/" || normalized === "/index.html" ? "" : normalized;
  }

  function legacyHashRoute() {
    const hash = window.location.hash || "";
    return /^#\/?/.test(hash) ? normalizeSiteRoute(hash) : "";
  }

  function currentRoute() {
    const pathname = normalizeSiteRoute(window.location.pathname);
    const hashRoute = legacyHashRoute();
    const isLegacyShell = !pathname || pathname === "/index.html";
    return hashRoute && isLegacyShell ? hashRoute : (pathname || hashRoute);
  }

  function writeRoute(route, { replace = false } = {}) {
    const normalized = normalizeSiteRoute(route) || SITE_ROUTES.home;
    const current = currentRoute();
    if (current === normalized && !window.location.hash) {
      lastAppliedRoute = normalized;
      return;
    }

    const url = `${normalized}${window.location.search || ""}`;
    try {
      window.history[replace ? "replaceState" : "pushState"]({ route: normalized }, "", url);
    } catch (error) {
      console.warn("No se pudo actualizar la ruta limpia mediante History API; se usará el hash compatible.", error);
      window.location.hash = `#${normalized}`;
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

  function routeToPart(part, section = state.activeArc) {
    const base = `${SITE_ROUTES.indexPrefix}${part}`;
    if (part !== 5 || section === 0) return base;
    if (section === -1) return `${base}/prologo`;
    return PART5_ARCS[section] ? `${base}/arco-${section}` : base;
  }

  function swapVisibleView(viewId) {
    if (viewId !== "view-reader") {
      delete document.body.dataset.readerChapter;
      delete document.body.dataset.readerPart;
      delete document.body.dataset.readerArc;
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
    document.title = state.activePart === 5
      ? `Índice · ${PART5_SECTIONS[String(state.activeArc)]?.title || PARTS[5].indexTitle} — Sahlo Folina`
      : `Índice · ${PARTS[state.activePart].indexTitle} — Sahlo Folina`;
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

  function goToAbout(options = {}) {
    document.title = "Sobre la obra — Sahlo Folina";
    show("view-about", options);
    if (options.updateRoute !== false) {
      writeRoute(SITE_ROUTES.about, { replace: Boolean(options.replaceRoute) });
    }
  }

  function goToDisclaimer() {
    const disclaimerIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === "disclaimer");
    if (disclaimerIndex >= 0) goToReader(disclaimerIndex, { resetScroll: true });
  }

  function goToReader(index, options = {}) {
    if (index < 0 || index >= window.CHAPTERS.length) return;
    if (!isChapterUnlocked(index)) {
      showProgressionNotice(chapterLockReason(index));
      return;
    }
    const previousChapter = window.CHAPTERS[state.lastChapter];
    const chapter = window.CHAPTERS[index];
    const reduceMotion = motionIsReduced();
    const entersFinalInterlude = chapter.id === "interludio-cuenta-cancelada" && previousChapter?.id === "cap24";
    const entersPartFour = chapter.id === "cap25" && previousChapter?.id === "interludio-cuenta-cancelada";
    const entersPartFive = chapter.id === "prologo-parte-5" && previousChapter?.id === "cap31";

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
    if (entersPartFive && !reduceMotion) {
      document.body.classList.remove("part5-breach-transition");
      void document.body.offsetWidth;
      document.body.classList.add("part5-breach-transition");
      window.setTimeout(() => document.body.classList.remove("part5-breach-transition"), 1150);
    }
    const resolvedReaderPart = isNarrativeChapter(chapter) ? chapterPart(chapter) : null;
    document.body.dataset.readerChapter = chapter.id || "";
    document.body.dataset.readerPart = resolvedReaderPart ? String(resolvedReaderPart) : "";
    document.body.dataset.readerArc = resolvedReaderPart === 5 ? String(chapterArc(chapter)) : "";
    if (resolvedReaderPart) {
      state.activePart = resolvedReaderPart;
      if (resolvedReaderPart === 5) state.activeArc = chapterSection(chapter);
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
      .replace(/^#?\/?/, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    if (!segments.length || segments[0] === "inicio") {
      goToCover({ updateRoute: false, instant: initial });
      if (!rawRoute || window.location.hash) writeRoute(SITE_ROUTES.home, { replace: true });
      return;
    }

    if (segments[0] === "biblioteca") {
      goToLibrary({ updateRoute: false, instant: initial });
      if (window.location.hash) writeRoute(SITE_ROUTES.library, { replace: true });
      return;
    }

    if (segments[0] === "sobre") {
      goToAbout({ updateRoute: false, instant: initial });
      if (window.location.hash) writeRoute(SITE_ROUTES.about, { replace: true });
      return;
    }

    if (segments[0] === "indice") {
      const matchedPart = /^parte-(\d+)$/.exec(segments[1] || "");
      const matchedArc = /^arco-(\d+)$/.exec(segments[2] || "");
      const part = matchedPart ? Number(matchedPart[1]) : state.activePart;
      const section = segments[2] === "prologo" ? -1 : matchedArc ? Number(matchedArc[1]) : 0;
      if (PARTS[part] && partIsUnlocked(part)) state.activePart = part;
      if (
        state.activePart === 5
        && PART5_SECTIONS[String(section)]
        && partFiveSectionIsUnlocked(section)
      ) state.activeArc = section;
      goToTOC({ updateRoute: false, instant: initial });
      if (window.location.hash) writeRoute(routeToPart(state.activePart, state.activeArc), { replace: true });
      return;
    }

    if (segments[0] === "leer" && segments[1]) {
      const chapterIndex = window.CHAPTERS.findIndex((chapter) => chapter.id === segments[1]);
      if (chapterIndex >= 0 && isChapterUnlocked(chapterIndex)) {
        const targetId = /^[a-z0-9-]+$/.test(segments[2] || "") ? segments[2] : "";
        goToReader(chapterIndex, {
          targetId,
          updateRoute: false,
          instant: initial,
        });
        if (window.location.hash) writeRoute(chapterRoute(window.CHAPTERS[chapterIndex], targetId), { replace: true });
        return;
      }
    }

    goToCover({ updateRoute: false, instant: initial });
    writeRoute(SITE_ROUTES.home, { replace: true });
  }

  function journalIndexBlock() {
    const extrasChapter = window.CHAPTERS.find((chapter) => chapter.id === "extras");
    return extrasChapter?.blocks?.find((block) => block.type === "journal-index") || null;
  }

  function findDiaryBlock(targetId) {
    if (!/^[a-z0-9-]+$/.test(targetId || "")) return null;
    for (const chapter of window.CHAPTERS) {
      const block = (chapter.blocks || []).find((candidate) => (
        candidate.type === "diary" && candidate.id === targetId
      ));
      if (block) return block;
    }
    return null;
  }

  function journalSlides() {
    const indexBlock = journalIndexBlock();
    return (indexBlock?.entries || []).map((entry, index) => {
      const diary = findDiaryBlock(entry.targetId);
      return {
        index,
        title: entry.title || diary?.title || `Entrada ${index + 1}`,
        code: entry.code || diary?.intro || "",
        paragraphs: Array.isArray(diary?.paragraphs) ? diary.paragraphs : [],
        sign: diary?.sign || "",
        coda: diary?.coda || "",
      };
    }).filter((slide) => slide.paragraphs.length || slide.sign || slide.coda);
  }

  function ensureJournalViewer() {
    let dialog = $("#journal-viewer");
    if (dialog) return dialog;

    const backdrop = document.createElement("div");
    backdrop.id = "journal-viewer-backdrop";
    backdrop.className = "journal-viewer-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");

    dialog = document.createElement("section");
    dialog.id = "journal-viewer";
    dialog.className = "journal-viewer";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "journal-viewer-title");

    const header = document.createElement("header");
    header.className = "journal-viewer-header";

    const identity = document.createElement("div");
    const label = document.createElement("span");
    label.className = "journal-viewer-label";
    label.textContent = "Archivo independiente";
    const heading = document.createElement("h2");
    heading.id = "journal-viewer-title";
    heading.textContent = "Diario de Clancy";
    identity.append(label, heading);

    const headerActions = document.createElement("div");
    const counter = document.createElement("span");
    counter.id = "journal-viewer-counter";
    counter.className = "journal-viewer-counter";
    counter.setAttribute("aria-live", "polite");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "journal-viewer-close";
    close.dataset.action = "journal-close";
    close.setAttribute("aria-label", "Cerrar Diario de Clancy");
    close.textContent = "×";
    headerActions.append(counter, close);
    header.append(identity, headerActions);

    const progress = document.createElement("div");
    progress.className = "journal-viewer-progress";
    progress.setAttribute("aria-hidden", "true");
    const progressBar = document.createElement("span");
    progressBar.id = "journal-viewer-progress-bar";
    progress.append(progressBar);

    const viewport = document.createElement("div");
    viewport.className = "journal-viewer-viewport";
    const slide = document.createElement("article");
    slide.id = "journal-viewer-slide";
    slide.className = "journal-viewer-slide";
    slide.tabIndex = 0;
    viewport.append(slide);

    const footer = document.createElement("footer");
    footer.className = "journal-viewer-footer";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "journal-viewer-nav journal-viewer-prev";
    previous.dataset.action = "journal-prev";
    const previousArrow = document.createElement("span");
    previousArrow.textContent = "←";
    const previousLabel = document.createElement("strong");
    previousLabel.textContent = "Anterior";
    previous.append(previousArrow, previousLabel);
    const dots = document.createElement("div");
    dots.id = "journal-viewer-dots";
    dots.className = "journal-viewer-dots";
    dots.setAttribute("aria-label", "Seleccionar entrada del diario");
    const next = document.createElement("button");
    next.type = "button";
    next.className = "journal-viewer-nav journal-viewer-next";
    next.dataset.action = "journal-next";
    const nextLabel = document.createElement("strong");
    nextLabel.textContent = "Siguiente";
    const nextArrow = document.createElement("span");
    nextArrow.textContent = "→";
    next.append(nextLabel, nextArrow);
    footer.append(previous, dots, next);

    dialog.append(header, progress, viewport, footer);
    document.body.append(backdrop, dialog);

    backdrop.addEventListener("click", closeJournalViewer);
    viewport.addEventListener("touchstart", (event) => {
      journalViewerTouchStartX = event.changedTouches[0]?.clientX ?? null;
    }, { passive: true });
    viewport.addEventListener("touchend", (event) => {
      if (journalViewerTouchStartX == null) return;
      const endX = event.changedTouches[0]?.clientX ?? journalViewerTouchStartX;
      const delta = endX - journalViewerTouchStartX;
      journalViewerTouchStartX = null;
      if (Math.abs(delta) < 55) return;
      showJournalSlide(journalViewerIndex + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
    }, { passive: true });

    return dialog;
  }

  function renderJournalDots(slides) {
    const dots = $("#journal-viewer-dots");
    if (!dots) return;
    dots.replaceChildren();
    slides.forEach((entry, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.dataset.action = "journal-goto";
      dot.dataset.journalIndex = String(index);
      dot.setAttribute("aria-label", `Abrir ${entry.title}`);
      dot.setAttribute("aria-pressed", String(index === journalViewerIndex));
      if (index === journalViewerIndex) dot.classList.add("is-active");
      dots.append(dot);
    });
  }

  function showJournalSlide(requestedIndex, direction = 0) {
    const slides = journalSlides();
    if (!slides.length) return;
    const normalized = (requestedIndex + slides.length) % slides.length;
    journalViewerIndex = normalized;
    const entry = slides[normalized];
    const slide = $("#journal-viewer-slide");
    if (!slide) return;

    slide.classList.remove("is-entering-next", "is-entering-prev");
    slide.replaceChildren();

    const ordinal = document.createElement("span");
    ordinal.className = "journal-slide-ordinal";
    ordinal.textContent = `Entrada ${String(normalized + 1).padStart(2, "0")}`;
    const title = document.createElement("h3");
    title.textContent = entry.title;
    const code = document.createElement("p");
    code.className = "journal-slide-code";
    code.textContent = entry.code;
    const rule = document.createElement("span");
    rule.className = "journal-slide-rule";
    rule.setAttribute("aria-hidden", "true");
    const body = document.createElement("div");
    body.className = "journal-slide-body";
    entry.paragraphs.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      body.append(paragraph);
    });
    if (entry.sign) {
      const signature = document.createElement("p");
      signature.className = "journal-slide-sign";
      signature.textContent = entry.sign;
      body.append(signature);
    }
    if (entry.coda) {
      const coda = document.createElement("p");
      coda.className = "journal-slide-coda";
      coda.textContent = entry.coda;
      body.append(coda);
    }
    slide.append(ordinal, title, code, rule, body);
    slide.scrollTop = 0;

    if (direction && !motionIsReduced()) {
      slide.classList.add(direction > 0 ? "is-entering-next" : "is-entering-prev");
      window.setTimeout(() => slide.classList.remove("is-entering-next", "is-entering-prev"), 360);
    }

    const counter = $("#journal-viewer-counter");
    if (counter) counter.textContent = `${String(normalized + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    const progressBar = $("#journal-viewer-progress-bar");
    if (progressBar) progressBar.style.width = `${((normalized + 1) / slides.length) * 100}%`;
    renderJournalDots(slides);

    const previous = $("[data-action='journal-prev']");
    const next = $("[data-action='journal-next']");
    if (previous) previous.setAttribute("aria-label", `Carta anterior: ${slides[(normalized - 1 + slides.length) % slides.length].title}`);
    if (next) next.setAttribute("aria-label", `Carta siguiente: ${slides[(normalized + 1) % slides.length].title}`);
  }

  function openJournalViewer(index, trigger) {
    const slides = journalSlides();
    if (!slides.length) return;
    const dialog = ensureJournalViewer();
    const backdrop = $("#journal-viewer-backdrop");
    journalViewerLastFocusedElement = trigger || document.activeElement;
    journalViewerIndex = Math.max(0, Math.min(Number(index) || 0, slides.length - 1));
    showJournalSlide(journalViewerIndex);
    dialog.hidden = false;
    dialog.inert = false;
    dialog.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("journal-viewer-open");
    requestAnimationFrame(() => {
      dialog.classList.add("is-open");
      backdrop.classList.add("is-open");
      $("[data-action='journal-close']", dialog)?.focus();
    });
  }

  function closeJournalViewer() {
    const dialog = $("#journal-viewer");
    const backdrop = $("#journal-viewer-backdrop");
    if (!dialog || dialog.hidden) return;
    dialog.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    document.body.classList.remove("journal-viewer-open");
    journalViewerTouchStartX = null;
    const delay = motionIsReduced() ? 0 : 260;
    window.setTimeout(() => {
      if (!dialog.classList.contains("is-open")) {
        dialog.hidden = true;
        dialog.inert = true;
        dialog.setAttribute("aria-hidden", "true");
        if (backdrop) {
          backdrop.hidden = true;
          backdrop.setAttribute("aria-hidden", "true");
        }
        const returnTarget = journalViewerLastFocusedElement;
        journalViewerLastFocusedElement = null;
        if (returnTarget?.isConnected) returnTarget.focus?.();
      }
    }, delay);
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
    const isPartFive = state.activePart === 5;
    const section = isPartFive ? PART5_SECTIONS[String(state.activeArc)] || PART5_SECTIONS["0"] : null;
    document.body.dataset.activePart = String(state.activePart);
    document.body.dataset.activeArc = isPartFive ? String(state.activeArc) : "0";
    updateThemeColor();

    $("#cover-part-label").textContent = isPartFive
      ? state.activeArc === 0 ? "Parte V" : state.activeArc === -1 ? "Parte V · Prólogo" : `Parte V · Arco ${["", "I", "II", "III"][state.activeArc]}`
      : part.label;
    $("#cover-context").textContent = isPartFive ? section.context : part.context;
    $("#cover-lead").textContent = isPartFive ? section.lead : part.coverLead;
    $("#toc-part-label").textContent = isPartFive
      ? state.activeArc === 0 ? "Parte V" : state.activeArc === -1 ? "Parte V · Prólogo" : `Parte V · Arco ${["", "I", "II", "III"][state.activeArc]}`
      : part.label;
    $("#toc-part-title").textContent = isPartFive ? section.title : part.indexTitle;
    $("#toc-quote").textContent = part.quote;
    $("#toc-quote-by").textContent = part.quoteBy;

    $$(".toc-backdrop").forEach((backdrop) => {
      backdrop.classList.toggle("is-active", Number(backdrop.dataset.part) === state.activePart);
    });
    $$("[data-action='switch-part']").forEach((button) => {
      const targetPart = Number(button.dataset.part);
      const isActive = targetPart === state.activePart;
      const isLocked = !partIsUnlocked(targetPart);
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-locked", isLocked);
      button.setAttribute("aria-pressed", String(isActive));
      button.setAttribute("aria-disabled", String(isLocked));
      button.title = isLocked ? partLockReason(targetPart) : "";
    });

    const arcNavigation = $("#part5-arc-switcher");
    if (arcNavigation) arcNavigation.hidden = !isPartFive;
    const part5SectionCounts = new Map([[0, partChapterIndexes(5).length]]);
    partChapterIndexes(5).forEach((index) => {
      const sectionId = chapterSection(window.CHAPTERS[index]);
      part5SectionCounts.set(sectionId, (part5SectionCounts.get(sectionId) || 0) + 1);
    });
    $$("[data-action='switch-part5-section']").forEach((button) => {
      const sectionId = Number(button.dataset.section);
      const isActive = isPartFive && sectionId === state.activeArc;
      const isLocked = !partFiveSectionIsUnlocked(sectionId);
      const count = part5SectionCounts.get(sectionId) || 0;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-empty", sectionId !== 0 && count === 0);
      button.classList.toggle("is-locked", isLocked);
      button.setAttribute("aria-pressed", String(isActive));
      button.setAttribute("aria-disabled", String(isLocked));
      const status = $(".arc-status", button);
      if (status) {
        const sectionIndexes = partChapterIndexes(5).filter((index) => (
          chapterSection(window.CHAPTERS[index]) === sectionId
        ));
        const readCount = new Set(
          state.readChapters.filter((index) => sectionIndexes.includes(index))
        ).size;
        const range = PART5_SECTIONS[String(sectionId)]?.range || `${count} capítulos disponibles`;
        if (isLocked) {
          status.textContent = sectionLockReason(sectionId);
        } else if (sectionId === -1) {
          status.textContent = readCount ? "Prólogo leído" : "Prólogo disponible";
        } else if (readCount > 0) {
          status.textContent = `${readCount} de ${count} leídos`;
        } else {
          status.textContent = range;
        }
      }
    });
  }

  function updateCover() {
    updatePartPresentation();
    const progress = overallProgress();
    $("#stat-progress").textContent = `${progress}%`;
    $("#cover-progress-bar").style.width = `${progress}%`;
    const resumeChapter = window.CHAPTERS[state.lastNarrativeChapter];
    $("#resume-context-label").textContent = state.hasStarted ? "Continúa desde" : "Tu primera lectura";
    $("#stat-last").textContent = state.hasStarted && resumeChapter
      ? `${resumeChapter.number} · ${resumeChapter.title}`
      : "Aún no comenzaste";
    $("#start-label").textContent = state.hasStarted ? "Continuar leyendo" : "Comenzar a leer";
  }

  function updateSummary() {
    const narrativeIndexes = activeTocChapterIndexes().filter(
      (index) => window.CHAPTERS[index].kind !== "interlude"
    );
    const count = new Set(
      state.readChapters.filter((index) => narrativeIndexes.includes(index))
    ).size;
    const containsPrologue = state.activePart === 5
      && narrativeIndexes.some((index) => window.CHAPTERS[index].kind === "prologue");
    const noun = containsPrologue
      ? narrativeIndexes.length === 1 ? "entrada leída" : "entradas leídas"
      : narrativeIndexes.length === 1 ? "capítulo leído" : "capítulos leídos";
    $("#toc-progress").textContent = `${count} de ${narrativeIndexes.length} ${noun}`;
    $("#toc-progress-bar").style.width = `${narrativeIndexes.length ? Math.round((count / narrativeIndexes.length) * 100) : 0}%`;
  }

  function currentScopeIndexes() {
    if (state.activePart === 5 && state.activeArc !== 0) {
      return partFiveSectionIndexes(state.activeArc);
    }
    return partChapterIndexes(state.activePart);
  }

  function renderProgressionPanel() {
    const panel = $("#progression-panel");
    if (!panel) return;
    const narrative = narrativeChapterIndexes();
    const read = readChapterSet();
    const completedCount = narrative.filter((index) => read.has(index)).length;
    const achievements = unlockedAchievements();

    $("#progression-completed").textContent = `${completedCount} / ${narrative.length}`;
    $("#progression-achievement-count").textContent = `${achievements.length} / ${ACHIEVEMENTS.length}`;
    $("#progression-mode-copy").textContent = state.progressionMode === "guided"
      ? "Recorrido narrativo"
      : "Lectura libre";

    $$('[data-progression-mode]').forEach((button) => {
      const active = button.dataset.progressionMode === state.progressionMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const achievementList = $("#achievement-list");
    const unlockedIds = new Set(achievements.map((achievement) => achievement.id));
    const achievementFragment = document.createDocumentFragment();
    ACHIEVEMENTS.forEach((achievement) => {
      const unlocked = unlockedIds.has(achievement.id);
      const item = document.createElement("li");
      item.className = `achievement-card${unlocked ? " is-unlocked" : " is-locked"}`;
      const code = document.createElement("span");
      code.textContent = achievement.code;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = unlocked ? achievement.title : "Registro clasificado";
      const description = document.createElement("p");
      description.textContent = unlocked ? achievement.description : "Continúa leyendo para revelar este sello.";
      copy.append(title, description);
      item.append(code, copy);
      achievementFragment.append(item);
    });
    achievementList.replaceChildren(achievementFragment);

    const archiveList = $("#archive-unlock-list");
    const extrasChapter = window.CHAPTERS.find((chapter) => chapter.id === "extras");
    const journalBlock = extrasChapter?.blocks?.find((block) => block.type === "journal-index");
    const journalCount = journalBlock ? unlockedJournalEntries(journalBlock).length : 0;
    const archiveFragment = document.createDocumentFragment();
    ARCHIVE_TIERS.forEach((tier) => {
      const unlocked = tier.id === "journal"
        ? state.progressionMode === "free" || journalCount > 0
        : state.progressionMode === "free" || partIsComplete(tier.part);
      const item = document.createElement("li");
      item.className = `archive-unlock${unlocked ? " is-unlocked" : " is-locked"}`;
      const marker = document.createElement("span");
      marker.textContent = unlocked ? "RECUPERADO" : "CLASIFICADO";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = tier.title;
      const description = document.createElement("p");
      description.textContent = tier.id === "journal" && unlocked
        ? `${state.progressionMode === "free" ? journalBlock?.entries?.length || 0 : journalCount} entradas disponibles.`
        : unlocked ? "Disponible en Extras." : tier.requirement;
      copy.append(title, description);
      item.append(marker, copy);
      archiveFragment.append(item);
    });
    archiveList.replaceChildren(archiveFragment);

    const markButton = $("#mark-current-scope");
    if (markButton) {
      const scope = state.activePart === 5 && state.activeArc !== 0
        ? state.activeArc === -1 ? "este prólogo" : `el Arco ${["", "I", "II", "III"][state.activeArc]}`
        : `la Parte ${state.activePart}`;
      markButton.textContent = `Ya leí ${scope}`;
      markButton.disabled = indexesAreComplete(currentScopeIndexes());
    }
  }

  function refreshProgressionUI() {
    lastTocRenderKey = "";
    updatePartPresentation();
    renderTOC();
    updateCover();
    renderProgressionPanel();
    updateAccountProgressSummary();
  }

  function completeChapter(index, { announce = true } = {}) {
    if (!isNarrativeChapter(window.CHAPTERS[index]) || state.readChapters.includes(index)) return;
    state.readChapters.push(index);
    state.chapterProgress[index] = 1;
    const unlockedBefore = new Set(state.achievementSeen);
    const achievements = syncAchievementSeen({ announce });
    saveState();
    refreshProgressionUI();

    const card = $(`[data-chapter-completion="${index}"]`);
    if (card) {
      card.classList.add("is-complete");
      $(".chapter-completion-marker", card).textContent = "REGISTRO // COMPLETADO";
      $("strong", card).textContent = "La ruta quedó registrada.";
      $("p", card).textContent = "Tu progreso está guardado en este dispositivo.";
      const button = $("button", card);
      button.disabled = true;
      button.textContent = "Completado ✓";
    }

    const narrative = narrativeChapterIndexes();
    const position = narrative.indexOf(index);
    const nextIndex = position >= 0 ? narrative[position + 1] : -1;
    const nextButton = $("#next-chapter");
    if (nextButton && nextIndex >= 0) nextButton.disabled = !isChapterUnlocked(nextIndex);
    if (announce && achievements.every((achievement) => unlockedBefore.has(achievement.id))) {
      showProgressionNotice("Capítulo registrado. El recorrido fue actualizado.");
    }
  }

  function setProgressionMode(mode) {
    if (!["guided", "free"].includes(mode) || state.progressionMode === mode) return;
    state.progressionMode = mode;
    if (mode === "guided" && !partIsUnlocked(state.activePart)) {
      state.activePart = [6, 5, 4, 3, 2, 1].find((part) => partIsUnlocked(part)) || 1;
      state.activeArc = 0;
    }
    saveState();
    refreshProgressionUI();
    showProgressionNotice(mode === "guided"
      ? "Recorrido narrativo activado."
      : "Advertencia: lectura libre activada. Puede contener spoilers.");
  }

  function openFreeReadingWarning(trigger) {
    const warning = $("#free-reading-warning");
    if (!warning) return;
    lastFocusedElement = trigger || document.activeElement;
    const checkbox = $("#free-reading-warning-dismiss", warning);
    if (checkbox) checkbox.checked = false;
    warning.hidden = false;
    requestAnimationFrame(() => warning.classList.add("is-open"));
    $("[data-action='confirm-free-reading']", warning)?.focus();
  }

  function closeFreeReadingWarning(restoreFocus = true) {
    const warning = $("#free-reading-warning");
    if (!warning || warning.hidden) return;
    warning.classList.remove("is-open");
    window.setTimeout(() => {
      warning.hidden = true;
      if (restoreFocus && lastFocusedElement) lastFocusedElement.focus?.();
      lastFocusedElement = null;
    }, 180);
  }

  function confirmFreeReadingMode() {
    const checkbox = $("#free-reading-warning-dismiss");
    if (checkbox?.checked) state.freeReadingWarningDismissed = true;
    closeFreeReadingWarning(false);
    setProgressionMode("free");
  }

  function requestProgressionMode(mode, trigger) {
    if (mode !== "free" || state.progressionMode === "free" || state.freeReadingWarningDismissed) {
      setProgressionMode(mode);
      return;
    }
    openFreeReadingWarning(trigger);
  }

  function markCurrentScopeRead() {
    const indexes = currentScopeIndexes().filter((index) => !state.readChapters.includes(index));
    if (!indexes.length) return;
    const label = state.activePart === 5 && state.activeArc !== 0
      ? state.activeArc === -1 ? "este prólogo" : "este arco"
      : "esta parte";
    if (!window.confirm(`¿Quieres marcar ${label} como leído?`)) return;
    indexes.forEach((index) => {
      state.readChapters.push(index);
      state.chapterProgress[index] = 1;
    });
    syncAchievementSeen({ announce: true });
    saveState();
    refreshProgressionUI();
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

    const completionCard = $(`[data-chapter-completion="${state.lastChapter}"]`);
    if (completionCard && !state.readChapters.includes(state.lastChapter)) {
      completionCard.classList.toggle("is-ready", progress > 0.85);
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
      ? { 1: "#e9e5d7", 2: "#e9e5d7", 3: "#ffd9e8", 4: "#e7eef3", 5: "#e4ebf1" }
      : { 1: "#0b0c0a", 2: "#0b0c0a", 3: "#081c30", 4: "#04101d", 5: "#01060c" };
    if (contextPart === 5 && effectiveTheme() === "dark") {
      const readerArc = Number(document.body.dataset.readerArc);
      meta.content = ({ 0: "#01060c", 1: "#120506", 2: "#081011", 3: "#071011" })[readerArc] || "#01060c";
      return;
    }
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

  async function handleAction(action, trigger) {
    switch (action) {
      case "accept-disclaimer":
        closeDisclaimer();
        break;
      case "read-disclaimer":
        closeDisclaimer({ openFullText: true });
        break;
      case "start":
        {
          const preferred = state.hasStarted
            ? state.lastNarrativeChapter
            : partChapterIndexes(state.activePart)[0] ?? 0;
          const fallback = narrativeChapterIndexes().find((index) => isChapterUnlocked(index)) ?? 0;
          goToReader(isChapterUnlocked(preferred) ? preferred : fallback);
        }
        break;
      case "goto-toc":
      case "back-toc":
        goToTOC();
        break;
      case "goto-library":
        goToLibrary();
        break;
      case "goto-about":
        goToAbout();
        break;
      case "goto-disclaimer":
        goToDisclaimer();
        break;
      case "open-account":
        openAccountDialog(trigger);
        break;
      case "close-account":
        closeAccountDialog();
        break;
      case "toggle-auth-mode":
        auth.mode = auth.mode === "signup" ? "signin" : "signup";
        renderAccountState();
        setAccountStatus("");
        break;
      case "switch-account-tab":
        switchAccountTab(trigger.dataset.accountTab);
        break;
      case "switch-account-user-tab":
        switchAccountUserTab(trigger.dataset.accountUserTab);
        break;
      case "set-auth-mode":
        setAuthMode(trigger.dataset.authMode);
        break;
      case "save-account-profile":
        auth.selectedAvatar = AVATARS.some((avatar) => avatar.key === auth.selectedAvatar) ? auth.selectedAvatar : "clancy";
        await syncStateToCloud();
        renderAccountState();
        break;
      case "sign-out":
        await signOut();
        break;
      case "back-cover":
        goToCover();
        break;
      case "prev-chapter":
        goToReader(Number(trigger.dataset.chapterTarget), { resetScroll: true });
        break;
      case "next-chapter":
        if (Number(trigger.dataset.chapterTarget) >= 0) {
          goToReader(Number(trigger.dataset.chapterTarget), { resetScroll: true });
        }
        break;
      case "complete-chapter":
        completeChapter(Number(trigger.dataset.chapter));
        break;
      case "toggle-bookmark": {
        const index = Number(trigger.dataset.chapter);
        const chapter = window.CHAPTERS[index];
        if (!chapter) break;
        const position = state.bookmarks.indexOf(chapter.id);
        if (position >= 0) state.bookmarks.splice(position, 1);
        else state.bookmarks.push(chapter.id);
        saveState();
        renderChapter(index);
        break;
      }
      case "save-chapter-quote":
        saveChapterQuote(Number(trigger.dataset.chapter));
        break;
      case "scroll-reader-content": {
        const target = $("#reader-content-start");
        if (target) {
          target.scrollIntoView({ behavior: motionIsReduced() ? "auto" : "smooth", block: "start" });
          target.focus({ preventScroll: true });
        }
        break;
      }
      case "switch-part": {
        const part = Number(trigger.dataset.part);
        if (!PARTS[part]) break;
        if (!partIsUnlocked(part)) {
          showProgressionNotice(partLockReason(part));
          break;
        }
        state.activePart = part;
        state.activeArc = 0;
        preparePartBackdrop(part);
        updatePartPresentation();
        renderTOC();
        document.title = `Índice · ${PARTS[part].indexTitle} — Sahlo Folina`;
        saveState();
        writeRoute(routeToPart(part, state.activeArc), { replace: true });
        break;
      }
      case "switch-part5-section": {
        const section = Number(trigger.dataset.section);
        if (state.activePart !== 5 || !PART5_SECTIONS[String(section)]) break;
        if (!partFiveSectionIsUnlocked(section)) {
          showProgressionNotice(sectionLockReason(section));
          break;
        }
        state.activeArc = section;
        updatePartPresentation();
        renderTOC();
        document.title = `Índice · ${PART5_SECTIONS[String(section)].title} — Sahlo Folina`;
        saveState();
        writeRoute(routeToPart(5, section), { replace: true });
        break;
      }
      case "open-chapter":
        goToReader(Number(trigger.dataset.chapter));
        break;
      case "toggle-progression-panel": {
        const panel = $("#progression-panel");
        if (!panel) break;
        panel.hidden = !panel.hidden;
        trigger.setAttribute("aria-expanded", String(!panel.hidden));
        if (!panel.hidden) {
          renderProgressionPanel();
          panel.scrollIntoView({ behavior: motionIsReduced() ? "auto" : "smooth", block: "start" });
        }
        break;
      }
      case "mark-current-scope-read":
        markCurrentScopeRead();
        break;
      case "journal-entry":
        openJournalViewer(Number(trigger.dataset.journalIndex), trigger);
        break;
      case "journal-prev":
        showJournalSlide(journalViewerIndex - 1, -1);
        break;
      case "journal-next":
        showJournalSlide(journalViewerIndex + 1, 1);
        break;
      case "journal-goto": {
        const nextIndex = Number(trigger.dataset.journalIndex);
        showJournalSlide(nextIndex, nextIndex >= journalViewerIndex ? 1 : -1);
        break;
      }
      case "journal-close":
        closeJournalViewer();
        break;
      case "confirm-free-reading":
        confirmFreeReadingMode();
        break;
      case "cancel-free-reading":
        closeFreeReadingWarning();
        break;
      case "toggle-settings":
        $("#settings-drawer").hidden ? openDrawer(trigger) : closeDrawer();
        break;
      case "reset-progress":
        if (window.confirm("¿Quieres borrar todo tu progreso de lectura?")) {
          state.lastChapter = 0;
          state.lastNarrativeChapter = 0;
          state.activePart = 1;
          state.activeArc = 0;
          state.hasStarted = false;
          state.readChapters = [];
          state.chapterProgress = {};
          state.achievementSeen = [];
          saveState();
          refreshProgressionUI();
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
      if (key === "voices" && document.body.dataset.view === "reader") {
        const scrollY = window.scrollY;
        renderChapter(state.lastChapter);
        window.scrollTo(0, scrollY);
      }
      requestAnimationFrame(updateReadingProgress);
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-progression-mode]");
      if (!button) return;
      requestProgressionMode(button.dataset.progressionMode, button);
    });

    $("#account-auth-form")?.addEventListener("submit", submitAuthForm);
    $("#avatar-options")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-avatar-key]");
      if (!button || !AVATARS.some((avatar) => avatar.key === button.dataset.avatarKey)) return;
      auth.selectedAvatar = button.dataset.avatarKey;
      renderAvatarOptions();
      renderAccountTriggers();
      if (auth.user) queueCloudSync();
    });
    $("#account-backdrop")?.addEventListener("click", closeAccountDialog);

    $("#overlay").addEventListener("click", () => closeDrawer());
    document.addEventListener("keydown", (event) => {
      const freeWarning = $("#free-reading-warning");
      if (freeWarning && !freeWarning.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeFreeReadingWarning();
          return;
        }
      }
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
      const journalDialog = $("#journal-viewer");
      if (journalDialog && !journalDialog.hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeJournalViewer();
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showJournalSlide(journalViewerIndex - 1, -1);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          showJournalSlide(journalViewerIndex + 1, 1);
          return;
        }
        if (event.key === "Tab") {
          const focusable = $$('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])', journalDialog)
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
      if (event.key === "Escape" && $("#account-dialog") && !$("#account-dialog").hidden) closeAccountDialog();
    });
    window.addEventListener("scroll", scheduleReadingProgress, { passive: true });
    window.addEventListener("resize", scheduleReadingProgress, { passive: true });
    window.addEventListener("popstate", () => applyRouteFromLocation());
  }

  function registerServiceWorker() {
    if (window.Capacitor?.isNativePlatform?.()) return;
    if (!("serviceWorker" in navigator)) return;
    const secureContext = location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    if (!secureContext) return;
    const register = () => navigator.serviceWorker
      .register("./sw.js?v=20260809-account-cache-v8", { updateViaCache: "none" })
      .then((registration) => registration.update().catch(() => registration))
      .catch((error) => console.warn("No se pudo registrar la caché offline.", error));
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(register, { timeout: 3000 });
    } else {
      window.setTimeout(register, 1200);
    }
  }

  function setupNativeIntegration() {
    const plugins = window.Capacitor?.Plugins;
    if (!plugins) return;
    document.body.classList.add("capacitor-native");
    plugins.StatusBar?.setBackgroundColor?.({ color: "#02040a" }).catch(() => {});
    plugins.StatusBar?.setStyle?.({ style: "LIGHT" }).catch(() => {});
    plugins.App?.addListener?.("backButton", () => {
      const journal = $("#journal-viewer");
      if (journal && !journal.hidden) {
        closeJournalViewer();
        return;
      }
      if (!$("#settings-drawer").hidden) {
        closeDrawer();
        return;
      }
      if ($("#account-dialog") && !$("#account-dialog").hidden) {
        closeAccountDialog();
        return;
      }
      const view = document.body.dataset.view;
      if (view === "reader") {
        goToTOC();
      } else if (view && view !== "cover") {
        goToCover();
      } else {
        plugins.App.exitApp?.();
      }
    });
  }

  async function init() {
    if (!Array.isArray(window.CHAPTERS) || !window.CHAPTERS.length) {
      console.error("No se encontraron capítulos.");
      return;
    }
    await hydrateNativeState();
    loadState();
    syncAchievementSeen();
    applySettings();
    updatePartPresentation();
    renderTOC();
    updateCover();
    renderProgressionPanel();
    bindEvents();
    await initializeAuth();
    setupNativeIntegration();
    applyRouteFromLocation({ initial: true });
    warmIndexBackdrops();
    requestAnimationFrame(maybeShowDisclaimer);
    window.addEventListener("load", registerServiceWorker, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
