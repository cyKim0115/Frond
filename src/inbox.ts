/**
 * AI 훅이 만든 문서 받은 목록 (로드맵 3-6) — 순수 함수와 저장. 화면은 inbox-panel.ts.
 * 훅(integrations/open-new-md.ps1)이 `--from-hook=<출처>`를 붙여 넘긴 문서는 보던 문서를 바꾸지 않고 여기 쌓는다.
 * 항목은 새것이 앞이고, 같은 경로가 다시 오면 맨 앞으로 옮겨 다시 안 읽음이 된다.
 */

import { readPref, writePref } from "./prefs";
import { samePath } from "./recent";

export const INBOX_LIMIT = 50;
const KEY = "inbox";

export interface InboxEntry {
  path: string;
  /** 훅 출처 — `claude`·`codex`·그 밖(`ai`) */
  source: string;
  /** 받은 시각 (ms) */
  at: number;
  read: boolean;
  /** 문서 제목(front matter title → 첫 H1) — 받은 뒤 읽어서 채운다 */
  title?: string;
}

export function addInbox(list: readonly InboxEntry[], entry: InboxEntry): InboxEntry[] {
  return [entry, ...list.filter((e) => !samePath(e.path, entry.path))].slice(0, INBOX_LIMIT);
}

export function markInboxRead(list: readonly InboxEntry[], path: string): InboxEntry[] {
  return list.some((e) => !e.read && samePath(e.path, path)) ? list.map((e) => (samePath(e.path, path) ? { ...e, read: true } : e)) : [...list];
}

export function retitleInbox(list: readonly InboxEntry[], path: string, title: string | undefined): InboxEntry[] {
  return list.map((e) => {
    if (!samePath(e.path, path)) return e;
    const { title: _old, ...rest } = e;
    return title ? { ...rest, title } : rest;
  });
}

export function removeInbox(list: readonly InboxEntry[], path: string): InboxEntry[] {
  return list.filter((e) => !samePath(e.path, path));
}

export const unreadCount = (list: readonly InboxEntry[]): number => list.filter((e) => !e.read).length;

/** 출처 표시 이름 */
export function sourceLabel(source: string): string {
  if (source === "claude") return "Claude Code";
  if (source === "codex") return "Codex";
  return "AI";
}

function toEntry(value: unknown): InboxEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.path !== "string" || v.path === "" || typeof v.at !== "number" || !Number.isFinite(v.at)) return null;
  const entry: InboxEntry = {
    path: v.path,
    source: typeof v.source === "string" && v.source !== "" ? v.source : "ai",
    at: v.at,
    read: v.read === true,
  };
  if (typeof v.title === "string" && v.title.trim() !== "") entry.title = v.title.trim();
  return entry;
}

export function loadInbox(): InboxEntry[] {
  return readPref<unknown[]>(KEY, [], (v): v is unknown[] => Array.isArray(v))
    .map(toEntry)
    .filter((e): e is InboxEntry => e !== null)
    .slice(0, INBOX_LIMIT);
}

export function saveInbox(list: readonly InboxEntry[]): void {
  writePref(KEY, list);
}
