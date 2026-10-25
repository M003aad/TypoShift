const test = require("node:test");
const assert = require("node:assert/strict");

require("../mappings.js");
const layouts = globalThis.TypoShiftLayouts;
const { convert, detectScript, detectDirection } = require("../converter.js");

test("README example: hkh typed on FR -> intended Arabic", () => {
  assert.equal(convert(layouts, "hkh", "fr", "ar"), "انا");
});

test("same layout or unknown layout returns the text unchanged", () => {
  assert.equal(convert(layouts, "abc", "fr", "fr"), "abc");
  assert.equal(convert(layouts, "abc", "fr", "xx"), "abc");
});

test("unmapped characters (spaces, newlines, emoji) pass through", () => {
  assert.equal(convert(layouts, "a b\n😀", "fr", "en"), "q b\n😀");
});

test("Arabic ligature keys convert as one unit (longest match)", () => {
  assert.equal(convert(layouts, "لا", "ar", "en"), "b");
  assert.equal(convert(layouts, "b", "en", "ar"), "لا");
});

test("every layout has aligned rows and no duplicate keys", () => {
  const ids = Object.keys(layouts);
  for (const id of ids) {
    const l = layouts[id];
    l.rows.forEach((row, r) => assert.equal(row.length, l.shiftRows[r].length, `${id} row ${r}`));
    const all = [...l.rows.flat(), ...l.shiftRows.flat()];
    assert.equal(new Set(all).size, all.length, `${id} has duplicate keys`);
    ids.forEach((other) =>
      l.rows.forEach((row, r) => assert.equal(row.length, layouts[other].rows[r].length))
    );
  }
});

test("every key round-trips between every pair of layouts", () => {
  const ids = Object.keys(layouts);
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      for (const key of ["rows", "shiftRows"]) {
        for (const token of layouts[a][key].flat()) {
          const there = convert(layouts, token, a, b);
          assert.equal(convert(layouts, there, b, a), token, `${a}->${b}->${a} for ${token}`);
        }
      }
    }
  }
});

test("detectScript tells Arabic from Latin text", () => {
  assert.equal(detectScript("انا"), "ar");
  assert.equal(detectScript("hkh"), "latin");
  assert.equal(detectScript("été"), "latin");
  assert.equal(detectScript("123 !?"), "unknown");
  assert.equal(detectScript("ab مرحبا ضصثق"), "ar");
});

test("detectDirection: Arabic text -> Latin, Latin text -> Arabic", () => {
  assert.deepEqual(detectDirection("انا", "en"), { source: "ar", target: "en", script: "ar" });
  assert.deepEqual(detectDirection("hkh", "fr"), { source: "fr", target: "ar", script: "latin" });
  assert.deepEqual(detectDirection("hkh", "en"), { source: "en", target: "ar", script: "latin" });
});

test("detectDirection: French-only symbols force the FR layout", () => {
  assert.equal(detectDirection("&é\"'", "en").source, "fr");
  assert.equal(detectDirection("ç", "en").source, "fr");
  assert.equal(detectDirection("123", "fr"), null);
});
