/**
 * 사용자 설정 — `SETTINGS`에 항목을 하나 더하면 설정 팝업(settings-dialog.ts)에 자동으로 나타난다.
 * 값은 localStorage 한 곳(`mdeditor.settings`)에 모아 두고, 범위·선택지를 벗어난 값은 읽을 때 바로잡는다.
 * 적용은 구독자(main.ts `applySetting`)가 맡는다.
 */

import { readPref, writePref } from "./prefs";

interface BaseDef {
  section: string;
  label: string;
  hint?: string;
}
export interface NumberDef extends BaseDef {
  kind: "number";
  default: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}
export interface SelectDef extends BaseDef {
  kind: "select";
  default: string;
  options: readonly { value: string; label: string }[];
}
export type SettingDef = NumberDef | SelectDef;

export const SETTINGS = {
  theme: {
    kind: "select",
    section: "보기",
    label: "테마",
    hint: "Ctrl+Shift+D로도 바꿀 수 있습니다",
    default: "system",
    options: [
      { value: "system", label: "시스템 설정 따르기" },
      { value: "light", label: "라이트" },
      { value: "dark", label: "다크" },
    ],
  },
  bodyMaxWidth: {
    kind: "number",
    section: "보기",
    label: "본문 최대 폭",
    hint: "창이 넓어도 본문 줄 길이를 이 폭으로 제한합니다",
    default: 860,
    min: 480,
    max: 1920,
    step: 20,
    unit: "px",
  },
  headingScrollOffset: {
    kind: "number",
    section: "탐색",
    label: "제목 이동 시 위쪽 여백",
    hint: "목차나 문서 안 링크로 제목에 이동할 때 제목 위에 남길 간격",
    default: 24,
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  recentMax: {
    kind: "number",
    section: "탐색",
    label: "최근 파일 개수",
    default: 20,
    min: 1,
    max: 100,
    step: 1,
    unit: "개",
  },
} satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = (typeof SETTINGS)[K] extends NumberDef ? number : string;
type Values = { [K in SettingKey]: SettingValue<K> };

const KEY = "settings";
export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

/** 저장된 값이나 입력값을 정의에 맞춘다. 맞출 수 없으면 undefined (→ 기본값) */
export function normalizeSetting(def: SettingDef, raw: unknown): number | string | undefined {
  if (def.kind === "number") {
    const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    const stepped = def.min + Math.round((n - def.min) / def.step) * def.step;
    return Math.min(def.max, Math.max(def.min, stepped));
  }
  return def.options.some((o) => o.value === raw) ? (raw as string) : undefined;
}

function defaults(): Values {
  return Object.fromEntries(SETTING_KEYS.map((k) => [k, SETTINGS[k].default])) as Values;
}

function load(): Values {
  const stored = readPref<Record<string, unknown>>(KEY, {}, (v): v is Record<string, unknown> => typeof v === "object" && v !== null);
  const values = defaults();
  for (const k of SETTING_KEYS) {
    const v = normalizeSetting(SETTINGS[k], stored[k]);
    if (v !== undefined) (values as Record<string, unknown>)[k] = v;
  }
  return values;
}

let values = load();
const listeners = new Set<(key: SettingKey) => void>();

export function getSetting<K extends SettingKey>(key: K): SettingValue<K> {
  return values[key];
}

/** 정의에 맞춰 저장하고 구독자에게 알린다. 실제로 저장된 값을 돌려준다 */
export function setSetting<K extends SettingKey>(key: K, raw: unknown): SettingValue<K> {
  const next = (normalizeSetting(SETTINGS[key], raw) ?? SETTINGS[key].default) as SettingValue<K>;
  if (values[key] !== next) {
    values = { ...values, [key]: next };
    writePref(KEY, values);
    for (const listener of listeners) listener(key);
  }
  return next;
}

export function resetSettings(): void {
  for (const k of SETTING_KEYS) setSetting(k, SETTINGS[k].default);
}

export function onSettingChange(listener: (key: SettingKey) => void): void {
  listeners.add(listener);
}

/** 테스트용 — 저장소를 바꾼 뒤 다시 읽는다 */
export function reloadSettings(): void {
  values = load();
}
