/**
 * 사용자 설정 — `SETTINGS`에 항목을 하나 더하면 설정 팝업(settings-dialog.ts)의 해당 카테고리 탭에 자동으로 나타난다.
 * 값은 localStorage 한 곳(`mdeditor.settings`)에 모아 두고, 범위·선택지를 벗어난 값은 읽을 때 바로잡는다.
 * 적용은 구독자(main.ts `applySetting`)가 맡는다. 항목·탭을 더할 때는 `add-setting` 스킬을 따른다.
 */

import { readPref, writePref } from "./prefs";
import { listThemes, type ThemeBase } from "./theme/themes";

/** 설정 팝업 왼쪽 탭 — id·라벨·순서는 여기 한 곳에서만 정한다. 자주 쓰는 것을 위에 둔다 */
export const SETTING_CATEGORIES = [
  { id: "view", label: "보기" },
  { id: "edit", label: "편집" },
  { id: "theme", label: "테마" },
  { id: "nav", label: "탐색" },
  { id: "file", label: "파일" },
] as const;
export type CategoryId = (typeof SETTING_CATEGORIES)[number]["id"];

interface BaseDef {
  /** `SETTING_CATEGORIES`의 id — 이 항목이 보일 탭 */
  section: CategoryId;
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
export interface SelectOption {
  value: string;
  label: string;
}
export interface SelectDef extends BaseDef {
  kind: "select";
  default: string;
  /** 고정 목록, 또는 읽을 때마다 새로 만드는 동적 목록(예: 내장 + 가져온 테마) */
  options: readonly SelectOption[] | (() => readonly SelectOption[]);
}
export type SettingDef = NumberDef | SelectDef;

/** 테마 목록(내장 + 가져온 테마) — `base`를 주면 그쪽 테마만 */
const themeOptions = (base?: ThemeBase) => (): SelectOption[] =>
  listThemes()
    .filter((t) => base === undefined || t.base === base)
    .map((t) => ({ value: t.id, label: t.name }));

export const SETTINGS = {
  theme: {
    kind: "select",
    section: "theme",
    label: "테마",
    hint: "Ctrl+Shift+D로 아래 라이트·다크 테마 사이를 오갑니다",
    default: "system",
    options: () => [{ value: "system", label: "시스템 설정 따르기" }, ...themeOptions()()],
  },
  themeLight: {
    kind: "select",
    section: "theme",
    label: "라이트 테마",
    hint: "'시스템 설정 따르기'에서 Windows가 라이트 모드일 때 쓰는 테마",
    default: "light",
    options: themeOptions("light"),
  },
  themeDark: {
    kind: "select",
    section: "theme",
    label: "다크 테마",
    hint: "'시스템 설정 따르기'에서 Windows가 다크 모드일 때 쓰는 테마",
    default: "dark",
    options: themeOptions("dark"),
  },
  themeTransitionMs: {
    kind: "number",
    section: "theme",
    label: "테마 전환 시간",
    hint: "테마를 바꿀 때 색이 서서히 바뀌는 시간. 0이면 바로 바뀝니다. Windows에서 애니메이션 효과를 끄면 항상 바로 바뀝니다",
    default: 250,
    min: 0,
    max: 1000,
    step: 50,
    unit: "ms",
  },
  bodyMaxWidth: {
    kind: "number",
    section: "view",
    label: "본문 최대 폭",
    hint: "창이 넓어도 본문 줄 길이를 이 폭으로 제한합니다",
    default: 860,
    min: 480,
    max: 1920,
    step: 20,
    unit: "px",
  },
  statusCount: {
    kind: "select",
    section: "view",
    label: "상태바 글자 수",
    hint: "보기 화면에 그려진 본문을 셉니다(마크다운 기호·링크 주소 제외). 한글·영문은 띄어쓰기 단위, 한자·가나는 한 글자를 한 단어로 셉니다. 상태바에서 눌러도 바뀝니다",
    default: "words",
    options: [
      { value: "words", label: "단어 수" },
      { value: "chars", label: "글자 수 (공백 포함)" },
      { value: "charsNoSpace", label: "글자 수 (공백 제외)" },
      { value: "off", label: "표시 안 함" },
    ],
  },
  headingScrollOffset: {
    kind: "number",
    section: "nav",
    label: "제목 이동 시 위쪽 여백",
    hint: "목차나 문서 안 링크로 제목에 이동할 때 제목 위에 남길 간격",
    default: 24,
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  editorFontSize: {
    kind: "number",
    section: "edit",
    label: "소스 글자 크기",
    hint: "소스 모드(Ctrl+/) 편집기의 글자 크기. Ctrl+±로 늘리고 줄이는 배율은 따로 곱해집니다",
    default: 15,
    min: 11,
    max: 28,
    step: 1,
    unit: "px",
  },
  editorLineWrap: {
    kind: "select",
    section: "edit",
    label: "소스 줄바꿈",
    hint: "줄바꿈을 켜면 본문처럼 '본문 최대 폭' 안에서 가운데 한 단으로 보입니다",
    default: "wrap",
    options: [
      { value: "wrap", label: "창 폭에 맞춰 줄바꿈" },
      { value: "nowrap", label: "줄바꿈 없음 (가로 스크롤)" },
    ],
  },
  openMode: {
    kind: "select",
    section: "edit",
    label: "파일을 열 때",
    default: "view",
    options: [
      { value: "view", label: "보기 모드로" },
      { value: "source", label: "소스 모드로" },
    ],
  },
  draftIntervalSec: {
    kind: "number",
    section: "file",
    label: "초안 백업 간격",
    hint: "저장하지 않은 편집을 이 간격으로 %APPDATA%\\Frond\\drafts에 남깁니다. 강제 종료 뒤 같은 파일을 열면 복구를 제안합니다. 0이면 끕니다",
    default: 60,
    min: 0,
    max: 300,
    step: 15,
    unit: "초",
  },
  hookDocs: {
    kind: "select",
    section: "nav",
    label: "AI 훅이 만든 문서",
    hint: "Claude Code·Codex 훅(integrations/)이 새 md를 만들었을 때. 쌓아 두면 보던 문서·스크롤이 그대로이고 창도 앞으로 오지 않습니다. 탐색기에서 연 파일은 늘 바로 엽니다",
    default: "inbox",
    options: [
      { value: "inbox", label: "'새 문서' 목록에 쌓기" },
      { value: "background", label: "뒤 탭으로 열기 (목록에도)" },
      { value: "open", label: "바로 열기 (창을 앞으로)" },
    ],
  },
  restoreSession: {
    kind: "select",
    section: "nav",
    label: "시작할 때",
    hint: "지난번에 열어 둔 탭(문서·보기/소스·보던 위치)을 다시 엽니다. 저장하지 않은 편집은 초안 복구로 되살립니다",
    default: "restore",
    options: [
      { value: "restore", label: "지난번 탭 다시 열기" },
      { value: "none", label: "빈 창으로 시작" },
    ],
  },
  recentMax: {
    kind: "number",
    section: "nav",
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
  const options = typeof def.options === "function" ? def.options() : def.options;
  return options.some((o) => o.value === raw) ? (raw as string) : undefined;
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
