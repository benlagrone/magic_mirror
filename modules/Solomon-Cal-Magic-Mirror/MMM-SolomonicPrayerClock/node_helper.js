const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

const { calculatePlanetaryHours } = require("./utils/planetaryHours");
const { getDayData, getPlanetInfo, getWeekdayManifest } = require("./calendar");
const { getVerseForFocus } = require("./psalms");
const { isWithin } = require("./utils/timeHelpers");
const focusCollections = require("./data/focus_area_collections.json");
const rawSigilManifest = require("./data/sigil_manifest.json");

const DEFAULT_VERSE_SERVICE_URL = "http://192.168.86.23:8001/get-verse";

let fetchImpl = typeof fetch === "function" ? fetch.bind(global) : null;

async function fetchWithFallback(url, options) {
  if (!fetchImpl) {
    const module = await import("node-fetch");
    fetchImpl = module.default;
  }
  return fetchImpl(url, options);
}

function parseVerseResponse(raw) {
  try {
    let data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    return data;
  } catch (error) {
    throw new Error(`Unable to parse verse response: ${error.message}`);
  }
}

function sanitizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = NodeHelper.create({
  start() {
    this.config = null;
    this.focusMapping = {};
    this.focusCounters = {};
    this.lastBroadcastHourIndex = null;
    this.updateTimer = null;
    this.focusCollections = focusCollections || {};
    this.sigilManifest = rawSigilManifest || {};
    this.sigilManifestByFile = {};
    this.sigilManifestByAngel = {};
    this.verseCache = new Map();
    Object.keys(this.sigilManifest).forEach((key) => {
      const entry = this.sigilManifest[key];
      if (!entry) {
        return;
      }
      const fileKey = (entry.file || "").toLowerCase();
      if (fileKey) {
        this.sigilManifestByFile[fileKey] = entry;
      }
      const angelKey = (entry.angel || key || "").toLowerCase();
      if (angelKey) {
        this.sigilManifestByAngel[angelKey] = entry;
      }
    });
  },

  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SPC_CONFIG") {
      this.config = payload.config || {};
      this.applyDefaults();
      this.loadFocusMapping()
        .then(() => {
          this.broadcastData(true);
          this.scheduleUpdates();
        })
        .catch((error) => {
          this.sendError(`Failed to load focus mapping: ${error.message}`);
        });
    }
  },

  applyDefaults() {
    if (!Array.isArray(this.config.focusAreas) || this.config.focusAreas.length === 0) {
      this.config.focusAreas = ["wisdom", "wealth", "health", "influence"];
    }
    this.config.updateInterval = Math.max(Number(this.config.updateInterval) || 60 * 1000, 30 * 1000);
    this.config.psalmDisplayMode = this.config.psalmDisplayMode || "cycle";
    this.latitude = Number(this.config.latitude);
    this.longitude = Number(this.config.longitude);
    this.verseServiceUrl =
      typeof this.config.verseServiceUrl === "string" && this.config.verseServiceUrl.trim().length > 0
        ? this.config.verseServiceUrl.trim()
        : DEFAULT_VERSE_SERVICE_URL;
    this.verseTranslation =
      this.config.verseTranslation || this.config.translation || "KJV";
    this.config.translation = this.verseTranslation;
  },

  async loadFocusMapping() {
    const focusPath = path.resolve(__dirname, "solomonic_focus_mapping.json");
    const raw = await fs.promises.readFile(focusPath, "utf8");
    this.focusMapping = JSON.parse(raw);
    this.focusCounters = Object.keys(this.focusMapping || {}).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
  },

  scheduleUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.updateTimer = setInterval(() => this.broadcastData(false), this.config.updateInterval);
  },

  async broadcastData(initial) {
    try {
      const payload = await this.buildPayload(initial);
      this.sendSocketNotification("SPC_DATA", payload);
    } catch (error) {
      this.sendError(error.message || error.toString());
    }
  },

  async buildPayload(initial) {
    const now = new Date();
    const rawDayInfo = getDayData(now);
    if (!rawDayInfo) {
      throw new Error("Unable to determine Solomonic day data for current date.");
    }
    const dayInfo = { ...rawDayInfo };

    const hours = calculatePlanetaryHours(now, this.latitude, this.longitude, dayInfo.planetKey);
    if (!hours.length) {
      throw new Error("Unable to calculate planetary hours.");
    }

    const currentIndex = hours.findIndex((hour) => isWithin(now, hour.start, hour.end));
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;
    const currentHour = hours[activeIndex];
    const nextHour = hours[(activeIndex + 1) % hours.length];

    const focusAreas = this.config.focusAreas;
    const isNewHour = initial || this.lastBroadcastHourIndex !== currentHour.index;
    if (isNewHour) {
      this.lastBroadcastHourIndex = currentHour.index;
    }

    const [decoratedCurrent, decoratedNext, dayVerse, dayProverb] = await Promise.all([
      this.decorateHour(currentHour, focusAreas, isNewHour),
      this.decorateHour(nextHour, focusAreas, false),
      this.fetchCitation(dayInfo.dayVerse, dayInfo.dayVerse?.reference || "Day Verse"),
      this.fetchCitation(dayInfo.proverb, dayInfo.proverb?.reference || "Proverb")
    ]);

    dayInfo.dayVerse = dayVerse || null;
    if (dayProverb) {
      dayInfo.proverb = dayProverb;
    } else {
      delete dayInfo.proverb;
    }

    return {
      generatedAt: now,
      sunrise: hours[0]?.start,
      sunset: hours[12]?.start,
      dayInfo: {
        ...dayInfo,
        planetLabel: dayInfo.planetLabel || getPlanetInfo(dayInfo.planetKey)?.label || "",
        planetDetails: getPlanetInfo(dayInfo.planetKey),
        sigil: this.resolveSigilMeta(dayInfo.sigil, dayInfo.angel)
      },
      currentHour: decoratedCurrent,
      nextHour: decoratedNext,
      resources: {
        focusCollections: this.focusCollections,
        weekdayManifest: getWeekdayManifest()
      }
    };
  },

  async decorateHour(hour, focusAreas, advanceCounter) {
    const focusArea =
      focusAreas.length > 0 ? focusAreas[(hour.index - 1) % focusAreas.length] : "wisdom";
    const normalizedFocus = String(focusArea);
    const displayFocus = normalizedFocus.charAt(0).toUpperCase() + normalizedFocus.slice(1);

    const counter = this.focusCounters[normalizedFocus] || 0;
    const verseEntry = getVerseForFocus(this.focusMapping, normalizedFocus, {
      mode: this.config.psalmDisplayMode,
      index: counter
    });
    const verse =
      verseEntry && typeof verseEntry === "object"
        ? await this.fetchCitation(
            verseEntry,
            verseEntry.reference || verseEntry.ref || `${displayFocus} Verse`
          )
        : null;

    if (advanceCounter && this.config.psalmDisplayMode === "cycle") {
      const poolLength = this.focusMapping?.[normalizedFocus]?.length || 1;
      this.focusCounters[normalizedFocus] = (counter + 1) % poolLength;
    }

    const planetDetails = getPlanetInfo(hour.planetKey) || {};
    const sigil = this.resolveSigilMeta(hour.sigil || planetDetails.sigil, hour.angel);
    const focusPack = this.focusCollections[normalizedFocus] || {};
    const proverbEntry = this.pickFromCollection(
      focusPack.proverbs || [],
      counter,
      this.config.psalmDisplayMode
    );
    const proverb = await this.fetchCitation(
      proverbEntry,
      (proverbEntry && (proverbEntry.reference || proverbEntry.ref)) || "Proverb"
    );
    const declaration = this.pickFromCollection(
      focusPack.declarations || [],
      counter,
      this.config.psalmDisplayMode
    );

    return {
      ...hour,
      focusArea: normalizedFocus,
      focusAreaLabel: displayFocus,
      verse,
      planetDetails,
      sigil,
      proverb,
      declaration
    };
  },

  pickFromCollection(collection, counter, mode) {
    if (!Array.isArray(collection) || collection.length === 0) {
      return null;
    }
    if (mode === "random") {
      const randomIndex = Math.floor(Math.random() * collection.length);
      return collection[randomIndex] || null;
    }
    const index = counter % collection.length;
    return collection[index] || null;
  },

  async fetchCitation(citation, fallbackReference) {
    if (!citation) {
      return null;
    }

    if (typeof citation === "string") {
      return {
        reference: fallbackReference || "",
        text: sanitizeText(citation)
      };
    }

    if (citation.text || citation.snippet) {
      return {
        reference: citation.reference || citation.ref || fallbackReference || "",
        text: sanitizeText(citation.text || citation.snippet)
      };
    }

    const request = citation.request || citation;
    if (!request || !request.book || !request.chapter || !request.verse) {
      return {
        reference: citation.reference || citation.ref || fallbackReference || "",
        text: ""
      };
    }

    const normalizedRequest = {
      book: String(request.book).trim(),
      chapter: String(request.chapter).trim(),
      verse: String(request.verse).trim(),
      translation: request.translation || this.verseTranslation || "KJV"
    };

    const cacheKey = JSON.stringify(normalizedRequest);
    if (this.verseCache.has(cacheKey)) {
      const cached = this.verseCache.get(cacheKey);
      return {
        reference: citation.reference || citation.ref || cached.reference || fallbackReference || "",
        text: cached.text
      };
    }

    try {
      const response = await fetchWithFallback(this.verseServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(normalizedRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const raw = await response.text();
      const payload = parseVerseResponse(raw);
      const combinedText = sanitizeText(
        payload?.text ||
          (Array.isArray(payload?.verses)
            ? payload.verses.map((entry) => entry.text || "").join(" ")
            : "")
      );
      const textContent = combinedText.length > 0 ? combinedText : "[Verse unavailable]";

      const reference =
        citation.reference ||
        citation.ref ||
        payload?.reference ||
        fallbackReference ||
        `${normalizedRequest.book} ${normalizedRequest.chapter}:${normalizedRequest.verse}`;

      const result = {
        reference,
        text: textContent
      };

      this.verseCache.set(cacheKey, result);
      return { ...result };
    } catch (error) {
      console.error(
        `[MMM-SolomonicPrayerClock] Verse fetch failed (${normalizedRequest.book} ${normalizedRequest.chapter}:${normalizedRequest.verse}): ${error.message}`
      );
      return {
        reference:
          citation.reference ||
          citation.ref ||
          fallbackReference ||
          `${normalizedRequest.book} ${normalizedRequest.chapter}:${normalizedRequest.verse}`,
        text: "[Verse unavailable]"
      };
    }
  },

  resolveSigilMeta(sigilFile, angelName) {
    const normalizedFile = (sigilFile || "").toLowerCase();
    const normalizedAngel = (angelName || "").toLowerCase();
    const manifestEntry =
      this.sigilManifestByFile[normalizedFile] ||
      this.sigilManifestByAngel[normalizedAngel] ||
      null;

    const fileName =
      manifestEntry?.file ||
      sigilFile ||
      (normalizedAngel ? `${normalizedAngel}.png` : null);

    if (!fileName) {
      return null;
    }

    const relative = path.join("assets", "sigils", fileName);
    const absolute = path.join(__dirname, relative);
    if (!fs.existsSync(absolute)) {
      return null;
    }

    return {
      path: relative,
      alt: manifestEntry?.alt || `${angelName || "Angel"} sigil`,
      notes: manifestEntry?.notes || null,
      source: manifestEntry?.source || null
    };
  },

  sendError(message) {
    this.sendSocketNotification("SPC_ERROR", { message });
  }
});
