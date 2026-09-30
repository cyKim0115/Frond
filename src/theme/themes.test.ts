import { afterEach, describe, expect, it } from "vitest";
import { normalizeSetting, SETTINGS } from "../settings";
import {
  BUILTIN_THEMES,
  DOC_TOKENS,
  findTheme,
  listThemes,
  parseThemeFile,
  resolveTheme,
  setUserThemes,
  SHELL_TOKENS,
  themeCss,
  themeToJson,
} from "./themes";

afterEach(() => setUserThemes([]));

describe("내장 테마", () => {
  it("라이트·다크가 모든 셸·문서 토큰을 갖는다 (base로 쓰이므로)", () => {
    for (const theme of BUILTIN_THEMES) {
      for (const k of SHELL_TOKENS) expect(theme.shell[k], `${theme.id} shell ${k}`).toBeTruthy();
      for (const k of DOC_TOKENS) expect(theme.doc[k], `${theme.id} doc ${k}`).toBeTruthy();
    }
    expect(BUILTIN_THEMES.map((t) => [t.id, t.base])).toEqual([
      ["light", "light"],
      ["dark", "dark"],
    ]);
  });
});

describe("resolveTheme", () => {
  it("빠진 토큰은 base 내장 테마로 채우고 준 값은 덮는다", () => {
    const resolved = resolveTheme({ id: "sepia", name: "세피아", base: "light", shell: { bg: "#f4ecd8" }, doc: { "bgColor-default": "#f4ecd8" } });
    expect(resolved.shell.bg).toBe("#f4ecd8");
    expect(resolved.shell.fg).toBe(findTheme("light")!.shell!.fg);
    expect(resolved.doc["bgColor-default"]).toBe("#f4ecd8");
    expect(resolved.doc["fgColor-default"]).toBe(findTheme("light")!.doc!["fgColor-default"]);
  });
});

describe("themeCss", () => {
  it("화면 전용으로 :root·본문·편집기에 토큰 한 벌을 쓰고 color-scheme을 base로", () => {
    const css = themeCss(resolveTheme(findTheme("dark")!));
    expect(css.startsWith("@media screen {")).toBe(true);
    expect(css).toContain("html:root[data-theme] { color-scheme: dark;");
    expect(css).toContain("html:root[data-theme] .markdown-body, html:root[data-theme] .cm-editor");
    expect(css).toContain("--bg: #0d1117;");
    expect(css).toContain("--fgColor-default: #f0f6fc;");
  });
});

describe("사용자 테마 목록", () => {
  it("내장 뒤에 붙고, 내장 id와 겹치면 버린다", () => {
    setUserThemes([
      { id: "dark", name: "가짜 다크", base: "dark" },
      { id: "mine", name: "내 테마", base: "dark" },
    ]);
    expect(listThemes().map((t) => t.id)).toEqual(["light", "dark", "mine"]);
    expect(findTheme("dark")!.name).toBe("다크");
  });

  it("설정 선택지가 동적으로 따라온다 — 다크 쌍에는 다크 테마만", () => {
    expect(normalizeSetting(SETTINGS.theme, "mine")).toBeUndefined();
    setUserThemes([{ id: "mine", name: "내 테마", base: "dark" }]);
    expect(normalizeSetting(SETTINGS.theme, "mine")).toBe("mine");
    expect(normalizeSetting(SETTINGS.themeDark, "mine")).toBe("mine");
    expect(normalizeSetting(SETTINGS.themeLight, "mine")).toBeUndefined();
  });
});

describe("parseThemeFile", () => {
  const good = { id: "sepia", name: "세피아", base: "light", shell: { bg: "#f4ecd8", fg: "rgb(60, 50, 40)" }, doc: { "bgColor-default": "#f4ecd8" } };

  it("올바른 파일을 읽고, 모르는 키는 경고로 넘긴다", () => {
    const parsed = parseThemeFile(JSON.stringify({ ...good, extra: 1, shell: { ...good.shell, glow: "#fff" } }), "file");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.theme).toEqual({ id: "sepia", name: "세피아", base: "light", shell: good.shell, doc: good.doc });
    expect(parsed.warnings).toEqual(["extra: 모르는 키라 무시합니다", "shell.glow: 모르는 토큰이라 무시합니다"]);
  });

  it("id가 없으면 파일 이름을 쓰고, BOM이 있어도 읽는다", () => {
    const { id: _id, ...rest } = good;
    const parsed = parseThemeFile(`\uFEFF${JSON.stringify(rest)}`, "my-theme");
    expect(parsed.ok && parsed.theme.id).toBe("my-theme");
  });

  it("잘못된 값은 어느 키·값인지 알려 주고 거부한다", () => {
    const parsed = parseThemeFile(
      JSON.stringify({ id: "dark", name: "", base: "sepia", shell: { bg: "url(http://x/a.png)" }, doc: { "fgColor-default": "red; } body { x" } }),
      "f",
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors).toEqual([
      "id: 내장 테마 이름(dark)은 쓸 수 없습니다",
      "name: 1–60자 이름이 필요합니다",
      'base: "light" 또는 "dark"여야 합니다 ("sepia")',
      'shell.bg: 색 값이 아닙니다 ("url(http://x/a.png)")',
      'doc.fgColor-default: 색 값이 아닙니다 ("red; } body { x")',
    ]);
  });

  it("JSON 문법 오류·파일 이름 id 규칙", () => {
    expect(parseThemeFile("{", "f").ok).toBe(false);
    const parsed = parseThemeFile(JSON.stringify({ name: "x", base: "dark" }), "../evil");
    expect(parsed.ok).toBe(false);
  });

  it("themeToJson → parseThemeFile 왕복, full이면 모든 토큰", () => {
    const parsed = parseThemeFile(themeToJson({ id: "a", name: "A", base: "dark" }, true), "a");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(Object.keys(parsed.theme.shell!)).toHaveLength(SHELL_TOKENS.length);
    expect(Object.keys(parsed.theme.doc!)).toHaveLength(DOC_TOKENS.length);
  });
});
