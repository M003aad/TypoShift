// Styles for the TypoShift UI (lives inside a Shadow DOM).
globalThis.TypoShiftStyles = `
[hidden] { display: none !important; }

.trigger {
  position: fixed;
  z-index: 2147483646;
  display: none;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 4px 11px 4px 4px;
  box-sizing: border-box;
  border: 1px solid rgba(23, 32, 42, 0.12);
  border-radius: 999px;
  background: #ffffff;
  color: #17202a;
  box-shadow: 0 6px 18px rgba(23, 32, 42, 0.22), 0 1px 3px rgba(23, 32, 42, 0.12);
  cursor: pointer;
  font: 700 11px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: 0.03em;
  white-space: nowrap;
  animation: ts-pop 0.14s ease-out;
}

.trigger img {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  object-fit: contain;
}

.trigger:hover {
  background: #f1f6ff;
  box-shadow: 0 8px 22px rgba(23, 32, 42, 0.28), 0 1px 3px rgba(23, 32, 42, 0.14);
  transform: translateY(-1px);
}

.trigger:active {
  transform: translateY(0) scale(0.97);
}

.trigger:focus-visible {
  outline: 2px solid #1d6bff;
  outline-offset: 2px;
}

@keyframes ts-pop {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .trigger { animation: none; }
}

.popup {
  position: fixed;
  z-index: 2147483647;
  display: none;
  width: min(360px, calc(100vw - 24px));
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid #d9dfe5;
  border-radius: 14px;
  background: #fbfaf7;
  color: #17202a;
  box-shadow: 0 18px 50px rgba(23, 32, 42, 0.22);
  font: 13px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.popup * {
  box-sizing: border-box;
}

.popup .lf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.popup .lf-title {
  margin: 0;
  color: #17202a;
  font-size: 15px;
  font-weight: 750;
}

.popup .lf-close,
.popup .lf-switch,
.popup .lf-pair {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.popup .lf-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  color: #68727d;
  font-size: 19px;
}

.popup .lf-close:hover {
  background: #e9edf0;
}

.popup .lf-label {
  display: block;
  margin: 0 0 5px;
  color: #68727d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.popup .lf-layouts {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px minmax(0, 1fr);
  align-items: end;
  gap: 7px;
  margin-bottom: 11px;
}

.popup select {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 7px;
  border: 1px solid #cdd4da;
  border-radius: 7px;
  background: #fff;
  color: #17202a;
  font: inherit;
}

.popup .lf-switch {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e0ece8;
  color: #17604d;
  font-size: 19px;
  font-weight: 700;
}

.popup .lf-switch:hover {
  background: #cce2db;
}

.popup .lf-text {
  width: 100%;
  min-height: 54px;
  unicode-bidi: plaintext;
  max-height: 110px;
  resize: vertical;
  padding: 9px;
  border: 1px solid #d9dfe5;
  border-radius: 8px;
  background: #f1f3f4;
  color: #4b5661;
  font: 13px/1.45 system-ui, sans-serif;
}

.popup .lf-result {
  background: #eef7f2;
  border-color: #b9d7c9;
  color: #173d31;
}

.popup .lf-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.popup .lf-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.popup .lf-pair {
  padding: 5px 7px;
  border-radius: 6px;
  background: #e9edf0;
  color: #4b5661;
  font-size: 11px;
}

.popup .lf-pair:hover,
.popup .lf-pair.is-active {
  background: #d8e8e2;
  color: #17604d;
}

.popup .lf-copy {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: #17604d;
  color: #fff;
  cursor: pointer;
  font: 700 12px system-ui, sans-serif;
}

.popup .lf-copy:hover {
  background: #104737;
}

.popup .lf-status {
  min-height: 16px;
  margin: 5px 0 0;
  color: #17604d;
  font-size: 11px;
  text-align: right;
}

.popup .lf-buttons {
  display: flex;
  gap: 6px;
}

.popup .lf-replace {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #17604d;
  border-radius: 7px;
  background: transparent;
  color: #17604d;
  cursor: pointer;
  font: 700 12px system-ui, sans-serif;
}

.popup .lf-replace:hover {
  background: #e0ece8;
}

.popup .lf-detect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: -3px 0 10px;
  font-size: 11px;
}

.popup .lf-auto {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4b5661;
  font-weight: 600;
  cursor: pointer;
}

.popup .lf-auto input {
  margin: 0;
  accent-color: #17604d;
}

.popup .lf-hint {
  color: #17604d;
  font-weight: 600;
}
`;
