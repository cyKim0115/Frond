import { describe, expect, it } from "vitest";
import { resolveSidebarWidth, SIDEBAR_MIN_W } from "./resize";

describe("resolveSidebarWidth", () => {
  it("범위 안의 폭은 그대로 쓴다", () => {
    expect(resolveSidebarWidth(300, 1200)).toBe(300);
  });

  it("최소 폭보다 좁으면 최소 폭, 그 절반보다 좁으면 접는다", () => {
    expect(resolveSidebarWidth(SIDEBAR_MIN_W - 20, 1200)).toBe(SIDEBAR_MIN_W);
    expect(resolveSidebarWidth(SIDEBAR_MIN_W / 2 - 1, 1200)).toBeNull();
  });

  it("본문 몫을 남기도록 나눠 쓰는 폭의 절반으로 막는다", () => {
    expect(resolveSidebarWidth(900, 1000)).toBe(500);
  });

  it("창이 아주 좁으면 최소 폭이 상한을 이긴다", () => {
    expect(resolveSidebarWidth(250, 200)).toBe(SIDEBAR_MIN_W);
  });
});
