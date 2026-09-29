/**
 * 최근 파일 목록 — 순수 함수와 저장. 경로는 백엔드 `load_document`가 canonicalize한 절대 경로다.
 * 화면(nav.ts)은 이 함수들이 돌려준 새 배열로 다시 그린다.
 */

import { readPref, writePref } from "./prefs";

/** 저장 상한 — 보이는 개수는 설정 `recentMax`(≤ 이 값)가 정한다 */
export const RECENT_LIMIT = 100;
const KEY = "recent";

/** Windows 경로는 대소문자를 가리지 않는다 */
export function samePath(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** 맨 앞에 넣고, 같은 경로는 한 번만 남기고, `max`개로 자른다 */
export function pushRecent(list: readonly string[], path: string, max: number): string[] {
  return [path, ...list.filter((p) => !samePath(p, path))].slice(0, max);
}

export function removeRecent(list: readonly string[], path: string): string[] {
  return list.filter((p) => !samePath(p, path));
}

/** 목록 표시용 — 파일 이름과 폴더 */
export function splitPath(path: string): { name: string; dir: string } {
  const i = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  return i < 0 ? { name: path, dir: "" } : { name: path.slice(i + 1), dir: path.slice(0, i) };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((p) => typeof p === "string");

export function loadRecent(): string[] {
  return readPref(KEY, [], isStringArray).slice(0, RECENT_LIMIT);
}

export function saveRecent(list: readonly string[]): void {
  writePref(KEY, list);
}
