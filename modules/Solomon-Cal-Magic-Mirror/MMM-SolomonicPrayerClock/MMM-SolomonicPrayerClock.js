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
    rotationIntervalSeconds: null
  },

  requiresVersion: "2.18.0",

  start() {
    this.loaded = false;
    this.error = null;
    this.payload = null;
    this.rotationIndex = 0;
    this.rotationTimer = null;
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
        this.ensureRotationInterval();
        this.updateDom();
        break;
      case "SPC_ERROR":
        this.loaded = false;
        this.error = payload;
        this.updateDom();
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
    const psalmLine = this.renderAttributeLine(
      "Psalms",
      Array.isArray(day.psalms) ? day.psalms.join(", ") : null
    );
    const focusLine = this.renderAttributeLine(
      "Focus Areas",
      Array.isArray(day.focusAreas) ? day.focusAreas.join(", ") : null
    );

    const verse = document.createElement("div");
    verse.className = "spc-verse";
    verse.innerHTML = `<span class="ref">${day.dayVerse.ref}</span> – ${day.dayVerse.snippet}`;

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
    if (psalmLine) {
      container.appendChild(psalmLine);
    }
    if (focusLine) {
      container.appendChild(focusLine);
    }
    container.appendChild(verse);

    const dayProverb = this.normaliseCitation(day.proverb, "Proverb");
    if (dayProverb && dayProverb.snippet) {
      const proverb = document.createElement("div");
      proverb.className = "spc-verse spc-proverb";
      proverb.innerHTML = `<span class="ref">${dayProverb.ref}</span> – ${dayProverb.snippet}`;
      container.appendChild(proverb);
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

    const verse = document.createElement("div");
    verse.className = "spc-verse";
    verse.innerHTML = `<span class="ref">${hour.verse.ref}</span> – ${hour.verse.snippet}`;

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
    container.appendChild(verse);

    const hourProverb = this.normaliseCitation(hour.proverb, "Proverb");
    if (hourProverb && hourProverb.snippet) {
      const proverb = document.createElement("div");
      proverb.className = "spc-verse spc-proverb";
      proverb.innerHTML = `<span class="ref">${hourProverb.ref}</span> – ${hourProverb.snippet}`;
      container.appendChild(proverb);
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
        snippet: entry
      };
    }
    return {
      ref: entry.ref || fallbackRef || "",
      snippet: entry.snippet || ""
    };
  }
});
