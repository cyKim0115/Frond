import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyPrefs, readPref, writePref } from "./prefs";

beforeEach(() => localStorage.clear());

describe("localStorage 접두사 frond. (frond-rename §4)", () => {
  it("frond. 키가 없으면 옛 mdeditor. 키를 전부 복사하고 옛 키는 남긴다", () => {
    localStorage.setItem("mdeditor.settings", '{"theme":"dark"}');
    localStorage.setItem("mdeditor.recent", '["C:/a.md"]');
    localStorage.setItem("other-lib", "x");
    expect(migrateLegacyPrefs()).toBe(2);
    expect(localStorage.getItem("frond.settings")).toBe('{"theme":"dark"}');
    expect(localStorage.getItem("frond.recent")).toBe('["C:/a.md"]');
    expect(localStorage.getItem("mdeditor.settings")).toBe('{"theme":"dark"}');
    expect(localStorage.getItem("frond.other-lib")).toBeNull();
    expect(readPref("settings", {}, (v): v is object => typeof v === "object")).toEqual({ theme: "dark" });
  });

  it("frond. 키가 하나라도 있으면 건드리지 않는다 — 한 번만 옮긴다", () => {
    writePref("settings", { theme: "light" });
    localStorage.setItem("mdeditor.settings", '{"theme":"dark"}');
    localStorage.setItem("mdeditor.recent", "[]");
    expect(migrateLegacyPrefs()).toBe(0);
    expect(localStorage.getItem("frond.settings")).toBe('{"theme":"light"}');
    expect(localStorage.getItem("frond.recent")).toBeNull();
  });

  it("처음 설치(옛 키 없음)면 아무것도 하지 않는다", () => {
    expect(migrateLegacyPrefs()).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it("저장소 접근이 막혀도 던지지 않는다", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    expect(migrateLegacyPrefs(blocked)).toBe(0);
  });
});
