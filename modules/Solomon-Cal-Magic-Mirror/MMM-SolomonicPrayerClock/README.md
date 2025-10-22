# MMM-SolomonicPrayerClock

MagicMirror² module that renders a Solomonic prayer clock aligning biblical wisdom with traditional planetary hours.

## Features

- Shows the current weekday with associated planet, archangel, divine name, and devotional theme.
- Calculates live planetary hours using SunCalc based on configured latitude and longitude.
- Surfaces hourly scripture references (rotating through `wisdom`, `wealth`, `health`, `influence`) and fetches verse text from a configurable Bible service.
- Tap any scripture reference to open the full chapter in an inline modal.
- Displays upcoming hour preview to help the user prepare.
- Optional sigil display by dropping images into `assets/sigils/{angel}.png`.

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR-USERNAME/MMM-SolomonicPrayerClock.git
cd MMM-SolomonicPrayerClock
npm install
```

## Configuration

```js
{
  module: "MMM-SolomonicPrayerClock",
  position: "top_left",
  config: {
    latitude: 29.7604,
    longitude: -95.3698,
    theme: "expanded",             // "minimalist" | "expanded"
    showSigils: true,
    showUpcoming: true,
    psalmDisplayMode: "cycle",     // "cycle" | "random"
    focusAreas: ["wisdom", "wealth", "health", "influence"],
    locale: "en",
    updateInterval: 60 * 1000,
    rotationIntervalSeconds: 15,    // override front-end cycle (seconds); fallback rotationInterval (ms)
    verseServiceUrl: "http://192.168.86.23:8001/get-verse",
    verseTranslation: "KJV"          // optional override; defaults to KJV
  }
}
```

## Data Sources

- `solomonic_focus_mapping.json` is loaded at start-up.
- Weekday ↔ planetary correspondences live in `calendar.js`.
- Planetary hour math uses SunCalc for sunrise/sunset bounds (`utils/planetaryHours.js`).
- Hourly and daily scripture text is retrieved from `config.verseServiceUrl` (POST JSON API expected to match the included sample payload).
- Additional data packs live under `data/`:
  - `weekday_correspondences.json` – daily angel/divine-name themes, colors, psalms, and incense.
  - `planetary_attributes.json` – planetary intelligences, spirits, and ritual metadata.
  - `focus_area_collections.json` – extra Proverbs and declarations keyed to each focus area.
  - `sigil_manifest.json` – file manifest with alt text and sourcing for angelic sigils.

## Development

1. Run `npm install`.
2. Use `npm run lint` (if added) or your preferred tooling.
3. Drop optional sigil images under `assets/sigils/ANGEL.png`.

## License

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
