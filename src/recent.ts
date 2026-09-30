/**
 * 최근 파일 목록 — 순수 함수와 저장. 경로는 백엔드 `load_document`가 canonicalize한 절대 경로다.
 * 화면(nav.ts)은 이 함수들이 돌려준 새 배열로 다시 그린다.
 */

import { readPref, writePref } from "./prefs";
import type { TocEntry } from "./render/types";

/** 저장 상한 — 보이는 개수는 설정 `recentMax`(≤ 이 값)가 정한다 */
export const RECENT_LIMIT = 100;
const KEY = "recent";

export interface RecentEntry {
  path: string;
  /** 문서 제목 — 열 때 렌더 결과에서 뽑는다(`docTitle`). 없으면 목록에 파일 이름만 보인다 */
  title?: string;
}

/** Windows 경로는 대소문자를 가리지 않는다 */
export function samePath(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** 맨 앞에 넣고, 같은 경로는 한 번만 남기고, `max`개로 자른다 */
export function pushRecent(list: readonly RecentEntry[], entry: RecentEntry, max: number): RecentEntry[] {
  return [entry, ...list.filter((e) => !samePath(e.path, entry.path))].slice(0, max);
}

export function removeRecent(list: readonly RecentEntry[], path: string): RecentEntry[] {
  return list.filter((e) => !samePath(e.path, path));
}

/** 같은 문서를 다시 읽었을 때(F5·외부 변경) — 순서는 그대로 두고 제목만 바꾼다. 목록에 없으면 그대로 */
export function retitleRecent(list: readonly RecentEntry[], path: string, title: string | undefined): RecentEntry[] {
  return list.map((e) => (samePath(e.path, path) ? toEntry({ path: e.path, title })! : e));
}

/**
 * 최근 목록에 보일 문서 제목. 렌더 결과(목차, front matter 원문)에서 뽑는다.
 * 돌려준 값이 없으면(undefined) 목록은 지금처럼 파일 이름만 보인다.
 *
 * @param toc 문서 순서의 제목들 — `level`(1–6), `text`(인라인 마크업을 뺀 평문)
 * @param frontMatter 맨 위 `---` 블록의 원문(YAML 파싱 전). 없으면 undefined
 */
export function docTitle(toc: readonly TocEntry[], frontMatter?: string): string | undefined {
  // 1) front matter의 최상위 `title:` — 문서가 스스로 밝힌 제목. 들여쓴 줄(중첩 키)은 보지 않는다
  const fm = frontMatter === undefined ? null : FRONT_MATTER_TITLE_RE.exec(frontMatter);
  const fromFrontMatter = fm ? unquoteYaml(fm[1]) : "";
  if (fromFrontMatter !== "") return clip(fromFrontMatter);
  // 2) 첫 H1. `##` 이하는 "개요"·"설치" 같은 절 이름일 때가 많아 제목으로 쓰지 않는다
  const h1 = toc.find((e) => e.level === 1)?.text.trim() ?? "";
  return h1 === "" ? undefined : clip(h1);
}

const FRONT_MATTER_TITLE_RE = /^title:[ \t]*(.*?)[ \t]*$/m;
/** 목록은 한 줄 말줄임이라 길이는 표시에 상관없지만, 저장본(localStorage)이 커지지 않게 자른다 */
const TITLE_MAX = 120;

/** YAML 스칼라 한 줄 — 따옴표를 벗기고 줄 끝 주석(` #…`)을 뗀다. 여러 줄 값(`|`·`>`)은 제목으로 보지 않는다 */
function unquoteYaml(raw: string): string {
  const quoted = /^(["'])(.*)\1$/.exec(raw);
  if (quoted) return quoted[1] === "'" ? quoted[2].replace(/''/g, "'").trim() : quoted[2].trim();
  if (raw === "|" || raw === ">" || /^[|>][+-]?\d*$/.test(raw)) return "";
  return raw.replace(/[ \t]+#.*$/, "").trim();
}

const clip = (title: string): string => (title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1)}…` : title);

/** 목록 표시용 — 파일 이름과 폴더 */
export function splitPath(path: string): { name: string; dir: string } {
  const i = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  return i < 0 ? { name: path, dir: "" } : { name: path.slice(i + 1), dir: path.slice(0, i) };
}

/** 저장본 한 항목 — 지금 형식(`{path, title?}`)과 예전 형식(경로 문자열, 2026-09-29)을 함께 읽는다 */
function toEntry(value: unknown): RecentEntry | null {
  if (typeof value === "string") return { path: value };
  if (typeof value !== "object" || value === null) return null;
  const { path, title } = value as { path?: unknown; title?: unknown };
  if (typeof path !== "string") return null;
  return typeof title === "string" && title.trim() !== "" ? { path, title: title.trim() } : { path };
}

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export function loadRecent(): RecentEntry[] {
  return readPref(KEY, [], isArray)
    .map(toEntry)
    .filter((e): e is RecentEntry => e !== null)
    .slice(0, RECENT_LIMIT);
}

export function saveRecent(list: readonly RecentEntry[]): void {
  writePref(KEY, list);
}
