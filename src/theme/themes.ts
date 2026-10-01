/**
 * 테마 정의 (로드맵 S-2) — 내장 라이트·다크와 사용자 테마(S-4)가 같은 형식을 쓴다.
 *
 * - 셸 토큰(`SHELL_TOKENS`) → `:root`의 `--fg` `--bg` … (src/style.css가 쓰는 이름)
 * - 문서 토큰(`DOC_TOKENS`) → `.markdown-body` 팔레트(github-markdown-css 변수 이름) + 선택 영역 색. 편집기(CM6)도 같은 토큰을 쓴다
 * - 빠진 토큰은 `base` 쪽 내장 테마 값으로 채운다 (`resolveTheme`)
 *
 * 적용은 `themeCss()`가 만든 `:root`·`.markdown-body`·`.cm-editor` 변수 한 벌을 `<style id="theme-vars">`에 쓰는 방식이다
 * (`applyTheme`). 화면에만 적용하고(`@media screen`) 인쇄는 CSS의 라이트 팔레트를 그대로 쓴다.
 * 내장 값은 github-markdown.css·style.css·dark.css의 CSS 팔레트와 같다 — 그쪽은 JS 적용 전 첫 그림과 인쇄용 대체값이다.
 */

import { readPref, writePref } from "../prefs";

export type ThemeBase = "light" | "dark";

export const SHELL_TOKENS = [
  "fg",
  "bg",
  "muted",
  "line",
  "accent",
  "on-accent",
  "danger",
  "sidebar-bg",
] as const;
export type ShellToken = (typeof SHELL_TOKENS)[number];

export const DOC_TOKENS = [
  "fgColor-danger",
  "bgColor-attention-muted",
  "bgColor-muted",
  "bgColor-neutral-muted",
  "borderColor-accent-emphasis",
  "borderColor-attention-emphasis",
  "borderColor-danger-emphasis",
  "borderColor-default",
  "borderColor-done-emphasis",
  "borderColor-success-emphasis",
  "color-prettylights-syntax-brackethighlighter-angle",
  "color-prettylights-syntax-brackethighlighter-unmatched",
  "color-prettylights-syntax-carriage-return-bg",
  "color-prettylights-syntax-carriage-return-text",
  "color-prettylights-syntax-comment",
  "color-prettylights-syntax-constant",
  "color-prettylights-syntax-constant-other-reference-link",
  "color-prettylights-syntax-entity",
  "color-prettylights-syntax-entity-tag",
  "color-prettylights-syntax-keyword",
  "color-prettylights-syntax-markup-changed-bg",
  "color-prettylights-syntax-markup-changed-text",
  "color-prettylights-syntax-markup-deleted-bg",
  "color-prettylights-syntax-markup-deleted-text",
  "color-prettylights-syntax-markup-heading",
  "color-prettylights-syntax-markup-ignored-bg",
  "color-prettylights-syntax-markup-ignored-text",
  "color-prettylights-syntax-markup-inserted-bg",
  "color-prettylights-syntax-markup-inserted-text",
  "color-prettylights-syntax-markup-list",
  "color-prettylights-syntax-meta-diff-range",
  "color-prettylights-syntax-string",
  "color-prettylights-syntax-string-regexp",
  "color-prettylights-syntax-sublimelinter-gutter-mark",
  "color-prettylights-syntax-variable",
  "fgColor-accent",
  "fgColor-attention",
  "fgColor-done",
  "fgColor-muted",
  "fgColor-success",
  "bgColor-default",
  "borderColor-muted",
  "color-prettylights-syntax-markup-bold",
  "color-prettylights-syntax-markup-italic",
  "color-prettylights-syntax-storage-modifier-import",
  "fgColor-default",
  "selection-bg",
  "selection-bg-inactive",
] as const;
export type DocToken = (typeof DOC_TOKENS)[number];

export interface ThemeDef {
  /** 설정 `theme`에 저장되는 값. 내장은 `light`·`dark` */
  id: string;
  /** 목록에 보이는 이름 */
  name: string;
  /** 빠진 토큰을 채울 내장 테마, `color-scheme`(스크롤바·폼 컨트롤), 시스템 설정용 라이트·다크 쌍 분류 */
  base: ThemeBase;
  shell?: Partial<Record<ShellToken, string>>;
  doc?: Partial<Record<DocToken, string>>;
}

