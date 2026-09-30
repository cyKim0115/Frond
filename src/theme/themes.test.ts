import { afterEach, describe, expect, it } from "vitest";
import { normalizeSetting, SETTINGS } from "../settings";
import { BUILTIN_THEMES, DOC_TOKENS, findTheme, listThemes, resolveTheme, setUserThemes, SHELL_TOKENS, themeCss } from "./themes";

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
