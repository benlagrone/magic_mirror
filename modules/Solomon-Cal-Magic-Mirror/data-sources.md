Here are the primary data sources you can use to power your SolomonicPrayerClock module—categorized by type and reliability. These include both canonical texts, grimoire traditions, and computed astronomical data for planetary hours.

⸻

📚 1. Biblical & Canonical Sources (Primary, Public Domain)

These are the core texts for Psalms, Proverbs, divine names, and themes.

Source	Use	Format
Book of Psalms (KJV or other translation)	Hourly and daily prayer content	Full text public domain
Proverbs	Daily wisdom rotation (especially Wednesday)	Public domain
Psalm 119	Used for multi-hour meditative segments	Divided into 8-verse stanzas
1 Kings 3:9–12, 2 Chronicles 1:10–12	Solomon’s wisdom prayer	Can be included as special feature
Hebrew Names of God (Adonai, Elohim, El Shaddai, etc.)	Day/Hour invocation	Reference list
Strong’s Concordance	Word mapping, if needed	Optional, large dataset

Public API:
	•	Bible API (ESV, KJV, others)
	•	https://labs.bible.org/api_web_service (free, returns JSON)

⸻

📜 2. Solomonic & Grimoire Traditions (Secondary, Traditional)

Sources used to align angel names, sigils, planetary correspondences, and order of prayer:

Grimoire	Use	Availability
Key of Solomon (Clavicula Salomonis)	Divine names, planetary day associations, incense, seals	Public domain (Mathers translation)
Testament of Solomon	Demonic/angelic hierarchy, symbolic prayers, wisdom themes	Public domain
Ars Paulina (part of Lemegeton)	Planetary hours & their angels	Public domain
Sefer Raziel HaMalakh	Angel names, hours, protective prayers	Translations vary
The Magus (1801) by Francis Barrett	Condensed planetary correspondences	Public domain

Online Sources:
	•	EsotericArchives.com – Mathers’ Key of Solomon, Testament of Solomon
	•	Sacred-Texts.com – Cross-indexed grimoires
	•	Hermetic.com – Fraternal archives

⸻

🌞 3. Planetary Hour Calculators (Astronomical Time)

To calculate planetary hours based on sunrise/sunset at your location:

Source	Use	Format
SunCalc (npm package)	Compute sunrise/sunset locally	JS lib
Timeanddate.com	Reference planetary hours manually	Web
OpenWeatherMap / WeatherAPI	Fallback sunrise/sunset	JSON
AstroJS	Advanced planetary calendars	Optional
Lunisolar.js	Moon phase & Hebrew calendar overlay	Optional

NPM Packages:
	•	suncalc
	•	astronomia

⸻

📁 4. Angel Names, Sigils, and Divine Names

These are traditionally passed down in grimoires, but can be templated for display.

Type	Source
Archangels by Day/Hour	Ars Paulina, Lemegeton
Sigils	Can be generated using Rose Cross, Magic Squares, or from grimoire images
Names of God	Bible, Kabbalistic tradition, Sefer Raziel, Key of Solomon
Color associations & incense	Agrippa’s Three Books of Occult Philosophy

Visuals:
	•	Sigils can be reproduced as SVGs or PNGs from occult-symbols.com or drawn from public domain PDFs

⸻

📊 5. Wisdom, Wealth, Health, Influence Mapping

You’ll need to map Psalms and Proverbs to your desired focus areas. You can do this manually or with a JSON file like this:

{
  "wisdom": ["Proverbs 1", "Psalm 111:10", "Psalm 119:97"],
  "wealth": ["Psalm 112", "Proverbs 10:22", "Psalm 1"],
  "health": ["Psalm 103:2-5", "Psalm 91", "Proverbs 3:7-8"],
  "influence": ["Psalm 72", "Proverbs 22:29", "Psalm 45"]
}

This JSON file can then be rotated based on hour or day.

⸻

🧠 Bonus: AI or LLM Preprocessing (optional)

If you want to score each Psalm for focus area, you can use:
	•	OpenAI or local Ollama with a prompt like:
“Classify this Psalm into: Wisdom, Wealth, Health, Influence, or Multiple.”
	•	Save results into a local cache or JSON for use in your dashboard

⸻

✅ Summary: What You Need

Data Type	Source
Psalms/Proverbs	Bible API or local JSON
Day & Angel	Grimoires (Key of Solomon, Ars Paulina)
Planetary Hours	SunCalc + Lat/Lon
Divine Names	Key of Solomon, Sefer Raziel
Focus Mapping	Custom JSON or AI pre-tagged
Sigils	Public domain images or generated
Sunrise Time	SunCalc or OpenWeatherMap


⸻

Would you like me to:
	•	Generate the JSONs for wisdom/wealth/health/influence?
	•	Generate the planetary hour angel mapping?
	•	Scrape and format the Psalms for daily/hourly usage?