export interface ResolvedTheme {
  id: string;
  name: string;
  base: ThemeBase;
  shell: Record<ShellToken, string>;
  doc: Record<DocToken, string>;
}

const LIGHT = {
  id: "light",
  name: "라이트",
  base: "light",
  shell: {
    "fg": "#1f2328",
    "bg": "#ffffff",
    "muted": "#59636e",
    "line": "#d0d7de",
    "accent": "#0969da",
    "on-accent": "#ffffff",
    "danger": "#cf222e",
    "sidebar-bg": "#f6f8fa",
  },
  doc: {
    "fgColor-danger": "#d1242f",
    "bgColor-attention-muted": "#fff8c5",
    "bgColor-muted": "#f6f8fa",
    "bgColor-neutral-muted": "#818b981f",
    "borderColor-accent-emphasis": "#0969da",
    "borderColor-attention-emphasis": "#9a6700",
    "borderColor-danger-emphasis": "#cf222e",
    "borderColor-default": "#d1d9e0",
    "borderColor-done-emphasis": "#8250df",
    "borderColor-success-emphasis": "#1a7f37",
    "color-prettylights-syntax-brackethighlighter-angle": "#59636e",
    "color-prettylights-syntax-brackethighlighter-unmatched": "#82071e",
    "color-prettylights-syntax-carriage-return-bg": "#cf222e",
    "color-prettylights-syntax-carriage-return-text": "#f6f8fa",
    "color-prettylights-syntax-comment": "#59636e",
    "color-prettylights-syntax-constant": "#0550ae",
    "color-prettylights-syntax-constant-other-reference-link": "#0a3069",
    "color-prettylights-syntax-entity": "#6639ba",
    "color-prettylights-syntax-entity-tag": "#0550ae",
    "color-prettylights-syntax-keyword": "#cf222e",
    "color-prettylights-syntax-markup-changed-bg": "#ffd8b5",
    "color-prettylights-syntax-markup-changed-text": "#953800",
    "color-prettylights-syntax-markup-deleted-bg": "#ffebe9",
    "color-prettylights-syntax-markup-deleted-text": "#82071e",
    "color-prettylights-syntax-markup-heading": "#0550ae",
    "color-prettylights-syntax-markup-ignored-bg": "#0550ae",
    "color-prettylights-syntax-markup-ignored-text": "#d1d9e0",
    "color-prettylights-syntax-markup-inserted-bg": "#dafbe1",
    "color-prettylights-syntax-markup-inserted-text": "#116329",
    "color-prettylights-syntax-markup-list": "#3b2300",
    "color-prettylights-syntax-meta-diff-range": "#8250df",
    "color-prettylights-syntax-string": "#0a3069",
    "color-prettylights-syntax-string-regexp": "#116329",
    "color-prettylights-syntax-sublimelinter-gutter-mark": "#818b98",
    "color-prettylights-syntax-variable": "#953800",
    "fgColor-accent": "#0969da",
    "fgColor-attention": "#9a6700",
    "fgColor-done": "#8250df",
    "fgColor-muted": "#59636e",
    "fgColor-success": "#1a7f37",
    "bgColor-default": "#ffffff",
    "borderColor-muted": "#d1d9e0b3",
    "color-prettylights-syntax-markup-bold": "#1f2328",
    "color-prettylights-syntax-markup-italic": "#1f2328",
    "color-prettylights-syntax-storage-modifier-import": "#1f2328",
    "fgColor-default": "#1f2328",
    "selection-bg": "rgba(9, 105, 218, 0.24)",
    "selection-bg-inactive": "rgba(9, 105, 218, 0.14)",
  },
} satisfies ResolvedTheme;

