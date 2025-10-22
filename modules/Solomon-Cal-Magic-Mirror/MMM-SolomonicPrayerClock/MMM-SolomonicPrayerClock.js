/* Magic Mirror
 * Module: MMM-SolomonicPrayerClock
 */

Module.register("MMM-SolomonicPrayerClock", {
  defaults: {
    latitude: 29.7604,
    longitude: -95.3698,
    theme: "expanded",
    showSigils: true,
    showUpcoming: true,
    psalmDisplayMode: "cycle",
    focusAreas: ["wisdom", "wealth", "health", "influence"],
    locale: "en",
    updateInterval: 60 * 1000,
    rotationInterval: 10 * 1000,
    rotationIntervalSeconds: null,
    verseServiceUrl: null,
    verseTranslation: "KJV"
  },

  requiresVersion: "2.18.0",

  start() {
    this.loaded = false;
    this.error = null;
    this.payload = null;
    this.rotationIndex = 0;
    this.rotationTimer = null;
    this.modalRoot = null;
    this.modalBackdrop = null;
    this.modalContent = null;
    this.modalTitle = null;
    this.modalBody = null;
    this.modalTranslation = null;
    this.activeChapterRequests = {};
    this.serviceUrl = this.config.verseServiceUrl || null;
    this.serviceTranslation = this.config.verseTranslation || "KJV";
    this.views = ["day", "current"];
    if (this.config.showUpcoming) {
      this.views.push("next");
    }

    this.sendSocketNotification("SPC_CONFIG", {
      config: this.config
    });
  },

  getStyles() {
    return ["assets/styles.css"];
  },

  socketNotificationReceived(notification, payload) {
    switch (notification) {
      case "SPC_DATA":
        this.loaded = true;
        this.error = null;
        this.payload = payload;
        if (payload.verseServiceUrl) {
          this.serviceUrl = payload.verseServiceUrl;
          this.config.verseServiceUrl = payload.verseServiceUrl;
        }
        if (payload.verseTranslation) {
          this.serviceTranslation = payload.verseTranslation;
          this.config.verseTranslation = payload.verseTranslation;
        }
        this.ensureRotationInterval();
        this.updateDom();
        break;
      case "SPC_ERROR":
        this.loaded = false;
        this.error = payload;
        this.updateDom();
        break;
      case "SPC_CHAPTER_RESULT":
        this.handleChapterResult(payload);
        break;
      default:
        break;
    }
  },

  ensureRotationInterval() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    const interval = this.getRotationInterval();
    this.rotationTimer = setInterval(() => {
      this.rotationIndex = (this.rotationIndex + 1) % this.views.length;
      this.updateDom();
    }, interval);
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "spc-wrapper";

    if (this.error) {
      wrapper.classList.add("spc-error");
      wrapper.innerHTML = `⚠️ ${this.error.message || this.error}`;
      return wrapper;
    }

    if (!this.loaded || !this.payload) {
      wrapper.classList.add("dimmed", "light");
      wrapper.innerHTML = "Loading Solomonic Prayer Clock…";
      return wrapper;
    }

    const view = this.views[this.rotationIndex] || "day";

    if (view === "day") {
      const node = this.renderDayView();
      if (node) {
        wrapper.appendChild(node);
      }
    } else if (view === "current") {
      const node = this.renderHourView(this.payload.currentHour, "Current Hour");
      if (node) {
        wrapper.appendChild(node);
      }
    } else if (view === "next" && this.payload.nextHour) {
      const node = this.renderHourView(this.payload.nextHour, "Upcoming Hour");
      if (node) {
        wrapper.appendChild(node);
      }
    }

    return wrapper;
  },

  renderDayView() {
    const day = this.payload.dayInfo;
    if (!day) {
      return null;
    }
    const container = document.createElement("div");
    container.className = "spc-day-view";
    const planetDetails = day.planetDetails || {};

    const header = document.createElement("div");
    header.className = "spc-day-header bright";
    header.innerHTML = `${day.emoji || ""} ${day.dayName} (${day.planetLabel}) – ${day.theme}`;

    const angelLine = document.createElement("div");
    angelLine.className = "spc-line";
    angelLine.innerHTML = `<span class="label">Angel:</span> ${day.angel}`;

    const divineLine = document.createElement("div");
    divineLine.className = "spc-line";
    divineLine.innerHTML = `<span class="label">Divine Name:</span> ${day.divineName}`;

    const colorLine = this.renderAttributeLine("Color", day.color);
    const incenseLine = this.renderAttributeLine("Incense", day.incense);
    const keywordsLine = this.renderAttributeLine(
      "Keywords",
      Array.isArray(day.keywords) ? day.keywords.join(", ") : null
    );
    const metalLine = this.renderAttributeLine("Metal", planetDetails.metal);
    const stoneLine = this.renderAttributeLine("Stone", planetDetails.stone);
    const seasonalLine = this.renderAttributeLine("Seasonal Focus", planetDetails.seasonalFocus);
    const focusLine = this.renderAttributeLine(
      "Focus Areas",
      Array.isArray(day.focusAreas) ? day.focusAreas.join(", ") : null
    );
    const psalmGroup = this.renderCitationList("Psalms", day.psalms);

    container.appendChild(header);
    container.appendChild(angelLine);
    container.appendChild(divineLine);
    if (colorLine) {
      container.appendChild(colorLine);
    }
    if (incenseLine) {
      container.appendChild(incenseLine);
    }
    if (keywordsLine) {
      container.appendChild(keywordsLine);
    }
    if (metalLine) {
      container.appendChild(metalLine);
    }
    if (stoneLine) {
      container.appendChild(stoneLine);
    }
    if (seasonalLine) {
      container.appendChild(seasonalLine);
    }
    if (psalmGroup) {
      container.appendChild(psalmGroup);
    }
    if (focusLine) {
      container.appendChild(focusLine);
    }
    const dayVerseNode = this.createCitationElement(
      this.normaliseCitation(day.dayVerse, "Day Verse"),
      "spc-verse"
    );
    if (dayVerseNode) {
      container.appendChild(dayVerseNode);
    }

    const dayProverbNode = this.createCitationElement(
      this.normaliseCitation(day.proverb, "Proverb"),
      "spc-verse spc-proverb"
    );
    if (dayProverbNode) {
      container.appendChild(dayProverbNode);
    }

    if (this.config.showSigils) {
      const sigilNode = this.renderSigil(day.sigil, day.angel);
      if (sigilNode) {
        container.appendChild(sigilNode);
      }
    }

    return container;
  },

  renderHourView(hour, title) {
    if (!hour) {
      return null;
    }
    const container = document.createElement("div");
    container.className = "spc-hour-view";

    const header = document.createElement("div");
    header.className = "spc-hour-header bright";
    header.innerHTML = `${title}: ${hour.indexLabel} – ${hour.planetLabel}`;

    const angelLine = document.createElement("div");
    angelLine.className = "spc-line";
    angelLine.innerHTML = `<span class="label">Angel:</span> ${hour.angel}`;

    const timeLine = document.createElement("div");
    timeLine.className = "spc-line";
    const start = this.formatTime(hour.start);
    const end = this.formatTime(hour.end);
    timeLine.innerHTML = `<span class="label">Window:</span> ${start} – ${end}`;

    const focusLine = document.createElement("div");
    focusLine.className = "spc-line";
    focusLine.innerHTML = `<span class="label">Focus:</span> ${hour.focusAreaLabel}`;

    const planetDetails = hour.planetDetails || {};
    const incenseLine = this.renderAttributeLine("Incense", planetDetails.incense);
    const keywordsLine = this.renderAttributeLine(
      "Keywords",
      Array.isArray(planetDetails.keywords) ? planetDetails.keywords.join(", ") : null
    );
    const intelligenceLine = this.renderAttributeLine("Intelligence", planetDetails.intelligence);
    const spiritLine = this.renderAttributeLine("Spirit", planetDetails.spirit);

    container.appendChild(header);
    container.appendChild(angelLine);
    container.appendChild(timeLine);
    container.appendChild(focusLine);
    if (incenseLine) {
      container.appendChild(incenseLine);
    }
    if (keywordsLine) {
      container.appendChild(keywordsLine);
    }
    if (intelligenceLine) {
      container.appendChild(intelligenceLine);
    }
    if (spiritLine) {
      container.appendChild(spiritLine);
    }
    const hourVerseNode = this.createCitationElement(
      this.normaliseCitation(hour.verse, "Verse"),
      "spc-verse"
    );
    if (hourVerseNode) {
      container.appendChild(hourVerseNode);
    }

    const hourProverbNode = this.createCitationElement(
      this.normaliseCitation(hour.proverb, "Proverb"),
      "spc-verse spc-proverb"
    );
    if (hourProverbNode) {
      container.appendChild(hourProverbNode);
    }

    if (hour.declaration) {
      const declaration = document.createElement("div");
      declaration.className = "spc-declaration";
      declaration.textContent = hour.declaration;
      container.appendChild(declaration);
    }

    if (this.config.showSigils) {
      const sigilNode = this.renderSigil(hour.sigil, hour.angel);
      if (sigilNode) {
        container.appendChild(sigilNode);
      }
    }

    return container;
  },

  formatTime(value) {
    try {
      const date = typeof value === "string" ? new Date(value) : value;
      return Intl.DateTimeFormat(this.config.locale || "en", {
        hour: "numeric",
        minute: "2-digit"
      }).format(date);
    } catch (_error) {
      return "";
    }
  },

  renderAttributeLine(label, value) {
    if (!value) {
      return null;
    }
    const line = document.createElement("div");
    line.className = "spc-line";
    line.innerHTML = `<span class="label">${label}:</span> ${value}`;
    return line;
  },

  renderCitationList(label, items) {
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "spc-citation-group";

    const header = document.createElement("div");
    header.className = "spc-line";
    header.innerHTML = `<span class="label">${label}:</span>`;
    wrapper.appendChild(header);

    items.forEach((item) => {
      const normalized = this.normaliseCitation(item, label);
      if (!normalized || !normalized.snippet) {
        return;
      }
      const entry = this.createCitationElement(normalized, "spc-verse spc-citation");
      if (entry) {
        wrapper.appendChild(entry);
      }
    });

    if (wrapper.children.length <= 1) {
      return null;
    }

    return wrapper;
  },

  createCitationElement(citation, className) {
    if (!citation || !citation.snippet) {
      return null;
    }
    const container = document.createElement("div");
    container.className = className || "spc-verse";

    const ref = document.createElement("span");
    ref.className = "ref";
    ref.textContent = citation.ref || "";

    const snippet = document.createElement("span");
    snippet.className = "spc-citation-snippet";
    snippet.textContent = citation.snippet;

    if (this.canRequestChapter(citation)) {
      container.classList.add("spc-citation-clickable");
      container.setAttribute("role", "button");
      container.setAttribute("tabindex", "0");
      container.addEventListener("click", () => this.openChapterModal(citation));
      container.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.openChapterModal(citation);
        }
      });
    }

    container.appendChild(ref);
    container.appendChild(document.createTextNode(" – "));
    container.appendChild(snippet);
    return container;
  },

  renderSigil(sigil, fallbackAlt) {
    if (!sigil || !sigil.path) {
      return null;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "spc-sigil";

    const img = document.createElement("img");
    img.src = this.file(sigil.path);
    img.alt = sigil.alt || `${fallbackAlt || "Angel"} sigil`;
    wrapper.appendChild(img);

    if (sigil.notes || sigil.source) {
      const caption = document.createElement("div");
      caption.className = "spc-sigil-caption";
      caption.innerHTML = [
        sigil.notes ? `<div>${sigil.notes}</div>` : "",
        sigil.source ? `<div class="dimmed">${sigil.source}</div>` : ""
      ]
        .filter(Boolean)
        .join("");
      wrapper.appendChild(caption);
    }

    return wrapper;
  },

  getRotationInterval() {
    const seconds = Number(this.config.rotationIntervalSeconds);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.max(seconds * 1000, 5000);
    }
    const interval = Number(this.config.rotationInterval);
    if (!Number.isNaN(interval) && interval > 0) {
      return Math.max(interval, 5000);
    }
    return 10 * 1000;
  },

  normaliseCitation(entry, fallbackRef) {
    if (!entry) {
      return null;
    }
    if (typeof entry === "string") {
      return {
        ref: fallbackRef || "",
        snippet: entry,
        request: null
      };
    }
    return {
      ref: entry.reference || entry.ref || fallbackRef || "",
      snippet: entry.text || entry.snippet || "",
      request: entry.request || null
    };
  },

  canRequestChapter(citation) {
    const request = citation?.request;
    return (
      !!this.serviceUrl &&
      request &&
      request.book &&
      request.chapter
    );
  },

  openChapterModal(citation) {
    if (!this.canRequestChapter(citation)) {
      return;
    }

    const request = citation.request;
    const chapterRequest = {
      book: request.book,
      chapter: request.chapter,
      translation: request.translation || this.serviceTranslation || "KJV"
    };

    this.activeChapterRequests = {};
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.activeChapterRequests[requestId] = {
      reference: citation.ref || `${chapterRequest.book} ${chapterRequest.chapter}`
    };

    this.showChapterModal({
      reference: citation.ref,
      translation: chapterRequest.translation,
      text: "Loading chapter…",
      loading: true
    });

    this.sendSocketNotification("SPC_FETCH_CHAPTER", {
      requestId,
      request: chapterRequest
    });
  },

  ensureModal() {
    if (this.modalRoot) {
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal fade spc-modal";
    modal.tabIndex = -1;

    const dialog = document.createElement("div");
    dialog.className = "modal-dialog modal-lg modal-dialog-centered";

    const content = document.createElement("div");
    content.className = "modal-content";

    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("h5");
    title.className = "modal-title";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn-close";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.addEventListener("click", () => this.closeChapterModal());

    header.appendChild(title);
    header.appendChild(closeButton);

    const body = document.createElement("div");
    body.className = "modal-body";

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const translation = document.createElement("small");
    translation.className = "text-muted";
    footer.appendChild(translation);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade spc-modal-backdrop";
    document.body.appendChild(backdrop);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        this.closeChapterModal();
      }
    });

    this.modalRoot = modal;
    this.modalBackdrop = backdrop;
    this.modalContent = content;
    this.modalTitle = title;
    this.modalBody = body;
    this.modalTranslation = translation;
  },

  showChapterModal({ reference, text, translation, error, loading }) {
    this.ensureModal();
    if (!this.modalRoot) {
      return;
    }

    this.modalRoot.style.display = "block";
    this.modalRoot.classList.add("show");
    if (this.modalBackdrop) {
      this.modalBackdrop.style.display = "block";
      this.modalBackdrop.classList.add("show");
    }
    document.body.classList.add("modal-open");

    const titleText = reference || "Chapter";
    this.modalTitle.textContent = titleText;
    const resolvedTranslation = translation || this.serviceTranslation;
    this.modalTranslation.textContent = resolvedTranslation ? `Translation: ${resolvedTranslation}` : "";

    this.modalBody.textContent = "";
    if (error) {
      const errorNode = document.createElement("div");
      errorNode.className = "spc-modal-error";
      errorNode.textContent = error;
      this.modalBody.appendChild(errorNode);
      return;
    }

    if (loading) {
      const loadingNode = document.createElement("div");
      loadingNode.className = "spc-modal-loading";
      loadingNode.textContent = text || "Loading…";
      this.modalBody.appendChild(loadingNode);
      return;
    }

    const formatted = this.formatChapterText(text);
    formatted.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      this.modalBody.appendChild(p);
    });
  },

  closeChapterModal() {
    if (this.modalRoot) {
      this.modalRoot.classList.remove("show");
      this.modalRoot.style.display = "none";
    }
    if (this.modalBackdrop) {
      this.modalBackdrop.classList.remove("show");
      this.modalBackdrop.style.display = "none";
    }
    document.body.classList.remove("modal-open");
    this.activeChapterRequests = {};
  },

  handleChapterResult(payload) {
    const requestId = payload?.requestId;
    if (!requestId || !this.activeChapterRequests[requestId]) {
      return;
    }
    const pending = this.activeChapterRequests[requestId];
    delete this.activeChapterRequests[requestId];

    if (payload?.error) {
      this.showChapterModal({
        reference: pending.reference,
        error: payload.error,
        translation: this.serviceTranslation
      });
      return;
    }

    this.showChapterModal({
      reference: payload.reference || pending.reference,
      translation: payload.translation,
      text: payload.text
    });
  },

  formatChapterText(text) {
    if (!text) {
      return ["No text available."];
    }
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
});
