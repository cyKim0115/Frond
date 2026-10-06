import { describe, expect, it } from "vitest";
import { normalizeSession, readSession, writeSession } from "./session";

describe("세션 복원 값 (로드맵 3-5)", () => {
  it("올바른 탭만 남기고 활성 번호를 범위 안으로 맞춘다", () => {
    const got = normalizeSession({
      tabs: [
        { path: "C:\\a.md", mode: "view", line: 3 },
        { path: "", mode: "view", line: 0 },
        { path: "C:\\b.md", mode: "bogus", line: 0 },
        { path: "C:\\c.md", mode: "source", line: -1 },
        { path: "C:\\d.md", mode: "split", line: 10, extra: true },
      ],
      active: 9,
    });
    expect(got).toEqual({
      tabs: [
        { path: "C:\\a.md", mode: "view", line: 3 },
        { path: "C:\\d.md", mode: "split", line: 10 },
      ],
      active: 1,
    });
  });

  it("탭이 없거나 모양이 틀리면 null", () => {
    expect(normalizeSession(null)).toBeNull();
    expect(normalizeSession({ tabs: [] })).toBeNull();
    expect(normalizeSession({ tabs: "x" })).toBeNull();
    expect(normalizeSession([1, 2])).toBeNull();
  });

  it("쓰고 읽으면 같고, 빈 세션은 지운다", () => {
    const session = { tabs: [{ path: "C:\\노트\\a.md", mode: "source" as const, line: 42 }], active: 0 };
    writeSession(session);
    expect(readSession()).toEqual(session);
    writeSession({ tabs: [], active: 0 });
    expect(readSession()).toBeNull();
  });
});
