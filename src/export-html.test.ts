import { describe, expect, it } from "vitest";
import { assetUrlToPath, buildExportHtml, relativePath } from "./export-html";
import { renderMarkdown } from "./render";

describe("HTML 내보내기 (로드맵 4-4)", () => {
  it("asset URL → 파일 경로", () => {
    expect(assetUrlToPath(`http://asset.localhost/${encodeURIComponent("C:\\문서\\그림 1.png")}`)).toBe("C:\\문서\\그림 1.png");
    expect(assetUrlToPath("https://example.com/a.png")).toBeNull();
  });

  it("상대 경로 — 같은 폴더·하위·상위, 드라이브가 다르면 file URL", () => {
    expect(relativePath("C:\\docs", "C:\\docs\\assets\\a b.png")).toBe("assets/a%20b.png");
    expect(relativePath("C:\\docs\\out", "C:\\docs\\img\\x.png")).toBe("../img/x.png");
    expect(relativePath("c:\\Docs", "C:\\docs\\x.png")).toBe("x.png");
    expect(relativePath("C:\\docs", "D:\\pics\\한.png")).toBe(`file:///D:/pics/${encodeURIComponent("한.png")}`);
  });

  it("앱 속성을 빼고 이미지를 넣거나 경로로 두며 제목·테마를 담는다", async () => {
    const article = document.createElement("article");
    article.className = "markdown-body doc";
    const toAssetUrl = (p: string): string => `http://asset.localhost/${encodeURIComponent(p)}`;
    article.innerHTML = renderMarkdown("# 제목 <b>\n\n![a](assets/a.png) [다음](next.md)\n", { baseDir: "C:\\docs", toAssetUrl }).html;
    const common = { article, title: "제목 <b>", themeCss: ":root{--x:1}", dark: true, bodyMaxWidth: 900, outDir: "C:\\docs" };
    const embedded = await buildExportHtml({ ...common, images: "embed", readImage: async () => new Uint8Array([1, 2, 3]).buffer });
    expect(embedded).toContain("<title>제목 &lt;b&gt;</title>");
    expect(embedded).toContain('data-theme="dark"');
    expect(embedded).toContain('src="data:image/png;base64,AQID"');
    expect(embedded).toContain('href="next.md"');
    expect(embedded).not.toContain("data-line");
    expect(embedded).not.toContain("data-local-path");
    expect(embedded).toContain("--body-max-width: 900px");
    expect(embedded).not.toContain("D2Coding.woff2");
    const linked = await buildExportHtml({ ...common, images: "link", readImage: async () => new ArrayBuffer(0) });
    expect(linked).toContain('src="assets/a.png"');
  });
});
