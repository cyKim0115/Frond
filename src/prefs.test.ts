import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyPrefs } from "./prefs";

describe("localStorage 접두사 옮기기 (mdeditor. → frond.)", () => {
  beforeEach(() => localStorage.clear());

  it("옛 키만 있으면 frond.로 복사하고 옛 키는 남긴다", () => {
    localStorage.setItem("mdeditor.settings", '{"theme":"sepia"}');
    localStorage.setItem("mdeditor.recent", "[]");
    localStorage.setItem("other", "x");
    migrateLegacyPrefs();
    expect(localStorage.getItem("frond.settings")).toBe('{"theme":"sepia"}');
    expect(localStorage.getItem("frond.recent")).toBe("[]");
    expect(localStorage.getItem("mdeditor.settings")).toBe('{"theme":"sepia"}');
    expect(localStorage.getItem("frond.other")).toBeNull();
  });

  it("frond. 키가 하나라도 있으면 건드리지 않는다", () => {
    localStorage.setItem("frond.settings", '{"theme":"dark"}');
    localStorage.setItem("mdeditor.settings", '{"theme":"sepia"}');
    localStorage.setItem("mdeditor.recent", "[]");
    migrateLegacyPrefs();
    expect(localStorage.getItem("frond.settings")).toBe('{"theme":"dark"}');
    expect(localStorage.getItem("frond.recent")).toBeNull();
  });
});
