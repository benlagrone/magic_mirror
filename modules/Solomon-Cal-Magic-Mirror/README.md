Here are the detailed instructions you can use to create a README.md for Codex to generate a MagicMirror² plugin called MMM-SolomonicPrayerClock. This module will display a Solomonic Prayer Dashboard on your Magic Mirror, aligned with:
	•	Day of week and its planetary angelic influence
	•	Current hour with corresponding archangel, divine name, and Psalm
	•	Upcoming prayer focus
	•	Visual sigils or symbols (optional)
	•	All optimized for wisdom, wealth, health, and influence

⸻

✅ README.md Instructions for Codex

# MMM-SolomonicPrayerClock

A MagicMirror² module that displays a Solomonic prayer calendar and clock—fusing biblical wisdom (Psalms, Proverbs), planetary hours, angelic influences, and traditional Solomonic themes to guide prayer and meditation throughout the day.

This module is ideal for spiritual seekers, Christian mystics, or practitioners of biblically-aligned ceremonial prayer who want to integrate their spiritual rhythm into a daily dashboard.

---

## ✨ Features

- Displays current **day of the week** with associated angel, divine name, and spiritual focus
- Displays current **planetary hour** and ruling angel, with relevant prayer snippet or Psalm
- Shows **upcoming hour's** prayer focus to prepare ahead
- Rotating display of **Psalms**, **sigils**, or **Proverbs**
- Aligns with **sunrise-to-sunrise planetary hour calculation**
- Supports **modular view themes**: minimalist / expanded
- Built to support **wisdom, wealth, health, and influence** enhancement through biblical prayer cycles

---

## 📦 Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR-USERNAME/MMM-SolomonicPrayerClock.git
cd MMM-SolomonicPrayerClock
npm install


⸻

🧾 Configuration

Add the module to the modules array in config/config.js:

{
  module: "MMM-SolomonicPrayerClock",
  position: "top_left",
  config: {
    latitude: 29.7604,
    longitude: -95.3698,
    theme: "expanded", // "minimalist" | "expanded"
    showSigils: true,
    showUpcoming: true,
    psalmDisplayMode: "cycle", // "cycle" | "random"
    focusAreas: ["wisdom", "wealth", "health", "influence"], // determines prayer emphasis
    locale: "en"
  }
}


⸻

🌞 Daily Rhythms

Each day aligns with a planet, archangel, divine name, and Solomonic theme.

Day	Planet	Angel	Divine Name	Theme
Sunday	☀ Sun	Michael	Adonai	Authority
Monday	🌙 Moon	Gabriel	El Shaddai	Reflection
Tuesday	♂ Mars	Samael	Elohim Gibor	Warfare
Wednesday	☿ Merc	Raphael	YHVH Tsabaoth	Wisdom
Thursday	♃ Jup	Sachiel	El Elyon	Blessing
Friday	♀ Ven	Anael	YHVH Ra’ah	Love
Saturday	♄ Sat	Cassiel	Elohim	Judgment


⸻

🕰 Planetary Hours

Based on local sunrise time, the 24 planetary hours rotate through the angels and planets. The module calculates real-time planetary hours using your configured latitude and longitude.

⸻

📖 Psalm Cycles

Each hour includes a Psalm snippet and spiritual petition optimized for one of four focus areas:
	•	Wisdom: clarity, decision-making, understanding
	•	Wealth: stewardship, favor, expansion
	•	Health: restoration, strength, protection
	•	Influence: leadership, favor, voice

You can adjust which Psalms are emphasized via focusAreas config.

⸻

🪄 Sigils and Visuals

If showSigils is enabled, relevant angelic sigils or divine name images are displayed alongside prayer text.

Sigils are stored in /assets/sigils/ and named by angel (e.g. michael.png, raphael.png).

⸻

🧠 Example Display

--------------------------------------------------
|  🌞  Thursday (Jupiter) – Blessing              |
|  👼  Angel: Sachiel   | Divine Name: El Elyon   |
|  🕒  Current Hour (10:00AM): 5th Hour – Saturn  |
|       → Focus: Boundaries, Reflection           |
|       → Psalm: “Teach us to number our days…”  |
|                                                 |
|  🔜 Next Hour: 6th – Jupiter (Prosperity)       |
|       → Angel: Sachiel                          |
|       → Focus: Favor, Wealth, Multiplication    |
|                                                 |
|  📜 Cycle Psalm: Psalm 112                      |
|     “Blessed is the man who fears the Lord…”    |
|                                                 |
|  🔯 Sigil of Sachiel [displayed if enabled]     |
--------------------------------------------------


⸻

🔧 Dependencies
	•	Moment.js (for time formatting)
	•	SunCalc (for sunrise/sunset planetary hour math)
	•	Node-fetch (for optional Psalm or Proverb rotation APIs)

⸻

📁 Folder Structure

MMM-SolomonicPrayerClock/
├── MMM-SolomonicPrayerClock.js
├── node_helper.js
├── psalms.js
├── calendar.js
├── utils/
│   ├── planetaryHours.js
│   └── timeHelpers.js
├── assets/
│   ├── sigils/
│   └── styles.css
├── package.json
└── README.md


⸻

🛤️ Roadmap
	•	Add voice-triggered prayer mode (MMM-Assistant integration)
	•	Add monthly calendar scroll panel with feast/focus days
	•	Hebrew calendar overlay and lunar phases
	•	Alert tone for prayer hour transitions

⸻

📖 Sources
	•	Key of Solomon, Testament of Solomon
	•	Book of Psalms
	•	Traditional Planetary Hour charts
	•	Angelic associations from grimoires

⸻

🙏 License

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)

---

Would you like me to now **generate the folder scaffolding and JS module code** to match this `README.md`, or just prepare a zip for deployment?

Let me know your preferred next step:
- `Generate core module files`
- `Build static calendar JSONs`
- `Make images for sigils`
- `Make a MagicMirror plugin zip`
