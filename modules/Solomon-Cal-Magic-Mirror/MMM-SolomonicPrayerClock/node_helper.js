const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

const { calculatePlanetaryHours } = require("./utils/planetaryHours");
const { getDayData, getPlanetInfo, getWeekdayManifest } = require("./calendar");
const { getVerseForFocus } = require("./psalms");
const { isWithin } = require("./utils/timeHelpers");
const focusCollections = require("./data/focus_area_collections.json");
const rawSigilManifest = require("./data/sigil_manifest.json");

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

  broadcastData(initial) {
    try {
      const payload = this.buildPayload(initial);
      this.sendSocketNotification("SPC_DATA", payload);
    } catch (error) {
      this.sendError(error.message || error.toString());
    }
  },

  buildPayload(initial) {
    const now = new Date();
    const dayInfo = getDayData(now);
    if (!dayInfo) {
      throw new Error("Unable to determine Solomonic day data for current date.");
    }

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

    const decoratedCurrent = this.decorateHour(currentHour, focusAreas, isNewHour);
    const decoratedNext = this.decorateHour(nextHour, focusAreas, false);

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

  decorateHour(hour, focusAreas, advanceCounter) {
    const focusArea =
      focusAreas.length > 0 ? focusAreas[(hour.index - 1) % focusAreas.length] : "wisdom";
    const normalizedFocus = String(focusArea);
    const displayFocus = normalizedFocus.charAt(0).toUpperCase() + normalizedFocus.slice(1);

    const counter = this.focusCounters[normalizedFocus] || 0;
    const verse = getVerseForFocus(this.focusMapping, normalizedFocus, {
      mode: this.config.psalmDisplayMode,
      index: counter
    });

    if (advanceCounter && this.config.psalmDisplayMode === "cycle") {
      const poolLength = this.focusMapping?.[normalizedFocus]?.length || 1;
      this.focusCounters[normalizedFocus] = (counter + 1) % poolLength;
    }

    const planetDetails = getPlanetInfo(hour.planetKey) || {};
    const sigil = this.resolveSigilMeta(hour.sigil || planetDetails.sigil, hour.angel);
    const focusPack = this.focusCollections[normalizedFocus] || {};
    const proverbList = focusPack.proverbs || [];
    const declarationList = focusPack.declarations || [];

    const proverb =
      proverbList.length === 0
        ? null
        : this.pickFromCollection(proverbList, counter, this.config.psalmDisplayMode);
    const declaration =
      declarationList.length === 0
        ? null
        : this.pickFromCollection(declarationList, counter, this.config.psalmDisplayMode);

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
      return collection[randomIndex];
    }
    return collection[counter % collection.length];
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
