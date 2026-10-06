/**
 * 세션 복원 (로드맵 3-5) — 열린 탭(경로·모드·보던 줄)과 활성 탭을 localStorage에 남겼다가 다음 실행 때 다시 연다.
 * 문서 내용은 남기지 않는다 — 저장하지 않은 편집은 초안 백업(2-4)이 맡는다. 값이 깨졌으면 버리고 빈 세션으로 시작한다.
 */

import { readPref, writePref } from "./prefs";

export type SessionMode = "view" | "source" | "split";

export interface SessionTab {
  path: string;
  mode: SessionMode;
  /** 보던 소스 줄 (0 기준) — 보기는 화면 맨 위 블록, 소스는 편집기 맨 위 줄 */
  line: number;
}

export interface Session {
  tabs: SessionTab[];
  /** 활성 탭 번호 (`tabs` 안) */
  active: number;
}

const KEY = "session";
const MODES: readonly string[] = ["view", "source", "split"];

function isSessionTab(value: unknown): value is SessionTab {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.path === "string" &&
    t.path !== "" &&
    typeof t.mode === "string" &&
    MODES.includes(t.mode) &&
    typeof t.line === "number" &&
    Number.isInteger(t.line) &&
    t.line >= 0
  );
}

/** 저장된 값을 읽어 고칠 수 있는 만큼 고친다 — 잘못된 탭은 빼고 활성 번호는 범위 안으로 */
export function normalizeSession(value: unknown): Session | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.tabs)) return null;
  const tabs = raw.tabs.filter(isSessionTab).map(({ path, mode, line }) => ({ path, mode, line }));
  if (tabs.length === 0) return null;
  const active = typeof raw.active === "number" && Number.isInteger(raw.active) ? raw.active : 0;
  return { tabs, active: Math.min(tabs.length - 1, Math.max(0, active)) };
}

export function readSession(): Session | null {
  return normalizeSession(readPref<unknown>(KEY, null, (_v): _v is unknown => true));
}

export function writeSession(session: Session | null): void {
  writePref(KEY, session && session.tabs.length > 0 ? session : null);
}