const DARK = {
  id: "dark",
  name: "다크",
  base: "dark",
  shell: {
    "fg": "#e6edf3",
    "bg": "#0d1117",
    "muted": "#9198a1",
    "line": "#30363d",
    "accent": "#58a6ff",
    "on-accent": "#0d1117",
    "danger": "#f85149",
    "sidebar-bg": "#161b22",
  },
  doc: {
    "fgColor-danger": "#f85149",
    "bgColor-attention-muted": "#bb800926",
    "bgColor-muted": "#151b23",
    "bgColor-neutral-muted": "#656c7633",
    "borderColor-accent-emphasis": "#1f6feb",
    "borderColor-attention-emphasis": "#9e6a03",
    "borderColor-danger-emphasis": "#da3633",
    "borderColor-default": "#3d444d",
    "borderColor-done-emphasis": "#8957e5",
    "borderColor-success-emphasis": "#238636",
    "color-prettylights-syntax-brackethighlighter-angle": "#9198a1",
    "color-prettylights-syntax-brackethighlighter-unmatched": "#f85149",
    "color-prettylights-syntax-carriage-return-bg": "#b62324",
    "color-prettylights-syntax-carriage-return-text": "#f0f6fc",
    "color-prettylights-syntax-comment": "#9198a1",
    "color-prettylights-syntax-constant": "#79c0ff",
    "color-prettylights-syntax-constant-other-reference-link": "#a5d6ff",
    "color-prettylights-syntax-entity": "#d2a8ff",
    "color-prettylights-syntax-entity-tag": "#7ee787",
    "color-prettylights-syntax-keyword": "#ff7b72",
    "color-prettylights-syntax-markup-changed-bg": "#5a1e02",
    "color-prettylights-syntax-markup-changed-text": "#ffdfb6",
    "color-prettylights-syntax-markup-deleted-bg": "#67060c",
    "color-prettylights-syntax-markup-deleted-text": "#ffdcd7",
    "color-prettylights-syntax-markup-heading": "#1f6feb",
    "color-prettylights-syntax-markup-ignored-bg": "#1158c7",
    "color-prettylights-syntax-markup-ignored-text": "#f0f6fc",
    "color-prettylights-syntax-markup-inserted-bg": "#033a16",
    "color-prettylights-syntax-markup-inserted-text": "#aff5b4",
    "color-prettylights-syntax-markup-list": "#f2cc60",
    "color-prettylights-syntax-meta-diff-range": "#d2a8ff",
    "color-prettylights-syntax-string": "#a5d6ff",
    "color-prettylights-syntax-string-regexp": "#7ee787",
    "color-prettylights-syntax-sublimelinter-gutter-mark": "#3d444d",
    "color-prettylights-syntax-variable": "#ffa657",
    "fgColor-accent": "#4493f8",
    "fgColor-attention": "#d29922",
    "fgColor-done": "#ab7df8",
    "fgColor-muted": "#9198a1",
    "fgColor-success": "#3fb950",
    "bgColor-default": "#0d1117",
    "borderColor-muted": "#3d444db3",
    "color-prettylights-syntax-markup-bold": "#f0f6fc",
    "color-prettylights-syntax-markup-italic": "#f0f6fc",
    "color-prettylights-syntax-storage-modifier-import": "#f0f6fc",
    "fgColor-default": "#f0f6fc",
    "selection-bg": "rgba(88, 166, 255, 0.36)",
    "selection-bg-inactive": "rgba(88, 166, 255, 0.2)",
  },
} satisfies ResolvedTheme;

/** 내장 테마 — 지우거나 고칠 수 없다. `base`로 쓰이므로 두 개 모두 모든 토큰을 갖는다 */
export const BUILTIN_THEMES: readonly ResolvedTheme[] = [LIGHT, DARK];
const BUILTIN_BY_BASE: Record<ThemeBase, ResolvedTheme> = { light: LIGHT, dark: DARK };

export function isBuiltinTheme(id: string): boolean {
  return BUILTIN_THEMES.some((t) => t.id === id);
}

/**
 * 사용자 테마 — 진짜 원본은 테마 폴더(`%APPDATA%\MdEditor\themes`, 백엔드 themes.rs)다.
 * 폴더는 비동기로 읽히므로 마지막 목록을 localStorage에 캐시해 두고 시작할 때 동기로 쓴다 — 설정 모듈이
 * 저장된 `theme: "내-테마"`를 읽는 순간 목록에 없으면 기본값으로 되돌려 버리기 때문이다
 */
