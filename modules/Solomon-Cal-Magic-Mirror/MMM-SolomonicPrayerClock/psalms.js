function getVerseForFocus(mapping, focusArea, options = {}) {
  const pool = mapping?.[focusArea] || [];
  if (!pool.length) {
    return {
      ref: "Psalm 1",
      snippet: "Blessed is the one who delights in the law of the Lord."
    };
  }

  const mode = options.mode || "cycle";
  if (mode === "random") {
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  const index = options.index ?? 0;
  return pool[index % pool.length];
}

module.exports = {
  getVerseForFocus
};
