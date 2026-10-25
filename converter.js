// Pure conversion logic: maps text typed on one keyboard layout to the
// characters the same physical keys produce on another layout.
(() => {
  "use strict";

  const cache = new WeakMap(); // layouts object -> Map("source>target" -> table)

  function buildTable(layouts, source, target) {
    const from = layouts[source];
    const to = layouts[target];
    const map = new Map();
    let maxLength = 1;
    for (const key of ["rows", "shiftRows"]) {
      from[key].forEach((row, rowIndex) => {
        row.forEach((token, index) => {
          const out = to[key][rowIndex] && to[key][rowIndex][index];
          if (out === undefined || map.has(token)) return;
          map.set(token, out);
          if (token.length > maxLength) maxLength = token.length;
        });
      });
    }
    return { map, maxLength };
  }

  function getTable(layouts, source, target) {
    let perLayouts = cache.get(layouts);
    if (!perLayouts) {
      perLayouts = new Map();
      cache.set(layouts, perLayouts);
    }
    const id = `${source}>${target}`;
    let table = perLayouts.get(id);
    if (!table) {
      table = buildTable(layouts, source, target);
      perLayouts.set(id, table);
    }
    return table;
  }

  // Longest match first, so Arabic ligature keys such as "لا" (one physical
  // key) are converted as a unit instead of as two separate letters.
  function convert(layouts, text, source, target) {
    if (source === target || !layouts[source] || !layouts[target]) return text;
    const { map, maxLength } = getTable(layouts, source, target);
    let out = "";
    let i = 0;
    while (i < text.length) {
      let step = 0;
      for (let len = Math.min(maxLength, text.length - i); len >= 1; len--) {
        const chunk = text.slice(i, i + len);
        if (map.has(chunk)) {
          out += map.get(chunk);
          step = len;
          break;
        }
      }
      if (step === 0) {
        out += text[i];
        step = 1;
      }
      i += step;
    }
    return out;
  }

  const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const LATIN_RE = /[A-Za-z\u00C0-\u024F]/g;
  // Symbols that only come out of the French AZERTY layout.
  const FR_ONLY_RE = /[²§£µ¨°éèçàù]/;

  // "ar" | "latin" | "unknown", by counting letters of each script.
  function detectScript(text) {
    const arabic = (text.match(ARABIC_RE) || []).length;
    const latin = (text.match(LATIN_RE) || []).length;
    if (!arabic && !latin) return "unknown";
    return arabic > latin ? "ar" : "latin";
  }

  // Guess the conversion direction. Arabic text means it was typed on the
  // Arabic layout (convert to Latin); Latin text means it was typed on a
  // Latin layout (convert to Arabic). EN vs FR cannot be told from letters
  // alone, so we use French-only symbols, else the user's preferred layout.
  function detectDirection(text, latinPreference = "fr") {
    const script = detectScript(text);
    if (script === "unknown") return null;
    const latin = FR_ONLY_RE.test(text) ? "fr" : latinPreference;
    return script === "ar"
      ? { source: "ar", target: latin, script }
      : { source: latin, target: "ar", script };
  }

  const api = { convert, detectScript, detectDirection };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else globalThis.TypoShiftConverter = api;
})();