const CACHE_KEY = "userThemes";
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
/** 처음 쓸 때 캐시에서 읽는다 — 모듈 초기화 중에 아래의 검증 상수를 쓰지 않게 */
let userThemes: readonly ThemeDef[] | null = null;
function users(): readonly ThemeDef[] {
  userThemes ??= readPref(CACHE_KEY, [], isArray).flatMap((raw) => {
    const parsed = validateTheme(raw, "");
    return parsed.ok ? [parsed.theme] : [];
  });
  return userThemes;
}

/** 사용자 테마 목록을 바꾸고 캐시한다 (S-4 가져오기·삭제·폴더 다시 읽기). 내장 id와 겹치는 항목은 버린다 */
export function setUserThemes(list: readonly ThemeDef[]): void {
  userThemes = list.filter((t) => !isBuiltinTheme(t.id));
  writePref(CACHE_KEY, userThemes);
}

/** 내장 → 사용자 순서 */
export function listThemes(): readonly ThemeDef[] {
  return [...BUILTIN_THEMES, ...users()];
}

export function findTheme(id: string): ThemeDef | undefined {
  return listThemes().find((t) => t.id === id);
}

/** 빠진 토큰을 `base` 내장 테마로 채운다 */
export function resolveTheme(def: ThemeDef): ResolvedTheme {
  const base = BUILTIN_BY_BASE[def.base];
  return {
    id: def.id,
    name: def.name,
    base: def.base,
    shell: { ...base.shell, ...def.shell },
    doc: { ...base.doc, ...def.doc },
  };
}

/**
 * 테마 변수 CSS. 셀렉터 우선순위를 CSS 대체 팔레트(`:root[data-theme="dark"] .markdown-body` 등)보다 높게 잡는다 —
 * `html:root[data-theme]`는 JS가 항상 `data-theme`(= base)을 달아 두므로 늘 맞는다
 */
export function themeCss(theme: ResolvedTheme): string {
  const shell = SHELL_TOKENS.map((k) => `--${k}: ${theme.shell[k]};`).join(" ");
  const doc = DOC_TOKENS.map((k) => `--${k}: ${theme.doc[k]};`).join(" ");
  return (
    "@media screen {\n" +
    `  html:root[data-theme] { color-scheme: ${theme.base}; ${shell} ${doc} }\n` +
    `  html:root[data-theme] .markdown-body, html:root[data-theme] .cm-editor { color-scheme: ${theme.base}; ${doc} }\n` +
    "}\n"
  );
}

/** 문서에 적용한다 — `data-theme`(= base)은 base로 갈리는 CSS 규칙(kbd 테두리 등)이 따른다 */
export function applyTheme(theme: ResolvedTheme): void {
  let style = document.getElementById("theme-vars") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "theme-vars";
    document.head.append(style);
  }
  style.textContent = themeCss(theme);
  document.documentElement.dataset.theme = theme.base;
}

// ---- 전환 연출 (로드맵 S-3) --------------------------------------------------------

/** 셸·문서 색 토큰 CSS 변수 이름 전부 */
export const COLOR_TOKEN_NAMES: readonly string[] = [...SHELL_TOKENS, ...DOC_TOKENS].map((k) => `--${k}`);

let registered = false;

/**
 * 색 토큰을 `<color>`로 등록한다 — 등록된 커스텀 속성만 transition으로 보간된다.
 * 한 번만 하고, 지원하지 않는 환경(테스트 jsdom)에서는 아무것도 하지 않는다
 */
export function registerColorTokens(): boolean {
  if (registered) return true;
  if (typeof CSS === "undefined" || typeof CSS.registerProperty !== "function") return false;
  for (const name of COLOR_TOKEN_NAMES) {
    try {
      CSS.registerProperty({ name, syntax: "<color>", inherits: true, initialValue: "transparent" });
    } catch {
      // 이미 등록됨 (HMR 등)
    }
  }
  registered = true;
  return true;
}

/** 전환 중(`html.theme-anim`)에 토큰을 보간하는 규칙. 토큰 값이 바뀌는 요소(:root·본문·편집기)마다 건다 */
export function themeTransitionCss(ms: number): string {
  const list = COLOR_TOKEN_NAMES.map((n) => `${n} ${ms}ms ease`).join(", ");
  return `html.theme-anim, html.theme-anim .markdown-body, html.theme-anim .cm-editor { transition: ${list}; }\n`;
}

