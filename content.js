(() => {
  "use strict";

  const { convert, detectDirection } = globalThis.TypoShiftConverter || {};
  const layouts = globalThis.TypoShiftLayouts;
  const css = globalThis.TypoShiftStyles;
  if (!convert || !detectDirection || !layouts || !css) return;

  const DEFAULT_SETTINGS = { source: "fr", target: "ar", latin: "fr", auto: true };
  const QUICK_PAIRS = [
    { source: "en", target: "ar", label: "EN ⇄ AR" },
    { source: "en", target: "fr", label: "EN ⇄ FR" },
    { source: "fr", target: "ar", label: "FR ⇄ AR" }
  ];
  // Password fields are intentionally excluded.
  const LATIN_LAYOUTS = new Set(["en", "fr"]);
  const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel"]);

  let settings = { ...DEFAULT_SETTINGS };
  let selection = null; // { text, anchor: {x, y}, edit: null | {...} }
  let triggerPos = { left: 8, top: 8 };
  let lastPointer = null;
  let detected = null;
  let isOpen = false;
  let statusTimer = 0;

  let host, trigger, popup;
  let sourceSelect, targetSelect, originalField, resultField, replaceButton, status;
  let triggerLabel, autoInput, hint;

  /* ---------- Selection helpers ---------- */

  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === "TEXTAREA") return true;
    return el.tagName === "INPUT" && TEXT_INPUT_TYPES.has((el.type || "text").toLowerCase());
  }

  function findEditableRoot(el) {
    let node = el;
    while (node.parentElement && node.parentElement.isContentEditable) node = node.parentElement;
    return node;
  }

  function readSelection() {
    const active = document.activeElement;

    // <input> / <textarea>: window.getSelection() gives no usable rectangle.
    if (isTextField(active)) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start === null || start === end) return null;
      const text = active.value.slice(start, end);
      if (!text.trim()) return null;
      const box = active.getBoundingClientRect();
      const pointerInside =
        lastPointer &&
        lastPointer.x >= box.left && lastPointer.x <= box.right &&
        lastPointer.y >= box.top && lastPointer.y <= box.bottom;
      return {
        text,
        anchor: pointerInside ? lastPointer : { x: box.right, y: box.bottom },
        edit: { kind: "field", el: active, start, end }
      };
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const text = sel.toString();
    if (!text.trim()) return null;
    const range = sel.getRangeAt(0);
    const rects = range.getClientRects();
    const rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    const node = range.commonAncestorContainer;
    const el = node.nodeType === 1 ? node : node.parentElement;
    const editableRoot = el && el.isContentEditable ? findEditableRoot(el) : null;
    return {
      text,
      anchor: { x: rect.right, y: rect.bottom },
      edit: editableRoot ? { kind: "editable", root: editableRoot, range: range.cloneRange() } : null
    };
  }

  /* ---------- UI state ---------- */

  function positionElement(element, x, y) {
    const margin = 8;
    const width = element.offsetWidth || 34;
    const height = element.offsetHeight || 34;
    const left = Math.max(margin, Math.min(x, window.innerWidth - width - margin));
    const top = Math.max(margin, Math.min(y, window.innerHeight - height - margin));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    return { left, top };
  }

  function closeUI() {
    isOpen = false;
    trigger.style.display = "none";
    popup.style.display = "none";
  }

  // The button only shows the script (AR / LT = Latin); the exact Latin
  // layout (FR or EN) is chosen in the popup.
  function scriptCode(layoutId) {
    return LATIN_LAYOUTS.has(layoutId) ? "LT" : layoutId.toUpperCase();
  }

  function pairLabel() {
    return `${scriptCode(settings.source)}→${scriptCode(settings.target)}`;
  }

  function updateTriggerLabel() {
    triggerLabel.textContent = pairLabel();
    trigger.title = `TypoShift: convert ${layouts[settings.source].name} → ${layouts[settings.target].name}`;
  }

  function syncSelects() {
    sourceSelect.value = settings.source;
    targetSelect.value = settings.target;
  }

  // Auto-detect applies to this selection only; it is saved when the user
  // changes something by hand.
  function applyAutoDetect(text) {
    detected = null;
    if (!settings.auto) return;
    detected = detectDirection(text, settings.latin);
    if (detected) {
      settings.source = detected.source;
      settings.target = detected.target;
    }
  }

  function updateHint() {
    if (!settings.auto) hint.textContent = "";
    else if (!detected) hint.textContent = "No letters to detect";
    else hint.textContent = detected.script === "ar" ? "Detected: Arabic" : "Detected: Latin";
  }

  function showTrigger(anchor) {
    updateTriggerLabel();
    trigger.style.display = "flex";
    triggerPos = positionElement(trigger, anchor.x + 8, anchor.y + 8);
  }

  function updateResult() {
    originalField.value = selection ? selection.text : "";
    resultField.value = selection ? convert(layouts, selection.text, settings.source, settings.target) : "";
  }

  function updateQuickPairState() {
    popup.querySelectorAll(".lf-pair").forEach((button, index) => {
      const pair = QUICK_PAIRS[index];
      button.classList.toggle(
        "is-active",
        settings.source === pair.source && settings.target === pair.target
      );
    });
  }

  function openPopup() {
    if (!selection) return;
    isOpen = true;
    trigger.style.display = "none";
    replaceButton.hidden = !selection.edit;
    autoInput.checked = settings.auto;
    syncSelects();
    updateHint();
    updateResult();
    updateQuickPairState();
    popup.style.display = "block";
    positionElement(popup, triggerPos.left, triggerPos.top);
  }

  function flash(message) {
    status.textContent = message;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { status.textContent = ""; }, 1600);
  }

  function persistSettings() {
    try {
      Promise.resolve(chrome.storage.local.set(settings)).catch(() => {});
    } catch {
      // Extension was reloaded/updated; the page needs a refresh.
    }
  }

  function saveSettings() {
    settings.source = sourceSelect.value;
    settings.target = targetSelect.value;
    if (LATIN_LAYOUTS.has(settings.source)) settings.latin = settings.source;
    else if (LATIN_LAYOUTS.has(settings.target)) settings.latin = settings.target;
    persistSettings();
    updateResult();
    updateQuickPairState();
    updateTriggerLabel();
  }

  /* ---------- Actions ---------- */

  async function copyResult() {
    const value = resultField.value;
    try {
      await navigator.clipboard.writeText(value);
      flash("Copied");
    } catch {
      resultField.focus();
      resultField.select();
      flash(document.execCommand("copy") ? "Copied" : "Copy failed");
    }
  }

  function replaceSelection() {
    const edit = selection && selection.edit;
    if (!edit) return;
    const value = resultField.value;
    let done = false;
    try {
      if (edit.kind === "field") {
        const el = edit.el;
        el.focus();
        el.setSelectionRange(edit.start, edit.end);
        done = document.execCommand("insertText", false, value);
        if (!done) {
          el.setRangeText(value, edit.start, edit.end, "end");
          el.dispatchEvent(new Event("input", { bubbles: true }));
          done = true;
        }
      } else {
        edit.root.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(edit.range);
        done = document.execCommand("insertText", false, value);
      }
    } catch {
      done = false;
    }
    if (done) closeUI();
    else flash("Replace failed — use Copy");
  }

  /* ---------- Events ---------- */

  function fromOurUI(event) {
    return typeof event.composedPath === "function" && event.composedPath().includes(host);
  }

  function handleSelection(event) {
    if (isOpen || (event && fromOurUI(event))) return;
    const info = readSelection();
    if (!info) {
      selection = null;
      trigger.style.display = "none";
      return;
    }
    selection = info;
    applyAutoDetect(info.text);
    showTrigger(info.anchor);
  }

  function createUI() {
    host = document.createElement("typo-shift-root");
    host.style.cssText = "all: initial;";
    const shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);

    trigger = document.createElement("button");
    trigger.className = "trigger";
    trigger.type = "button";
    trigger.title = "Open TypoShift";
    trigger.setAttribute("aria-label", "Open TypoShift");
    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("assets/48.48.png");
    logo.alt = "";
    logo.setAttribute("aria-hidden", "true");
    trigger.appendChild(logo);
    triggerLabel = document.createElement("span");
    trigger.appendChild(triggerLabel);
    shadow.appendChild(trigger);

    popup = document.createElement("section");
    popup.className = "popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "TypoShift keyboard layout converter");
    popup.innerHTML = `
      <div class="lf-header">
        <h2 class="lf-title">TypoShift</h2>
        <button class="lf-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="lf-layouts">
        <label><span class="lf-label">From</span><select class="lf-source"></select></label>
        <button class="lf-switch" type="button" title="Reverse conversion" aria-label="Reverse conversion">⇄</button>
        <label><span class="lf-label">To</span><select class="lf-target"></select></label>
      </div>
      <div class="lf-detect">
        <label class="lf-auto"><input class="lf-auto-input" type="checkbox"> Auto-detect</label>
        <span class="lf-hint" aria-live="polite"></span>
      </div>
      <label class="lf-label" for="lf-original">Selected text</label>
      <textarea id="lf-original" class="lf-text" dir="auto" readonly></textarea>
      <label class="lf-label" for="lf-result">Converted text</label>
      <textarea id="lf-result" class="lf-text lf-result" dir="auto" readonly></textarea>
      <div class="lf-actions">
        <div class="lf-quick" aria-label="Quick pairs"></div>
        <div class="lf-buttons">
          <button class="lf-replace" type="button" hidden>Replace</button>
          <button class="lf-copy" type="button">Copy</button>
        </div>
      </div>
      <p class="lf-status" aria-live="polite"></p>
    `;
    shadow.appendChild(popup);

    sourceSelect = popup.querySelector(".lf-source");
    targetSelect = popup.querySelector(".lf-target");
    originalField = popup.querySelector("#lf-original");
    resultField = popup.querySelector("#lf-result");
    replaceButton = popup.querySelector(".lf-replace");
    status = popup.querySelector(".lf-status");
    autoInput = popup.querySelector(".lf-auto-input");
    hint = popup.querySelector(".lf-hint");

    Object.entries(layouts).forEach(([id, layout]) => {
      sourceSelect.add(new Option(layout.name, id));
      targetSelect.add(new Option(layout.name, id));
    });
    sourceSelect.value = settings.source;
    targetSelect.value = settings.target;

    const quick = popup.querySelector(".lf-quick");
    QUICK_PAIRS.forEach((pair) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lf-pair";
      button.textContent = pair.label;
      button.addEventListener("click", () => {
        const alreadyForward = settings.source === pair.source && settings.target === pair.target;
        sourceSelect.value = alreadyForward ? pair.target : pair.source;
        targetSelect.value = alreadyForward ? pair.source : pair.target;
        saveSettings();
      });
      quick.appendChild(button);
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      openPopup();
    });
    popup.querySelector(".lf-close").addEventListener("click", closeUI);
    popup.querySelector(".lf-switch").addEventListener("click", () => {
      const source = sourceSelect.value;
      sourceSelect.value = targetSelect.value;
      targetSelect.value = source;
      saveSettings();
    });
    sourceSelect.addEventListener("change", saveSettings);
    targetSelect.addEventListener("change", saveSettings);
    popup.querySelector(".lf-copy").addEventListener("click", copyResult);
    replaceButton.addEventListener("click", replaceSelection);
    autoInput.addEventListener("change", () => {
      settings.auto = autoInput.checked;
      if (settings.auto && selection) applyAutoDetect(selection.text);
      persistSettings();
      syncSelects();
      updateHint();
      updateResult();
      updateQuickPairState();
      updateTriggerLabel();
    });

    document.documentElement.appendChild(host);

    document.addEventListener("mousedown", (event) => {
      if (isOpen && !fromOurUI(event)) closeUI();
    }, true);
    document.addEventListener("mouseup", (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      window.setTimeout(() => handleSelection(event), 0);
    });
    document.addEventListener("keyup", (event) => {
      if (event.key === "Escape") return;
      window.setTimeout(() => handleSelection(event), 0);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) closeUI();
    }, true);
    window.addEventListener("resize", closeUI);
    window.addEventListener("scroll", (event) => {
      if (fromOurUI(event)) return;
      if (isOpen || trigger.style.display !== "none") closeUI();
    }, true);
  }

  async function init() {
    try {
      const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
      settings = {
        source: layouts[stored.source] ? stored.source : DEFAULT_SETTINGS.source,
        target: layouts[stored.target] ? stored.target : DEFAULT_SETTINGS.target,
        latin: LATIN_LAYOUTS.has(stored.latin) ? stored.latin : DEFAULT_SETTINGS.latin,
        auto: typeof stored.auto === "boolean" ? stored.auto : DEFAULT_SETTINGS.auto
      };
    } catch {
      // Fall back to defaults.
    }
    createUI();
  }

  init();
})();
