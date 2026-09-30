import { beforeEach, describe, expect, it } from "vitest";
import { docTitle, loadRecent, pushRecent, removeRecent, retitleRecent, saveRecent, splitPath } from "./recent";

const MAX = 20;
const e = (path: string, title?: string) => (title ? { path, title } : { path });
const h = (level: number, text: string) => ({ level, text, id: "", line: 0 });

describe("docTitle", () => {
  it("front matter의 title을 첫 H1보다 먼저 쓴다", () => {
    expect(docTitle([h(1, "본문 제목")], "layout: post\ntitle: 문서 제목\n")).toBe("문서 제목");
  });

  it("따옴표를 벗기고 줄 끝 주석을 뗀다", () => {
    expect(docTitle([], 'title: "따옴표: 제목"')).toBe("따옴표: 제목");
    expect(docTitle([], "title: 'It''s'")).toBe("It's");
    expect(docTitle([], "title: 제목 # 주석")).toBe("제목");
  });

  it("중첩 키·여러 줄 값·빈 값은 건너뛰고 첫 H1로", () => {
    expect(docTitle([h(1, "H1")], "meta:\n  title: 중첩")).toBe("H1");
    expect(docTitle([h(1, "H1")], "title: |\n  여러 줄")).toBe("H1");
    expect(docTitle([h(1, "H1")], "title:")).toBe("H1");
  });

  it("H1이 없으면 ## 이하는 쓰지 않는다", () => {
    expect(docTitle([h(2, "개요"), h(3, "설치")])).toBeUndefined();
    expect(docTitle([h(2, "개요"), h(1, "뒤에 나온 H1")])).toBe("뒤에 나온 H1");
  });

  it("너무 긴 제목은 저장용으로 자른다", () => {
    const title = docTitle([h(1, "가".repeat(300))])!;
    expect(title).toHaveLength(120);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("pushRecent", () => {
  it("새 경로를 맨 앞에 넣는다", () => {
    expect(pushRecent([e("C:\\a.md")], e("C:\\b.md"), MAX)).toEqual([e("C:\\b.md"), e("C:\\a.md")]);
  });

  it("이미 있는 경로는 맨 앞으로 옮기고 대소문자는 가리지 않는다 — 제목은 새 값", () => {
    const list = [e("C:\\a.md"), e("C:\\Docs\\B.md", "옛 제목"), e("C:\\c.md")];
    expect(pushRecent(list, e("c:\\docs\\b.md", "새 제목"), MAX)).toEqual([
      e("c:\\docs\\b.md", "새 제목"),
      e("C:\\a.md"),
      e("C:\\c.md"),
    ]);
  });

  it("최대 개수를 넘으면 가장 오래된 것부터 뺀다", () => {
    const full = Array.from({ length: MAX }, (_, i) => e(`C:\\${i}.md`));
    const next = pushRecent(full, e("C:\\new.md"), MAX);
    expect(next).toHaveLength(MAX);
    expect(next[0]).toEqual(e("C:\\new.md"));
    expect(next).not.toContainEqual(e(`C:\\${MAX - 1}.md`));
  });

  it("원래 배열을 바꾸지 않는다", () => {
    const list = [e("C:\\a.md")];
    pushRecent(list, e("C:\\b.md"), MAX);
    expect(list).toEqual([e("C:\\a.md")]);
  });
});

describe("removeRecent", () => {
  it("대소문자를 가리지 않고 한 항목만 뺀다", () => {
    expect(removeRecent([e("C:\\A.md"), e("C:\\b.md")], "c:\\a.md")).toEqual([e("C:\\b.md")]);
  });
});

describe("retitleRecent", () => {
  it("순서는 두고 그 항목의 제목만 바꾼다", () => {
    const list = [e("C:\\a.md", "가"), e("C:\\B.md", "나")];
    expect(retitleRecent(list, "c:\\b.md", "다")).toEqual([e("C:\\a.md", "가"), e("C:\\B.md", "다")]);
  });

  it("제목이 사라지면 title을 뺀다", () => {
    expect(retitleRecent([e("C:\\a.md", "가")], "C:\\a.md", undefined)).toEqual([e("C:\\a.md")]);
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
    saveRecent([e("C:\\a.md", "제목"), e("C:\\b.md")]);
    expect(loadRecent()).toEqual([e("C:\\a.md", "제목"), e("C:\\b.md")]);
  });

  it("예전 형식(경로 문자열 배열)도 읽는다", () => {
    localStorage.setItem("mdeditor.recent", JSON.stringify(["C:\\a.md", "C:\\b.md"]));
    expect(loadRecent()).toEqual([e("C:\\a.md"), e("C:\\b.md")]);
  });

  it("깨진 값은 빈 목록으로, 깨진 항목은 건너뛰고 읽는다", () => {
    localStorage.setItem("mdeditor.recent", "{not json");
    expect(loadRecent()).toEqual([]);
    localStorage.setItem("mdeditor.recent", JSON.stringify([1, 2]));
    expect(loadRecent()).toEqual([]);
    localStorage.setItem("mdeditor.recent", JSON.stringify([{ title: "경로 없음" }, { path: "C:\\a.md", title: 3 }]));
    expect(loadRecent()).toEqual([e("C:\\a.md")]);
  });
});
