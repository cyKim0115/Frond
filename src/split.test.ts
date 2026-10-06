import { describe, expect, it } from "vitest";
import { buildSyncMap, clampSplit, lineForY, yForLine } from "./split";

describe("분할 뷰 스크롤 동기 (로드맵 3-3)", () => {
  const map = buildSyncMap([
    { line: 0, y: 40 },
    { line: 2, y: 100 },
    { line: 10, y: 500 },
    { line: 12, y: 560 },
  ]);

  it("닻 사이는 선형 보간 — 긴 블록 안에서도 같은 비율", () => {
    expect(yForLine(map, 0)).toBe(40);
    expect(yForLine(map, 1)).toBe(70);
    expect(yForLine(map, 6)).toBe(300);
    expect(lineForY(map, 300)).toBe(6);
    expect(lineForY(map, 70)).toBe(1);
  });

  it("양 끝 밖은 첫·마지막 닻에 붙는다", () => {
    expect(yForLine(map, -3)).toBe(40);
    expect(yForLine(map, 99)).toBe(560);
    expect(lineForY(map, 0)).toBe(0);
    expect(lineForY(map, 9999)).toBe(12);
  });

  it("왕복하면 제자리", () => {
    for (const line of [0, 0.5, 3.25, 7, 11.9]) expect(lineForY(map, yForLine(map, line))).toBeCloseTo(line, 6);
  });

  it("거꾸로 가는 닻은 버린다", () => {
    const m = buildSyncMap([
      { line: 0, y: 0 },
      { line: 5, y: 200 },
      { line: 4, y: 250 },
      { line: 8, y: 150 },
      { line: 9, y: 300 },
    ]);
    expect(m).toEqual({ lines: [0, 5, 9], ys: [0, 200, 300] });
  });

  it("빈 지도는 0", () => {
    expect(yForLine({ lines: [], ys: [] }, 3)).toBe(0);
    expect(lineForY({ lines: [], ys: [] }, 3)).toBe(0);
  });

  it("폭 비율은 20~80 %", () => {
    expect(clampSplit(0.05)).toBe(0.2);
    expect(clampSplit(0.95)).toBe(0.8);
    expect(clampSplit(0.6)).toBe(0.6);
  });
});
