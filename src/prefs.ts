/**
 * UI 상태(탐색 영역 열림·탭·목차 폭·최근 파일)를 localStorage에 남긴다.
 * 저장소가 막히거나 값이 깨져도 앱은 기본값으로 돈다 — 문서 파일 I/O와 달리 잃어도 되는 상태만 둔다.
 */

const PREFIX = "frond.";
/** 앱 이름이 MdEditor였던 2026-10-06 전의 접두사 — 첫 실행 때 한 번 옮긴다 */
const LEGACY_PREFIX = "mdeditor.";

/**
 * 옛 `mdeditor.*` 키를 `frond.*`로 복사한다. `frond.` 키가 하나라도 있으면 이미 옮겼거나 새로 쓰기 시작한 것이라 건드리지 않는다.
 * 옛 키는 지우지 않는다 — 옛 설치본으로 돌아가도 그대로 돈다.
 */
export function migrateLegacyPrefs(storage: Storage = localStorage): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) keys.push(key);
    }
    if (keys.some((key) => key.startsWith(PREFIX))) return;
    for (const key of keys) {
      if (!key.startsWith(LEGACY_PREFIX)) continue;
      const value = storage.getItem(key);
      if (value !== null) storage.setItem(PREFIX + key.slice(LEGACY_PREFIX.length), value);
    }
  } catch {
    // 저장소가 막혀 있으면 옮기지 않는다 — 기본값으로 돈다
  }
}

// 이 모듈을 거치지 않고는 아무도 저장값을 읽지 않으므로, 첫 읽기 전에 여기서 한 번이면 된다
migrateLegacyPrefs();

export function readPref<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 실패(용량·차단)는 무시한다 — 다음 실행에서 기본값
  }
}

export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
export const isString = (value: unknown): value is string => typeof value === "string";
export const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
