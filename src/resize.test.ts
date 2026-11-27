import { describe, expect, it } from "vitest";
import { resolveSidebarWidth, SIDEBAR_MIN_W, sidebarDragWidth } from "./resize";
import { tocShown, tocSideOf } from "./toc-panel";

describe("sidebarDragWidth", () => {
  it("왼쪽 목차는 오른쪽으로 끌수록 넓어진다", () => {
    expect(sidebarDragWidth(260, 40, "left")).toBe(300);
    expect(sidebarDragWidth(260, -40, "left")).toBe(220);
  });

  it("오른쪽 목차는 왼쪽으로 끌수록 넓어진다", () => {
    expect(sidebarDragWidth(260, -40, "right")).toBe(300);
    expect(sidebarDragWidth(260, 40, "right")).toBe(220);
  });
});

describe("목차 자리·보이기", () => {
  it("설정값을 자리로 — 모르는 값은 오른쪽", () => {
    expect(tocSideOf("left")).toBe("left");
    expect(tocSideOf("right")).toBe("right");
    expect(tocSideOf("middle")).toBe("right");
  });

  it("목차 줄이 있고 접지 않았을 때만 보인다", () => {
    expect(tocShown(true, true)).toBe(true);
    expect(tocShown(true, false)).toBe(false);
    expect(tocShown(false, true)).toBe(false);
  });
});

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
