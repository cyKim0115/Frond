/**
 * UI 상태(탐색 영역 열림·탭·목차 폭·최근 파일)를 localStorage에 남긴다.
 * 저장소가 막히거나 값이 깨져도 앱은 기본값으로 돈다 — 문서 파일 I/O와 달리 잃어도 되는 상태만 둔다.
 */

const PREFIX = "frond.";
/** 2026-10-06 이름 정리(frond-rename.md) 전 접두사 */
const OLD_PREFIX = "mdeditor.";

/**
 * 첫 실행 때 한 번 — `frond.` 키가 하나도 없고 `mdeditor.` 키가 있으면 전부 `frond.`로 복사한다. 옛 키는 지우지 않는다
 * (옛 설치본으로 돌아가도 동작). 옮긴 키 수를 돌려준다. 모듈을 처음 불러올 때 돌아서 어떤 값을 읽기보다 먼저다
 */
export function migrateLegacyPrefs(storage: Storage = localStorage): number {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) keys.push(key);
    }
    if (keys.some((key) => key.startsWith(PREFIX))) return 0;
    let copied = 0;
    for (const key of keys) {
      if (!key.startsWith(OLD_PREFIX)) continue;
      const value = storage.getItem(key);
      if (value === null) continue;
      storage.setItem(PREFIX + key.slice(OLD_PREFIX.length), value);
      copied++;
    }
    return copied;
  } catch {
    return 0; // 저장소가 막혀도 앱은 기본값으로 돈다
  }
}
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
