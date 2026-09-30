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

let userThemes: readonly ThemeDef[] = [];

/** 사용자 테마 목록을 바꾼다 (S-4 가져오기·삭제). 내장 id와 겹치는 항목은 버린다 */
export function setUserThemes(list: readonly ThemeDef[]): void {
  userThemes = list.filter((t) => !isBuiltinTheme(t.id));
}

/** 내장 → 사용자 순서 */
export function listThemes(): readonly ThemeDef[] {
  return [...BUILTIN_THEMES, ...userThemes];
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
