import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  afterShown,
  afterSnooze,
  canImport,
  canUseTheme,
  type Entitlement,
  entitlement,
  entitlementLabel,
  isEntitlement,
  NAG,
  type NagGuards,
  type NagState,
  onEntitlementChange,
  OPEN,
  readNagState,
  recordLaunch,
  recordSave,
  reloadEntitlement,
  setEntitlement,
  shouldNag,
  writeNagState,
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

describe("구매 권유 스케줄 (store-launch A-4)", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const T0 = Date.UTC(2026, 9, 6);
  const calm: NagGuards = { composing: false, idleMs: 60_000, busy: false, dialogOpen: false, focused: true, elevated: false };
  const STORE_FREE = { tier: "free", source: "none" } as const;
  /** 실행을 n번 한 상태 (첫 실행 T0) */
  function launched(n: number): NagState {
    let s: NagState | null = null;
    for (let i = 0; i < n; i++) s = recordLaunch(s, T0 + i);
    return s!;
  }

  it("첫 실행 뒤 7일과 실행 5회가 모두 지나야 한다", () => {
    expect(shouldNag(launched(5), T0 + 7 * DAY - 1, calm, STORE_FREE, "packaged")).toBe(false);
    expect(shouldNag(launched(4), T0 + 30 * DAY, calm, STORE_FREE, "packaged")).toBe(false);
    expect(shouldNag(launched(5), T0 + 7 * DAY, calm, STORE_FREE, "packaged")).toBe(true);
  });

  it("Store판 비구매자에게만 — 구매자·Store 밖 설치본은 없다, 개발용 무료 흉내는 시험용으로 뜬다", () => {
    const s = launched(5);
    const t = T0 + 8 * DAY;
    expect(shouldNag(s, t, calm, { tier: "supporter", source: "store" }, "packaged")).toBe(false);
    for (const kind of ["installed", "scoop", "dev", null] as const) expect(shouldNag(s, t, calm, STORE_FREE, kind)).toBe(false);
    expect(shouldNag(s, t, calm, OPEN, "installed")).toBe(false);
    expect(shouldNag(s, t, calm, { tier: "free", source: "dev" }, "dev")).toBe(true);
  });

  it("가드 하나라도 걸리면 건너뛴다 — 조합 중·입력 10초 안·저장/인쇄/내보내기·열린 팝업·포커스 없음·관리자", () => {
    const s = launched(5);
    const t = T0 + 8 * DAY;
    const cases: Partial<NagGuards>[] = [
      { composing: true },
      { idleMs: 9_999 },
      { busy: true },
      { dialogOpen: true },
      { focused: false },
      { elevated: true },
    ];
    for (const c of cases) expect(shouldNag(s, t, { ...calm, ...c }, STORE_FREE, "packaged"), JSON.stringify(c)).toBe(false);
    expect(shouldNag(s, t, { ...calm, idleMs: 10_000 }, STORE_FREE, "packaged")).toBe(true);
  });

  it("띄우면 14일, '나중에'마다 14 → 30 → 60 → 60일 뒤", () => {
    let s = launched(5);
    let t = T0 + 8 * DAY;
    s = afterShown(s, t);
    expect(shouldNag(s, t + 14 * DAY - 1, calm, STORE_FREE, "packaged")).toBe(false);
    expect(shouldNag(s, t + 14 * DAY, calm, STORE_FREE, "packaged")).toBe(true);
    for (const days of [14, 30, 60, 60]) {
      s = afterSnooze(afterShown(s, t), t);
      expect(shouldNag(s, t + days * DAY - 1, calm, STORE_FREE, "packaged"), `${days}`).toBe(false);
      expect(shouldNag(s, t + days * DAY, calm, STORE_FREE, "packaged"), `${days}`).toBe(true);
      t += days * DAY;
    }
    expect(s.snoozes).toBe(4);
  });

  it("상태는 localStorage에 남고, 저장 성공은 카운터만 올린다", () => {
    expect(readNagState()).toBeNull();
    const s = recordSave(launched(2));
    writeNagState(s);
    expect(readNagState()).toEqual({ ...s, saves: 1 });
    localStorage.setItem("frond.nag", JSON.stringify({ firstRunAt: "x" }));
    expect(readNagState()).toBeNull();
  });

  it("주기 상수는 결정 기록과 같다", () => {
    expect(NAG.graceMs).toBe(7 * DAY);
    expect(NAG.graceLaunches).toBe(5);
    expect(NAG.intervalMs).toBe(14 * DAY);
    expect(NAG.snoozeMs).toEqual([14 * DAY, 30 * DAY, 60 * DAY]);
    expect(NAG.idleMs).toBe(10_000);
  });
});
