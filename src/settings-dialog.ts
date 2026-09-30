/**
 * 설정 팝업 — 왼쪽 세로 탭(카테고리) + 오른쪽 고른 카테고리의 항목만 (로드맵 S-1, `add-setting` 스킬).
 * 탭은 `SETTING_CATEGORIES`, 항목은 `SETTINGS` 스키마에서 그린다. 스키마로 못 그리는 UI(테마 목록 등)는
 * `addPanel(category, element)`로 그 카테고리 패널 끝에 붙인다.
 * 바꾼 값은 바로 적용·저장된다(저장 버튼 없음).
 * 숫자는 `change`(포커스 이동·Enter·스핀 버튼)에서 확정한다 — 입력 중간값("15"를 치는 동안의 "1")이 적용되지 않게.
 */

import { ICON_RESET, icon } from "./icons";
import { isString, readPref, writePref } from "./prefs";
import {
  type CategoryId,
  getSetting,
  onSettingChange,
  resetSettings,
  SETTING_CATEGORIES,
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
const tabs = new Map<CategoryId, HTMLButtonElement>();
const panels = new Map<CategoryId, HTMLElement>();

function buildControl(key: SettingKey, def: SettingDef): HTMLInputElement | HTMLSelectElement {
  if (def.kind === "select") {
    const select = document.createElement("select");
    fillOptions(select, def);
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

function fillOptions(select: HTMLSelectElement, def: Extract<SettingDef, { kind: "select" }>): void {
  select.replaceChildren(...optionsOf(def).map((o) => new Option(o.label, o.value)));
}

/** 선택지 — 동적 선택지(`options`가 함수, 예: 테마 목록)는 그릴 때마다 다시 묻는다 */
function optionsOf(def: Extract<SettingDef, { kind: "select" }>): readonly { value: string; label: string }[] {
  return typeof def.options === "function" ? def.options() : def.options;
}

function defaultLabel(def: SettingDef): string {
  if (def.kind === "number") return `${def.default}${def.unit ?? ""}`;
  return optionsOf(def).find((o) => o.value === def.default)?.label ?? def.default;
}

function buildRow(key: SettingKey, def: SettingDef): HTMLElement {
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
  reset.title = `기본값(${defaultLabel(def)})으로`;
  reset.setAttribute("aria-label", `${def.label} 기본값으로`);
  reset.append(icon(ICON_RESET));
  reset.addEventListener("click", () => setSetting(key, def.default));
  wrap.append(reset);

  row.append(label, wrap);
  controls.set(key, control);
  resetButtons.set(key, reset);
  return row;
}

function build(): void {
  const tablist = document.createElement("div");
  tablist.id = "settings-tabs";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-orientation", "vertical");
  tablist.setAttribute("aria-label", "설정 분류");
  const panelBox = document.createElement("div");
  panelBox.id = "settings-panels";

  for (const { id, label } of SETTING_CATEGORIES) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `settings-tab-${id}`;
    tab.className = "settings-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `settings-panel-${id}`);
    tab.textContent = label;
    tab.addEventListener("click", () => selectTab(id));
    tablist.append(tab);
    tabs.set(id, tab);

    const panel = document.createElement("section");
    panel.id = `settings-panel-${id}`;
    panel.className = "settings-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    for (const key of SETTING_KEYS) {
      const def: SettingDef = SETTINGS[key];
      if (def.section === id) panel.append(buildRow(key, def));
    }
    panelBox.append(panel);
    panels.set(id, panel);
  }

  // ↑↓·Home·End로 탭 이동, 이동하면 바로 그 탭을 연다 (세로 tablist)
  tablist.addEventListener("keydown", (event) => {
    const order = visibleCategories();
    const at = order.indexOf(selected);
    let next: CategoryId | undefined;
    if (event.key === "ArrowDown") next = order[(at + 1) % order.length];
    else if (event.key === "ArrowUp") next = order[(at - 1 + order.length) % order.length];
    else if (event.key === "Home") next = order[0];
    else if (event.key === "End") next = order[order.length - 1];
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    tabs.get(next)!.focus();
  });

  body.replaceChildren(tablist, panelBox);
}

/** 항목도 커스텀 패널도 없는 카테고리는 탭을 숨긴다 */
function visibleCategories(): CategoryId[] {
  return SETTING_CATEGORIES.map((c) => c.id).filter((id) => panels.get(id)!.childElementCount > 0);
}

let selected: CategoryId = SETTING_CATEGORIES[0].id;

function selectTab(id: CategoryId): void {
  const shown = visibleCategories();
  selected = shown.includes(id) ? id : shown[0];
  for (const [cat, tab] of tabs) {
    const on = cat === selected;
    tab.hidden = !shown.includes(cat);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    panels.get(cat)!.hidden = !on;
  }
  writePref("settingsTab", selected);
}

/** 컨트롤을 현재 값으로 맞춘다. 단축키(Ctrl+Shift+D)처럼 팝업 밖에서 바뀐 값도 따라온다 */
function sync(key: SettingKey): void {
  const value = getSetting(key);
  const control = controls.get(key)!;
  if (document.activeElement !== control || control instanceof HTMLSelectElement) control.value = String(value);
  resetButtons.get(key)!.hidden = value === SETTINGS[key].default;
}

export interface SettingsDialog {
  /** 연다. 카테고리를 주면 그 탭을, 없으면 마지막으로 본 탭을 연다 */
  open(category?: CategoryId): void;
  /** 스키마 밖 UI(목록·버튼)를 그 카테고리 패널 끝에 붙인다 */
  addPanel(category: CategoryId, element: HTMLElement): void;
  /** 동적 선택지(테마 목록 등)가 바뀌었을 때 그 항목의 `<select>`를 다시 채운다 */
  refreshOptions(key: SettingKey): void;
}

export function initSettingsDialog(): SettingsDialog {
  build();
  for (const key of SETTING_KEYS) sync(key);
  onSettingChange(sync);
  const saved = readPref("settingsTab", SETTING_CATEGORIES[0].id as string, isString);
  selectTab(SETTING_CATEGORIES.some((c) => c.id === saved) ? (saved as CategoryId) : SETTING_CATEGORIES[0].id);

  dialog.querySelector("#settings-reset")!.addEventListener("click", resetSettings);
  // 바깥(backdrop)을 누르면 닫는다
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    open(category) {
      if (category) selectTab(category);
      if (!dialog.open) dialog.showModal();
      tabs.get(selected)!.focus();
    },
    addPanel(category, element) {
      panels.get(category)!.append(element);
      selectTab(selected);
    },
    refreshOptions(key) {
      const def: SettingDef = SETTINGS[key];
      const control = controls.get(key);
      if (def.kind !== "select" || !(control instanceof HTMLSelectElement)) return;
      fillOptions(control, def);
      sync(key);
    },
  };
}
