import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSetting,
  normalizeSetting,
  onSettingChange,
  reloadSettings,
  resetSettings,
  SETTING_CATEGORIES,
  SETTING_KEYS,
  setSetting,
  SETTINGS,
} from "./settings";

describe("카테고리", () => {
  it("모든 항목의 section이 SETTING_CATEGORIES에 있는 id다", () => {
    const ids = new Set<string>(SETTING_CATEGORIES.map((c) => c.id));
    for (const key of SETTING_KEYS) expect(ids, `${key}.section`).toContain(SETTINGS[key].section);
  });

  it("카테고리 id·라벨은 겹치지 않는다", () => {
    expect(new Set(SETTING_CATEGORIES.map((c) => c.id)).size).toBe(SETTING_CATEGORIES.length);
    expect(new Set(SETTING_CATEGORIES.map((c) => c.label)).size).toBe(SETTING_CATEGORIES.length);
  });
});

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
    expect(normalizeSetting(SETTINGS.theme, "no-such-theme")).toBeUndefined();
    // 추천 테마는 앱에 들어 있어 폴더 없이도 받는다 (store-launch A-2)
    expect(normalizeSetting(SETTINGS.theme, "sepia")).toBe("sepia");
  });
});

describe("저장·알림", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadSettings();
  });

  it("저장된 값이 깨졌으면 그 항목만 기본값으로 읽는다", () => {
    localStorage.setItem("frond.settings", JSON.stringify({ headingScrollOffset: 48, theme: "no-such-theme" }));
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
    expect(JSON.parse(localStorage.getItem("frond.settings")!).headingScrollOffset).toBe(60);
  });

  it("모두 기본값으로 되돌린다", () => {
    setSetting("recentMax", 5);
    setSetting("theme", "dark");
    resetSettings();
    expect(getSetting("recentMax")).toBe(SETTINGS.recentMax.default);
    expect(getSetting("theme")).toBe(SETTINGS.theme.default);
  });
});
