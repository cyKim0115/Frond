import { describe, expect, it } from "vitest";
import { contrast, readable, RECOMMENDED_GROUPS, RECOMMENDED_THEMES } from "./recommended";
import { isBuiltinTheme, parseThemeFile, resolveTheme, themeToJson } from "./themes";

describe("추천 테마", () => {
  it("세피아 + 웨딩 팔레트 20종, id가 겹치지 않고 내장 id가 아니다", () => {
    const ids = RECOMMENDED_THEMES.map((e) => e.theme.id);
    expect(ids[0]).toBe("sepia");
    expect(RECOMMENDED_THEMES.filter((e) => e.group === "wedding")).toHaveLength(20);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(isBuiltinTheme(id), id).toBe(false);
    for (const e of RECOMMENDED_THEMES) expect(RECOMMENDED_GROUPS.some((g) => g.id === e.group)).toBe(true);
  });

  it("테마 파일로 저장한 뒤 가져오기 검증을 경고 없이 통과한다", () => {
    for (const { theme } of RECOMMENDED_THEMES) {
      const parsed = parseThemeFile(themeToJson(theme), theme.id);
      expect(parsed, theme.id).toMatchObject({ ok: true, warnings: [] });
    }
  });

  it("팔레트 테마는 글자·흐린 글자·강조·버튼 글자가 읽힐 만큼 대비가 있다 (WCAG)", () => {
    for (const e of RECOMMENDED_THEMES.filter((x) => x.palette)) {
      const t = resolveTheme(e.theme);
      const id = t.id;
      expect(contrast(t.shell.fg, t.shell.bg), `${id} fg`).toBeGreaterThanOrEqual(7);
      expect(contrast(t.shell.muted, t.shell.bg), `${id} muted`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.doc["fgColor-accent"], t.doc["bgColor-default"]), `${id} link`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.shell["on-accent"], t.shell.accent), `${id} on-accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.doc["color-prettylights-syntax-string"], t.doc["bgColor-muted"]), `${id} code string`).toBeGreaterThanOrEqual(3);
    }
  });

  it("화이트 세이지 차콜은 사이드바·본문·글자 모두 초록빛이 돌고, 사이드바 위 흐린 글자도 읽힌다", () => {
    const t = resolveTheme(RECOMMENDED_THEMES.find((x) => x.theme.id === "wedding-minimal-white-sage-charcoal")!.theme);
    const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (const key of ["sidebar-bg", "bg", "fg", "line"] as const) {
      const [r, g, b] = channels(t.shell[key]);
      expect(g, key).toBeGreaterThan(r);
      expect(g, key).toBeGreaterThanOrEqual(b);
    }
    expect(contrast(t.shell.muted, t.shell["sidebar-bg"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("readable", () => {
  it("대비가 충분하면 그대로, 모자라면 밝기만 옮겨 맞춘다", () => {
    expect(readable("#1f2328", "#ffffff")).toBe("#1f2328");
    const pink = readable("#f3b1c2", "#fff7f2");
    expect(contrast(pink, "#fff7f2")).toBeGreaterThanOrEqual(4.5);
    // 어두운 배경이면 밝게 옮긴다
    const green = readable("#0b6b4f", "#0f1a1a");
    expect(contrast(green, "#0f1a1a")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(green, "#ffffff")).toBeLessThan(contrast("#0b6b4f", "#ffffff"));
  });
});
