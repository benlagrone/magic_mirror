const SunCalc = require("suncalc");
const { getPlanetSequence } = require("../calendar");
const { hourLabel } = require("./timeHelpers");

function divideRange(start, end, segments) {
  const span = end.getTime() - start.getTime();
  const step = span / segments;

  return Array.from({ length: segments }, (_value, index) => {
    const segStart = new Date(start.getTime() + step * index);
    const segEnd = new Date(segStart.getTime() + step);
    return {
      start: segStart,
      end: segEnd
    };
  });
}

function fallbackHours(date) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: 24 }, (_value, index) => {
    const start = new Date(base.getTime() + index * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      start,
      end
    };
  });
}

function calculatePlanetaryHours(date, latitude, longitude, startPlanetKey) {
  const times = SunCalc.getTimes(date, latitude, longitude);
  const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const nextTimes = SunCalc.getTimes(nextDay, latitude, longitude);

  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const nextSunrise = nextTimes.sunrise;

  let segments = [];
  if (sunrise && sunset && nextSunrise && sunset > sunrise && nextSunrise > sunset) {
    const daySegments = divideRange(sunrise, sunset, 12);
    const nightSegments = divideRange(sunset, nextSunrise, 12);
    segments = daySegments.concat(nightSegments);
  } else {
    segments = fallbackHours(date);
  }

  const planets = getPlanetSequence(startPlanetKey, segments.length);

  return segments.map((segment, index) => {
    const planet = planets[index];
    return {
      start: segment.start,
      end: segment.end,
      index: index + 1,
      indexLabel: hourLabel(index + 1),
      planetKey: planet.key,
      planetLabel: planet.label,
      angel: planet.angel,
      emoji: planet.emoji,
      sigil: planet.sigil
    };
  });
}

module.exports = {
  calculatePlanetaryHours
};
