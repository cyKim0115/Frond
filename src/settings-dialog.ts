/**
 * 설정 팝업 — `SETTINGS` 스키마를 구역(section)별로 그린다. 바꾼 값은 바로 적용·저장된다(저장 버튼 없음).
 * 숫자는 `change`(포커스 이동·Enter·스핀 버튼)에서 확정한다 — 입력 중간값("15"를 치는 동안의 "1")이 적용되지 않게.
 */

import { ICON_RESET, icon } from "./icons";
import {
  getSetting,
  onSettingChange,
  resetSettings,
  setSetting,
  SETTING_KEYS,
  SETTINGS,
  type SettingDef,
  type SettingKey,
} from "./settings";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
const body = dialog.querySelector<HTMLElement>("#settings-body")!;
const controls = new Map<SettingKey, HTMLInputElement | HTMLSelectElement>();
const resetButtons = new Map<SettingKey, HTMLButtonElement>();

function buildControl(key: SettingKey, def: SettingDef): HTMLInputElement | HTMLSelectElement {
  if (def.kind === "select") {
    const select = document.createElement("select");
    for (const option of def.options) select.add(new Option(option.label, option.value));
    select.addEventListener("change", () => setSetting(key, select.value));
    return select;
  }
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(def.min);
  input.max = String(def.max);
  input.step = String(def.step);
  input.inputMode = "numeric";
  // 범위 밖·빈 값은 설정이 바로잡은 값으로 되돌려 보인다
  input.addEventListener("change", () => {
    input.value = String(setSetting(key, input.value));
  });
  return input;
}

function build(): void {
  let section = "";
  for (const key of SETTING_KEYS) {
    const def: SettingDef = SETTINGS[key];
    if (def.section !== section) {
      section = def.section;
      const h = document.createElement("h3");
      h.textContent = section;
      body.append(h);
    }
    const id = `setting-${key}`;
    const row = document.createElement("div");
    row.className = "setting-row";

    const label = document.createElement("label");
    label.htmlFor = id;
    const name = document.createElement("span");
    name.className = "setting-label";
    name.textContent = def.label;
    label.append(name);
    if (def.hint) {
      const hint = document.createElement("span");
      hint.className = "setting-hint";
      hint.textContent = def.hint;
      label.append(hint);
    }

    const control = buildControl(key, def);
    control.id = id;
    const wrap = document.createElement("div");
    wrap.className = "setting-control";
    wrap.append(control);
    if (def.kind === "number" && def.unit) {
      const unit = document.createElement("span");
      unit.className = "setting-unit";
      unit.textContent = def.unit;
      wrap.append(unit);
    }
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "icon-btn small setting-reset";
    reset.title = `기본값(${def.default}${def.kind === "number" ? (def.unit ?? "") : ""})으로`;
    reset.setAttribute("aria-label", `${def.label} 기본값으로`);
    reset.append(icon(ICON_RESET));
    reset.addEventListener("click", () => setSetting(key, def.default));
    wrap.append(reset);

    row.append(label, wrap);
    body.append(row);
    controls.set(key, control);
    resetButtons.set(key, reset);
  }
}

/** 컨트롤을 현재 값으로 맞춘다. 단축키(Ctrl+Shift+D)처럼 팝업 밖에서 바뀐 값도 따라온다 */
function sync(key: SettingKey): void {
  const value = getSetting(key);
  const control = controls.get(key)!;
  if (document.activeElement !== control || control instanceof HTMLSelectElement) control.value = String(value);
  resetButtons.get(key)!.hidden = value === SETTINGS[key].default;
}

export function initSettingsDialog(): { open(): void } {
  build();
  for (const key of SETTING_KEYS) sync(key);
  onSettingChange(sync);

  dialog.querySelector("#settings-reset")!.addEventListener("click", resetSettings);
  // 바깥(backdrop)을 누르면 닫는다
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    open() {
      if (dialog.open) return;
      dialog.showModal();
      controls.values().next().value?.focus();
    },
  };
}
