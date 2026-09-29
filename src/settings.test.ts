import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSetting, normalizeSetting, onSettingChange, reloadSettings, resetSettings, setSetting, SETTINGS } from "./settings";

describe("normalizeSetting", () => {
  const offset = SETTINGS.headingScrollOffset;

  it("숫자는 범위로 자르고 step에 맞춘다", () => {
    expect(normalizeSetting(offset, 25)).toBe(24);
    expect(normalizeSetting(offset, -10)).toBe(offset.min);
    expect(normalizeSetting(offset, 10_000)).toBe(offset.max);
  });

  it("입력칸 문자열도 숫자로 읽고, 빈 값·숫자 아님은 버린다", () => {
    expect(normalizeSetting(offset, "40")).toBe(40);
    expect(normalizeSetting(offset, "")).toBeUndefined();
    expect(normalizeSetting(offset, "abc")).toBeUndefined();
  });

  it("선택지는 목록에 있는 값만 받는다", () => {
    expect(normalizeSetting(SETTINGS.theme, "dark")).toBe("dark");
    expect(normalizeSetting(SETTINGS.theme, "sepia")).toBeUndefined();
  });
});

describe("저장·알림", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadSettings();
  });

  it("저장된 값이 깨졌으면 그 항목만 기본값으로 읽는다", () => {
    localStorage.setItem("mdeditor.settings", JSON.stringify({ headingScrollOffset: 48, theme: "sepia" }));
    reloadSettings();
    expect(getSetting("headingScrollOffset")).toBe(48);
    expect(getSetting("theme")).toBe(SETTINGS.theme.default);
  });

  it("값이 실제로 바뀔 때만 알리고 저장한다", () => {
    const listener = vi.fn();
    onSettingChange(listener);
    expect(setSetting("headingScrollOffset", 60)).toBe(60);
    setSetting("headingScrollOffset", 60);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("headingScrollOffset");
    expect(JSON.parse(localStorage.getItem("mdeditor.settings")!).headingScrollOffset).toBe(60);
  });

  it("모두 기본값으로 되돌린다", () => {
    setSetting("recentMax", 5);
    setSetting("theme", "dark");
    resetSettings();
    expect(getSetting("recentMax")).toBe(SETTINGS.recentMax.default);
    expect(getSetting("theme")).toBe(SETTINGS.theme.default);
  });
});
