/**
 * 팔레트 → 테마 — 색 몇 개(역할)에서 셸·문서 토큰을 만든다. 내장 라이트·다크(themes.ts)와 추천 테마(recommended.ts)가 같이 쓴다.
 *
 * 역할 5개(배경·보조면·글자·강조·보조 강조)만 정하고 나머지 토큰은 섞기·대비로 만든다(`paletteTheme`).
 * 강조색이 배경과 대비가 모자라면 색상은 두고 밝기만 옮겨 WCAG 4.5:1을 맞춘다(`readable`)
 */

import type { ThemeBase, ThemeDef } from "./themes";

// ---- 색 계산 ------------------------------------------------------------------------

type Rgb = [number, number, number];

function parse(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function toHex(c: Rgb): string {
  return `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** `a`에 `b`를 `t`(0–1)만큼 섞는다 */
export function mix(a: string, b: string, t: number): string {
  const x = parse(a);
  const y = parse(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb);
}

export const soft = (color: string, t = 0.5) => mix(color, "#ffffff", t);

function alpha(hex: string, a: number): string {
  return `rgba(${parse(hex).join(", ")}, ${a})`;
}

/** WCAG 상대 휘도 */
function luminance(hex: string): number {
  const [r, g, b] = parse(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 대비 (1–21) */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h: number, s: number, l: number): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  return [ch(h + 1 / 3) * 255, ch(h) * 255, ch(h - 1 / 3) * 255];
}

/** 색상(hue)·채도는 두고 밝기만 옮겨 `bg` 대비 `min` 이상으로 — 밝은 배경이면 어둡게, 어두운 배경이면 밝게 */
export function readable(color: string, bg: string, min = 4.5): string {
  if (contrast(color, bg) >= min) return color;
  const [h, s, l] = toHsl(parse(color));
  const darken = luminance(bg) > 0.18;
  for (let step = 1; step <= 100; step++) {
    const next = toHex(fromHsl(h, s, darken ? l * (1 - step / 100) : l + (1 - l) * (step / 100)));
    if (contrast(next, bg) >= min) return next;
  }
  return darken ? "#000000" : "#ffffff";
}

// ---- 팔레트 → 테마 --------------------------------------------------------------------

export interface Roles {
  /** 본문 배경 */
  bg: string;
  /** 사이드바·코드 블록 배경 */
  surface: string;
  /** 본문 글자 */
  fg: string;
  /** 링크·버튼·코드 키워드·소스 제목 */
  accent: string;
  /** 코드 문자열·목록 기호 */
  second: string;
  /** 흐린 글자 — 없으면 글자·배경을 섞어 만든다 */
  muted?: string;
  /** 경계선 — 없으면 글자·배경을 섞어 만든다 */
  line?: string;
}

/** 역할 5개에서 셸·문서 토큰을 만든다. 나머지(경고·성공 색 등)는 base 기본 팔레트 값 */
export function paletteTheme(id: string, name: string, base: ThemeBase, roles: Roles): ThemeDef {
  const dark = base === "dark";
  const { bg, surface } = roles;
  const fg = readable(roles.fg, bg, 7);
  const muted = readable(roles.muted ?? mix(fg, bg, 0.4), bg, 4.5);
  const line = roles.line ?? mix(fg, bg, dark ? 0.78 : 0.82);
  const accent = readable(roles.accent, bg, 4.5);
  const second = readable(roles.second, bg, 4.5);
  const onAccent = contrast(accent, "#ffffff") >= contrast(accent, dark ? bg : fg) ? "#ffffff" : dark ? bg : fg;
  return {
    id,
    name,
    base,
    shell: { bg, "sidebar-bg": surface, fg, muted, line, accent, "on-accent": onAccent },
    doc: {
      "bgColor-default": bg,
      "bgColor-muted": surface,
      "bgColor-neutral-muted": alpha(fg, dark ? 0.16 : 0.08),
      "fgColor-default": fg,
      "fgColor-muted": muted,
      "fgColor-accent": accent,
      "borderColor-default": line,
      "borderColor-muted": `${line}b3`,
      "borderColor-accent-emphasis": accent,
      "selection-bg": alpha(accent, dark ? 0.36 : 0.24),
      "selection-bg-inactive": alpha(accent, dark ? 0.2 : 0.14),
      "color-prettylights-syntax-keyword": accent,
      "color-prettylights-syntax-entity-tag": accent,
      "color-prettylights-syntax-markup-heading": accent,
      "color-prettylights-syntax-string": second,
      "color-prettylights-syntax-variable": second,
      "color-prettylights-syntax-markup-list": second,
      "color-prettylights-syntax-constant": readable(mix(accent, second, 0.5), bg),
      "color-prettylights-syntax-entity": readable(mix(second, fg, 0.35), bg),
      "color-prettylights-syntax-comment": muted,
      "color-prettylights-syntax-brackethighlighter-angle": muted,
      "color-prettylights-syntax-markup-bold": fg,
      "color-prettylights-syntax-markup-italic": fg,
      "color-prettylights-syntax-storage-modifier-import": fg,
    },
  };
}

// ---- 미니멀 화이트 세이지 차콜 — 내장 라이트·다크(2026-10-06부터)의 원본 ---------------------

export type Five = readonly [string, string, string, string, string];

/** media.io '웨딩 컬러 팔레트'의 미니멀 화이트 세이지 차콜. 추천 테마 목록에도 원본 팔레트로 남아 있다 */
export const SAGE_CHARCOAL: Five = ["#ffffff", "#a6b8a6", "#2f3235", "#e6e2dc", "#6b6f74"];

/**
 * 라이트 — 원본의 회색 베이지(c[3]) 대신 세이지(c[1])를 면·글자·강조에 은은히 깔아 전체에 초록빛이 돈다.
 * 사이드바(surface)가 본문보다 어두워 흐린 글자 기본값으로는 대비가 모자라니 surface 기준으로 맞춘다
 */
export function sageCharcoalLight(c: Five = SAGE_CHARCOAL): Roles {
  const bg = mix(c[0], c[1], 0.035);
  const surface = mix(c[0], c[1], 0.17);
  const fg = mix(c[2], "#1e3a2a", 0.15);
  return { bg, surface, fg, accent: mix(c[1], "#2f6b4a", 0.6), second: mix(c[4], c[1], 0.3), muted: readable(mix(fg, c[1], 0.3), surface), line: mix(c[1], bg, 0.6) };
}

/** 다크 — 원본 팔레트에 다크는 없어서 만든 짝. 차콜 바탕에 세이지 초록빛, 사이드바(surface)가 본문보다 밝아 흐린 글자는 surface 기준 */
export function sageCharcoalDark(c: Five = SAGE_CHARCOAL): Roles {
  const bg = mix(mix(c[2], "#1e3a2a", 0.3), "#000000", 0.35);
  const surface = mix(bg, c[1], 0.08);
  const fg = mix(c[0], c[1], 0.3);
  return { bg, surface, fg, accent: mix(c[1], "#7fc79a", 0.4), second: mix(c[4], c[1], 0.5), muted: readable(mix(fg, bg, 0.4), surface) };
}
