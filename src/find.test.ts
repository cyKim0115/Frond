import { describe, expect, it } from "vitest";
import { matchOffsets } from "./find";

describe("matchOffsets", () => {
  it("대소문자를 가리지 않고 겹치지 않게 모두 찾는다", () => {
    expect(matchOffsets("Aa aA", "aa")).toEqual([
      [0, 2],
      [3, 5],
    ]);
    expect(matchOffsets("aaaa", "aa")).toEqual([
      [0, 2],
      [2, 4],
    ]);
  });

  it("정규식 문자는 글자 그대로 찾는다", () => {
    expect(matchOffsets("a.b a*b (x)", "a*b")).toEqual([[4, 7]]);
    expect(matchOffsets("(x)", "(x)")).toEqual([[0, 3]]);
  });

  it("한글·빈 검색어·상한", () => {
    expect(matchOffsets("가나다 가나", "가나")).toEqual([
      [0, 2],
      [4, 6],
    ]);
    expect(matchOffsets("abc", "")).toEqual([]);
    expect(matchOffsets("x".repeat(10), "x", 3)).toHaveLength(3);
  });
});
