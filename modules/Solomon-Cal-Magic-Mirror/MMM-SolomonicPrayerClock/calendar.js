const CHALDEAN_ORDER = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];

const WEEKDAY_SOURCE = require("./data/weekday_correspondences.json");
const PLANETARY_SOURCE = require("./data/planetary_attributes.json");

const PLANETARY_INFO = Object.keys(PLANETARY_SOURCE).reduce((accumulator, key) => {
  const info = PLANETARY_SOURCE[key];
  accumulator[key] = {
    key,
    label: info.label,
    angel: info.angel,
    emoji: info.emoji,
    sigil: info.sigil,
    intelligence: info.intelligence,
    spirit: info.spirit,
    color: info.color,
    metal: info.metal,
    stone: info.stone,
    incense: info.incense,
    keywords: info.keywords,
    seasonalFocus: info.seasonalFocus,
    dayOfWeek: info.dayOfWeek
  };
  return accumulator;
}, {});

const WEEKDAY_DATA = Object.keys(WEEKDAY_SOURCE).reduce((accumulator, dayKey) => {
  const entry = WEEKDAY_SOURCE[dayKey];
  const planetInfo = PLANETARY_INFO[entry.planetKey] || {};
  accumulator[dayKey] = {
    ...entry,
    planetLabel: planetInfo.label || entry.planetKey,
    planetDetails: planetInfo
  };
  return accumulator;
}, {});

function getDayData(date) {
  const dayKey = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return WEEKDAY_DATA[dayKey] || null;
}

function getPlanetSequence(startPlanetKey, count = 24) {
  const startIndex = CHALDEAN_ORDER.indexOf(startPlanetKey);
  if (startIndex === -1) {
    throw new Error(`Unknown start planet: ${startPlanetKey}`);
  }

  return Array.from({ length: count }, (_v, idx) => {
    const index = (startIndex + idx) % CHALDEAN_ORDER.length;
    const planetKey = CHALDEAN_ORDER[index];
    return {
      key: planetKey,
      ...PLANETARY_INFO[planetKey]
    };
  });
}

function getPlanetInfo(planetKey) {
  return PLANETARY_INFO[planetKey] || null;
}

function getWeekdayManifest() {
  return { ...WEEKDAY_DATA };
}

module.exports = {
  CHALDEAN_ORDER,
  PLANETARY_INFO,
  WEEKDAY_DATA,
  getDayData,
  getPlanetSequence,
  getPlanetInfo,
  getWeekdayManifest
};
