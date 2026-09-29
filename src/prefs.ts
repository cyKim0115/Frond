/**
 * UI 상태(탐색 영역 열림·탭·목차 폭·최근 파일)를 localStorage에 남긴다.
 * 저장소가 막히거나 값이 깨져도 앱은 기본값으로 돈다 — 문서 파일 I/O와 달리 잃어도 되는 상태만 둔다.
 */

const PREFIX = "mdeditor.";

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
