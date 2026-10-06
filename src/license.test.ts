import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canImport,
  canUseTheme,
  type Entitlement,
  entitlement,
  entitlementLabel,
  isEntitlement,
  onEntitlementChange,
  OPEN,
  reloadEntitlement,
  setEntitlement,
} from "./license";
import { getSetting, reloadSettings, setSetting } from "./settings";
import { contrast } from "./theme/palette";
import { visibleTheme } from "./theme/catalog";
import { SUPPORTER_THEMES } from "./theme/supporter";
import { resolveTheme, setUserThemes } from "./theme/themes";

const FREE: Entitlement = { tier: "free", source: "none" };
const BOUGHT: Entitlement = { tier: "supporter", source: "store" };

beforeEach(() => {
  localStorage.clear();
  reloadEntitlement();
  reloadSettings();
});
afterEach(() => setUserThemes([]));

describe("권리 판정 순수 함수 (store-launch A-3)", () => {
  it("내장·추천은 누구나, 사용자·구매자 전용은 구매자만, 모르는 테마는 아무도", () => {
    for (const e of [FREE, BOUGHT, OPEN]) {
      expect(canUseTheme("builtin", e)).toBe(true);
      expect(canUseTheme("recommended", e)).toBe(true);
      expect(canUseTheme(undefined, e)).toBe(false);
    }
    expect(canUseTheme("user", FREE)).toBe(false);
    expect(canUseTheme("supporter", FREE)).toBe(false);
    expect(canUseTheme("user", BOUGHT)).toBe(true);
    expect(canUseTheme("supporter", OPEN)).toBe(true);
    expect(canImport(FREE)).toBe(false);
    expect(canImport(OPEN)).toBe(true);
  });

  it("처음에는 '모두 열림', 판정을 받으면 저장해 다음 시작에 쓴다", () => {
    expect(entitlement()).toEqual(OPEN);
    setEntitlement(FREE);
    reloadEntitlement();
    expect(entitlement()).toEqual(FREE);
  });

  it("바뀔 때만 알리고, 깨진 값은 받지 않는다", () => {
    const listener = vi.fn();
    onEntitlementChange(listener);
    setEntitlement(OPEN);
    expect(listener).not.toHaveBeenCalled();
    setEntitlement(FREE);
    setEntitlement({ ...FREE });
    expect(listener).toHaveBeenCalledTimes(1);
    setEntitlement({ tier: "gold", source: "none" } as unknown as Entitlement);
    expect(entitlement()).toEqual(FREE);
    expect(isEntitlement({ tier: "free" })).toBe(false);
  });

  it("상태 줄 글", () => {
    expect(entitlementLabel(FREE)).toBe("무료");
    expect(entitlementLabel(BOUGHT)).toBe("구매자 — Microsoft Store");
    expect(entitlementLabel(OPEN)).toContain("Store 밖");
  });
});

describe("테마 게이트 — 비구매자의 사용자 테마", () => {
  const mine = { id: "mine", name: "내 테마", base: "dark" as const, shell: { bg: "#101010" } };
  const usable = (e: Entitlement) => (origin: Parameters<typeof canUseTheme>[0]) => canUseTheme(origin, e);

  it("내장 테마로 보이고 설정값은 보존된다 — 권리가 돌아오면 원래 테마", () => {
    setUserThemes([mine]);
    setSetting("theme", "mine");
    expect(getSetting("theme")).toBe("mine");

    // 무료: 그 테마 쪽(다크) 내장 테마로 대체, 설정은 그대로
    expect(visibleTheme(getSetting("theme"), "light", usable(FREE)).id).toBe("dark");
    reloadSettings(); // 다음 시작 — 저장값이 기본값으로 지워지지 않는다
    expect(getSetting("theme")).toBe("mine");

    // 구매(또는 Store 밖 설치본): 원래 테마
    expect(visibleTheme(getSetting("theme"), "light", usable(BOUGHT)).id).toBe("mine");
    expect(visibleTheme(getSetting("theme"), "light", usable(OPEN)).id).toBe("mine");
  });

  it("구매자 전용 테마도 같다. 못 찾은 테마는 시스템 모드 쪽 내장", () => {
    const hanji = SUPPORTER_THEMES.find((e) => e.theme.id === "frond-hanji")!.theme;
    expect(visibleTheme(hanji.id, "dark", usable(FREE)).id).toBe("light");
    expect(visibleTheme(hanji.id, "dark", usable(BOUGHT)).id).toBe(hanji.id);
    expect(visibleTheme("gone", "dark", usable(BOUGHT)).id).toBe("dark");
    // 추천 테마는 무료
    expect(visibleTheme("sepia", "dark", usable(FREE)).id).toBe("sepia");
  });
});

describe("구매자 전용 테마 묶음", () => {
  it("4종이 파일 검증을 통과하고 글자·강조가 읽힌다 (WCAG)", () => {
    expect(SUPPORTER_THEMES.map((e) => e.theme.id)).toEqual(["frond-fern-dawn", "frond-moss-night", "frond-hanji", "frond-meok"]);
    for (const { theme } of SUPPORTER_THEMES) {
      const t = resolveTheme(theme);
      expect(contrast(t.shell.fg, t.shell.bg), `${t.id} fg`).toBeGreaterThanOrEqual(7);
      expect(contrast(t.shell.muted, t.shell.bg), `${t.id} muted`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.doc["fgColor-accent"], t.doc["bgColor-default"]), `${t.id} link`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.shell["on-accent"], t.shell.accent), `${t.id} on-accent`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
