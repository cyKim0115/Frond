import { describe, expect, it } from "vitest";
import { decodePercent, isAbsoluteWindowsPath, resolvePath } from "./paths";

describe("resolvePath", () => {
  it("문서 폴더 기준 상대 경로를 절대 경로로 만든다", () => {
    expect(resolvePath("C:\\docs", "img.png")).toBe("C:\\docs\\img.png");
    expect(resolvePath("C:\\docs\\", "./a/b.png")).toBe("C:\\docs\\a\\b.png");
    expect(resolvePath("C:/docs", "a/b\\c.png")).toBe("C:\\docs\\a\\b\\c.png");
  });

  it("..을 정리하고 루트 위로는 올라가지 않는다", () => {
    expect(resolvePath("C:\\docs\\sub", "../x.png")).toBe("C:\\docs\\x.png");
    expect(resolvePath("C:\\docs", "../../../x.png")).toBe("C:\\x.png");
    expect(resolvePath("C:\\", "a/../b.png")).toBe("C:\\b.png");
  });

  it("퍼센트 인코딩을 한 번만 풀고 한글·공백·[·#를 보존한다", () => {
    expect(resolvePath("C:\\docs", "%ED%95%9C%EA%B8%80%20%ED%8F%B4%EB%8D%94/%5Bimg%5D.png")).toBe("C:\\docs\\한글 폴더\\[img].png");
    expect(resolvePath("C:\\docs", "hash/%23tag.png")).toBe("C:\\docs\\hash\\#tag.png");
    expect(resolvePath("C:\\docs", "hash/#tag.png")).toBe("C:\\docs\\hash\\#tag.png");
    expect(resolvePath("C:\\docs", "100%.png")).toBe("C:\\docs\\100%.png");
    expect(resolvePath("C:\\docs", "a%2520b.png")).toBe("C:\\docs\\a%20b.png");
  });

  it("절대 경로가 오면 baseDir을 무시한다", () => {
    expect(resolvePath("C:\\docs", "D:\\other\\x.png")).toBe("D:\\other\\x.png");
    expect(resolvePath("C:\\docs", "d:/other/x.png")).toBe("D:\\other\\x.png");
    expect(resolvePath("C:\\docs", "\\root.png")).toBe("C:\\root.png");
  });

  it("UNC 경로를 지원한다", () => {
    expect(resolvePath("\\\\server\\share\\docs", "../a.png")).toBe("\\\\server\\share\\a.png");
    expect(resolvePath("//server/share/docs", "b.png")).toBe("\\\\server\\share\\docs\\b.png");
  });
});

describe("isAbsoluteWindowsPath / decodePercent", () => {
  it("드라이브·UNC만 절대 경로로 본다", () => {
    expect(isAbsoluteWindowsPath("C:\\x")).toBe(true);
    expect(isAbsoluteWindowsPath("c:/x")).toBe(true);
    expect(isAbsoluteWindowsPath("\\\\srv\\share")).toBe(true);
    expect(isAbsoluteWindowsPath("C:x")).toBe(false);
    expect(isAbsoluteWindowsPath("docs/x")).toBe(false);
    expect(isAbsoluteWindowsPath("https://x")).toBe(false);
  });

  it("잘못된 시퀀스는 원문을 돌려준다", () => {
    expect(decodePercent("%E1%84%92")).toBe("\u1112");
    expect(decodePercent("100%")).toBe("100%");
    expect(decodePercent("plain")).toBe("plain");
  });
});
