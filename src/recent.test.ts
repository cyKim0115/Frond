import { beforeEach, describe, expect, it } from "vitest";
import { loadRecent, pushRecent, removeRecent, saveRecent, splitPath } from "./recent";

const MAX = 20;

describe("pushRecent", () => {
  it("새 경로를 맨 앞에 넣는다", () => {
    expect(pushRecent(["C:\\a.md"], "C:\\b.md", MAX)).toEqual(["C:\\b.md", "C:\\a.md"]);
  });

  it("이미 있는 경로는 맨 앞으로 옮기고 대소문자는 가리지 않는다", () => {
    const list = ["C:\\a.md", "C:\\Docs\\B.md", "C:\\c.md"];
    expect(pushRecent(list, "c:\\docs\\b.md", MAX)).toEqual(["c:\\docs\\b.md", "C:\\a.md", "C:\\c.md"]);
  });

  it("최대 개수를 넘으면 가장 오래된 것부터 뺀다", () => {
    const full = Array.from({ length: MAX }, (_, i) => `C:\\${i}.md`);
    const next = pushRecent(full, "C:\\new.md", MAX);
    expect(next).toHaveLength(MAX);
    expect(next[0]).toBe("C:\\new.md");
    expect(next).not.toContain(`C:\\${MAX - 1}.md`);
  });

  it("원래 배열을 바꾸지 않는다", () => {
    const list = ["C:\\a.md"];
    pushRecent(list, "C:\\b.md", MAX);
    expect(list).toEqual(["C:\\a.md"]);
  });
});

describe("removeRecent", () => {
  it("대소문자를 가리지 않고 한 항목만 뺀다", () => {
    expect(removeRecent(["C:\\A.md", "C:\\b.md"], "c:\\a.md")).toEqual(["C:\\b.md"]);
  });
});

describe("splitPath", () => {
  it("Windows·슬래시 경로를 이름과 폴더로 나눈다", () => {
    expect(splitPath("C:\\한글 폴더\\문서 #1.md")).toEqual({ name: "문서 #1.md", dir: "C:\\한글 폴더" });
    expect(splitPath("samples/showcase.md")).toEqual({ name: "showcase.md", dir: "samples" });
    expect(splitPath("readme.md")).toEqual({ name: "readme.md", dir: "" });
  });
});

describe("loadRecent / saveRecent", () => {
  beforeEach(() => localStorage.clear());

  it("저장한 목록을 그대로 읽는다", () => {
    saveRecent(["C:\\a.md", "C:\\b.md"]);
    expect(loadRecent()).toEqual(["C:\\a.md", "C:\\b.md"]);
  });

  it("깨진 값은 빈 목록으로 읽는다", () => {
    localStorage.setItem("mdeditor.recent", "{not json");
    expect(loadRecent()).toEqual([]);
    localStorage.setItem("mdeditor.recent", JSON.stringify([1, 2]));
    expect(loadRecent()).toEqual([]);
  });
});
