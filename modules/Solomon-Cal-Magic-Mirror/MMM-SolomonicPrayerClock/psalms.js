function getVerseForFocus(mapping, focusArea, options = {}) {
  const pool = mapping?.[focusArea] || [];
  if (!pool.length) {
    return null;
  }

  const mode = options.mode || "cycle";
  if (mode === "random") {
    const index = Math.floor(Math.random() * pool.length);
    return pool[index] || null;
  }

  const index = options.index ?? 0;
  return pool[index % pool.length] || null;
}

module.exports = {
  getVerseForFocus
};