// ---- 테마 파일 (로드맵 S-4) ----------------------------------------------------------
//
// 형식(2026-10-01 확정, docs/decisions/ideas/20260930-theme-file-format.md): 색 토큰만 담는 JSON.
//   { "id": "sepia", "name": "세피아", "base": "light", "shell": { "bg": "#f4ecd8" }, "doc": { "bgColor-default": "#f4ecd8" } }
// id가 없으면 파일 이름. 빠진 토큰은 base 내장 테마 값. 모르는 키는 무시(경고). 임의 CSS·url()·@import는 받지 않는다.

export type ParsedTheme = { ok: true; theme: ThemeDef; warnings: string[] } | { ok: false; errors: string[] };

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const FORBIDDEN_RE = /url\(|@import|expression|[;{}<>\\]/i;

/** CSS 색 값인지 — 웹뷰의 `CSS.supports`로 판정하고, 없으면(테스트) 흔한 형식만 받는다 */
export function isColorValue(value: string): boolean {
  if (FORBIDDEN_RE.test(value)) return false;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") return CSS.supports("color", value);
  return /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\([^()]*\)|[a-z]+)$/i.test(value.trim());
}

function tokenGroup<T extends string>(
  raw: unknown,
  known: readonly T[],
  group: string,
  errors: string[],
  warnings: string[],
): Partial<Record<T, string>> {
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    errors.push(`${group}: 객체여야 합니다`);
    return {};
  }
  const out: Partial<Record<T, string>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(known as readonly string[]).includes(key)) {
      warnings.push(`${group}.${key}: 모르는 토큰이라 무시합니다`);
      continue;
    }
    if (typeof value !== "string" || !isColorValue(value)) {
      errors.push(`${group}.${key}: 색 값이 아닙니다 (${JSON.stringify(value)})`);
      continue;
    }
    out[key as T] = value.trim();
  }
  return out;
}

/** 이미 JSON으로 읽은 값을 테마 정의로 검증한다. `fallbackId`는 파일 이름 */
export function validateTheme(raw: unknown, fallbackId: string): ParsedTheme {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, errors: ["최상위가 JSON 객체가 아닙니다"] };
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id.trim() !== "" ? obj.id.trim() : fallbackId;
  if (!ID_RE.test(id)) errors.push(`id: 영문·숫자로 시작하고 영문·숫자·-·_만 쓸 수 있습니다 (${JSON.stringify(id)})`);
  else if (isBuiltinTheme(id)) errors.push(`id: 내장 테마 이름(${id})은 쓸 수 없습니다`);
  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (name === "" || name.length > 60) errors.push("name: 1–60자 이름이 필요합니다");
  const base = obj.base;
  if (base !== "light" && base !== "dark") errors.push(`base: "light" 또는 "dark"여야 합니다 (${JSON.stringify(base)})`);
  for (const key of Object.keys(obj)) {
    if (!["id", "name", "base", "shell", "doc", "$schema", "description"].includes(key)) warnings.push(`${key}: 모르는 키라 무시합니다`);
  }
  const shell = tokenGroup(obj.shell, SHELL_TOKENS, "shell", errors, warnings);
  const doc = tokenGroup(obj.doc, DOC_TOKENS, "doc", errors, warnings);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, theme: { id, name, base: base as ThemeBase, shell, doc }, warnings };
}

/** 테마 파일 텍스트를 읽는다 */
export function parseThemeFile(text: string, fallbackId: string): ParsedTheme {
  let raw: unknown;
  try {
    raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch (e) {
    return { ok: false, errors: [`JSON 문법 오류: ${(e as Error).message}`] };
  }
  return validateTheme(raw, fallbackId);
}

/** 저장·내보내기용 JSON. `full`이면 빠진 토큰까지 모두 채운다(내장 테마 내보내기·복제의 출발점) */
export function themeToJson(theme: ThemeDef, full = false): string {
  const t = full ? resolveTheme(theme) : theme;
  return `${JSON.stringify({ id: t.id, name: t.name, base: t.base, shell: t.shell ?? {}, doc: t.doc ?? {} }, null, 2)}\n`;
}
