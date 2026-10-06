import { afterEach, describe, expect, it } from "vitest";
import { normalizeSetting, SETTINGS } from "../settings";
import { catalogEntries, findTheme, listThemes, sameTheme, themeOrigin } from "./catalog";
import { RECOMMENDED_THEMES } from "./recommended";
import { parseThemeFile, setUserThemes, type ThemeDef, themeToJson } from "./themes";

afterEach(() => setUserThemes([]));

/** 2026-10-06 전 '추가'가 테마 폴더에 쓰던 그대로 — themeToJson → 폴더 → parseThemeFile */
function copied(theme: ThemeDef): ThemeDef {
  const parsed = parseThemeFile(themeToJson(theme), theme.id);
  if (!parsed.ok) throw new Error(parsed.errors.join(", "));
  return parsed.theme;
}

describe("테마 카탈로그 (store-launch A-2)", () => {
  it("순서는 내장 → 추천 → 사용자, 추천은 폴더에 없어도 목록에 있다", () => {
    setUserThemes([{ id: "mine", name: "내 테마", base: "light" }]);
    const origins = catalogEntries().map((e) => e.origin);
    expect(origins.slice(0, 2)).toEqual(["builtin", "builtin"]);
    expect(origins.slice(2, 2 + RECOMMENDED_THEMES.length).every((o) => o === "recommended")).toBe(true);
    expect(origins.at(-1)).toBe("user");
    expect(themeOrigin("sepia")).toBe("recommended");
    expect(themeOrigin("mine")).toBe("user");
  });

  it("추천 테마를 그대로 복사한 옛 파일은 한 번만(추천으로) 보인다", () => {
    const sepia = RECOMMENDED_THEMES.find((e) => e.theme.id === "sepia")!.theme;
    const wedding = RECOMMENDED_THEMES.find((e) => e.group === "wedding")!.theme;
    setUserThemes([copied(sepia), copied(wedding)]);
    expect(listThemes().filter((t) => t.id === "sepia")).toHaveLength(1);
    expect(listThemes().filter((t) => t.id === wedding.id)).toHaveLength(1);
    expect(themeOrigin("sepia")).toBe("recommended");
    expect(themeOrigin(wedding.id)).toBe("recommended");
  });

  it("사용자가 고친 사본은 사용자 테마로 남고 같은 id의 추천 테마를 가린다", () => {
    const sepia = RECOMMENDED_THEMES.find((e) => e.theme.id === "sepia")!.theme;
    const edited = { ...copied(sepia), shell: { ...sepia.shell, bg: "#ffeedd" } };
    setUserThemes([edited]);
    expect(listThemes().filter((t) => t.id === "sepia")).toHaveLength(1);
    expect(themeOrigin("sepia")).toBe("user");
    expect(findTheme("sepia")!.shell!.bg).toBe("#ffeedd");
  });

  it("sameTheme은 이름·base·채운 색을 본다", () => {
    const a: ThemeDef = { id: "a", name: "A", base: "light", shell: { bg: "#ffffff" } };
    expect(sameTheme(a, { ...a, id: "b" })).toBe(true);
    expect(sameTheme(a, { ...a, name: "B" })).toBe(false);
    expect(sameTheme(a, { ...a, base: "dark" })).toBe(false);
    expect(sameTheme(a, { ...a, shell: { bg: "#fffffe" } })).toBe(false);
  });

  it("추천 테마는 폴더 없이 설정값으로 남는다 — 시작할 때 기본값으로 지워지지 않는다", () => {
    expect(normalizeSetting(SETTINGS.theme, "sepia")).toBe("sepia");
    expect(normalizeSetting(SETTINGS.themeDark, "github-dark")).toBe("github-dark");
    expect(normalizeSetting(SETTINGS.themeLight, "github-dark")).toBeUndefined();
  });

  it("사용자 목록이 그대로면 같은 배열을 돌려준다 (그릴 때마다 다시 만들지 않는다)", () => {
    setUserThemes([{ id: "mine", name: "내 테마", base: "light" }]);
    expect(catalogEntries()).toBe(catalogEntries());
  });
});
